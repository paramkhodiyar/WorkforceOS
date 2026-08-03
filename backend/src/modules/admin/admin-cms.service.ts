import { prisma } from "../../config/database";
import { AppError } from "../../utils/errors.util";
import { generatePersonalizedLicenseKey } from "../license/license.util";
import { SubscriptionTier, LicenseType, LicenseStatus, PaymentStatus } from "@prisma/client";

export class AdminCmsService {
  /**
   * List all customer organizations with subscription & seat telemetry.
   */
  static async listAllCustomers(search?: string, page = 1, limit = 20) {
    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { licenseKey: { contains: search, mode: "insensitive" } }
      ];
    }

    const total = await prisma.organization.count({ where });
    const orgs = await prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { users: true }
        },
        users: {
          where: {
            OR: [
              { systemRole: "ORG_ADMIN" },
              { roles: { some: { role: { name: "ORG_ADMIN" } } } }
            ]
          },
          take: 1,
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      }
    });

    const items = orgs.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      licenseKey: org.licenseKey,
      licenseStatus: org.licenseStatus,
      licenseValidUntil: org.licenseValidUntil,
      licenseMaxEmployees: org.licenseMaxEmployees,
      subscriptionStatus: org.subscriptionStatus,
      subscriptionTier: org.subscriptionTier,
      activeEmployeesCount: org._count.users,
      adminContact: org.users[0] || null,
      createdAt: org.createdAt
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Generates a custom license key for an organization or unassigned client.
   */
  static async generateCustomKey(data: {
    companyName: string;
    tier: SubscriptionTier;
    type?: LicenseType;
    maxEmployees?: number;
    validityDays?: number;
    notes?: string;
    orgId?: string;
  }) {
    const type = data.type || LicenseType.SUBSCRIPTION;
    const { key, companyShort } = generatePersonalizedLicenseKey(data.companyName, data.tier, type);
    const validityDays = data.validityDays || 365;
    const maxEmployees = data.maxEmployees || (data.tier === "STARTUP" ? 15 : data.tier === "GROWTH" ? 50 : 1000);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const createdKey = await prisma.licenseKey.create({
      data: {
        key,
        companyShort,
        tier: data.tier,
        type,
        status: data.orgId ? LicenseStatus.ACTIVE : LicenseStatus.UNASSIGNED,
        maxEmployees,
        validityDays,
        activatedAt: data.orgId ? new Date() : null,
        activatedByOrgId: data.orgId || null,
        expiresAt: validUntil,
        notes: data.notes || "Minted via Platform Admin CMS"
      }
    });

    if (data.orgId) {
      await prisma.organization.update({
        where: { id: data.orgId },
        data: {
          licenseKey: key,
          licenseStatus: LicenseStatus.ACTIVE,
          licenseValidUntil: validUntil,
          licenseMaxEmployees: maxEmployees,
          subscriptionStatus: "ACTIVE",
          subscriptionTier: data.tier
        }
      });
    }

    return createdKey;
  }

  /**
   * Toggles customer organization license status.
   */
  static async updateCustomerStatus(orgId: string, status: LicenseStatus) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw AppError.notFound("Organization not found");

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        licenseStatus: status,
        subscriptionStatus: status === LicenseStatus.ACTIVE ? "ACTIVE" : "EXPIRED"
      }
    });

    return updated;
  }

  /**
   * List customer invoices / payment claims.
   */
  static async listInvoices(status?: PaymentStatus) {
    const where: any = {};
    if (status) where.status = status;

    const invoices = await prisma.customerInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, subscriptionTier: true, licenseKey: true }
        }
      }
    });

    return invoices;
  }

  /**
   * Approves or rejects a customer payment invoice.
   */
  static async verifyInvoice(invoiceId: string, isApproved: boolean, notes?: string, actorId?: string) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { organization: true }
    });
    if (!invoice) throw AppError.notFound("Invoice record not found");

    const newStatus = isApproved ? PaymentStatus.VERIFIED : PaymentStatus.REJECTED;

    const updatedInvoice = await prisma.customerInvoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        verifiedAt: new Date(),
        verifiedByUserId: actorId,
        rejectionReason: !isApproved ? (notes || "Payment verification declined by admin") : null
      }
    });

    if (isApproved) {
      // Auto-mint & activate subscription for org
      const { key, companyShort } = generatePersonalizedLicenseKey(invoice.organization.name, invoice.tier, LicenseType.SUBSCRIPTION);
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 365);
      const maxSeats = invoice.tier === "STARTUP" ? 15 : invoice.tier === "GROWTH" ? 50 : 1000;

      await prisma.organization.update({
        where: { id: invoice.organizationId },
        data: {
          licenseKey: key,
          licenseStatus: LicenseStatus.ACTIVE,
          licenseValidUntil: validUntil,
          licenseMaxEmployees: maxSeats,
          subscriptionStatus: "ACTIVE",
          subscriptionTier: invoice.tier
        }
      });
    }

    return updatedInvoice;
  }
}
