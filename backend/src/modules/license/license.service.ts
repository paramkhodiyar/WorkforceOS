import { prisma } from "../../config/database";
import { AppError } from "../../utils/errors.util";
import { generatePersonalizedLicenseKey, isValidLicenseKeyFormat } from "./license.util";
import { SubscriptionTier, LicenseType, LicenseStatus } from "@prisma/client";

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  STARTUP: ["employees", "attendance", "leave", "tasks", "calendar", "notifications"],
  GROWTH: ["employees", "attendance", "leave", "tasks", "performance", "payroll", "expenses", "calendar", "notifications", "audit"],
  ENTERPRISE: ["employees", "attendance", "leave", "tasks", "performance", "payroll", "expenses", "assets", "knowledge", "notifications", "audit", "calendar"]
};

const TIER_DEFAULT_SEATS: Record<SubscriptionTier, number> = {
  STARTUP: 15,
  GROWTH: 50,
  ENTERPRISE: 1000
};

export class LicenseService {
  /**
   * Activates a license key for an organization.
   */
  static async activateLicenseKey(keyString: string, orgId: string, actorId?: string) {
    const cleanKey = keyString.trim().toUpperCase();
    if (!isValidLicenseKeyFormat(cleanKey)) {
      throw AppError.badRequest("Invalid License Key format. Key format must be WFOS-XXXX-XXXX-XXXX.");
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });
    if (!org) {
      throw AppError.notFound("Organization not found");
    }

    // Check if key exists in LicenseKey model
    let dbKey = await prisma.licenseKey.findUnique({
      where: { key: cleanKey }
    });

    if (dbKey) {
      if (dbKey.status === LicenseStatus.REVOKED) {
        throw AppError.forbidden("This license key has been revoked by system administrators.");
      }
      if (dbKey.activatedByOrgId && dbKey.activatedByOrgId !== orgId) {
        throw AppError.badRequest("This license key is already active for another organization.");
      }
    }

    // Determine Tier & Type from key
    const parts = cleanKey.split("-");
    const tierCode = parts[2];
    let tier: SubscriptionTier = SubscriptionTier.GROWTH;
    let type: LicenseType = LicenseType.SUBSCRIPTION;
    let validityDays = 365;
    let maxEmployees = 50;

    if (tierCode === "TRAL") {
      tier = SubscriptionTier.STARTUP;
      type = LicenseType.TRIAL;
      validityDays = 14;
      maxEmployees = 15;
    } else if (tierCode === "STRT") {
      tier = SubscriptionTier.STARTUP;
      type = LicenseType.SUBSCRIPTION;
      validityDays = 365;
      maxEmployees = 15;
    } else if (tierCode === "GWTH") {
      tier = SubscriptionTier.GROWTH;
      type = LicenseType.SUBSCRIPTION;
      validityDays = 365;
      maxEmployees = 50;
    } else if (tierCode === "ENTR") {
      tier = SubscriptionTier.ENTERPRISE;
      type = LicenseType.PERPETUAL;
      validityDays = 3650; // 10 years for perpetual
      maxEmployees = 1000;
    }

    if (dbKey) {
      tier = dbKey.tier;
      type = dbKey.type;
      validityDays = dbKey.validityDays;
      maxEmployees = dbKey.maxEmployees;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create or update LicenseKey entry
    if (!dbKey) {
      dbKey = await prisma.licenseKey.create({
        data: {
          key: cleanKey,
          companyShort: parts[1],
          tier,
          type,
          status: LicenseStatus.ACTIVE,
          maxEmployees,
          validityDays,
          activatedAt: new Date(),
          activatedByOrgId: orgId,
          expiresAt: validUntil,
          notes: `Activated via UI by org Admin (${org.name})`
        }
      });
    } else {
      await prisma.licenseKey.update({
        where: { id: dbKey.id },
        data: {
          status: LicenseStatus.ACTIVE,
          activatedAt: new Date(),
          activatedByOrgId: orgId,
          expiresAt: validUntil
        }
      });
    }

    // Enable features for the tier
    const enabledFeatures = TIER_FEATURES[tier] || TIER_FEATURES.GROWTH;

    // Update organization with active license
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        licenseKey: cleanKey,
        licenseStatus: LicenseStatus.ACTIVE,
        licenseValidUntil: validUntil,
        licenseMaxEmployees: maxEmployees,
        subscriptionStatus: "ACTIVE",
        subscriptionTier: tier,
        enabledFeatures
      }
    });

    return {
      organization: updatedOrg,
      licenseKey: cleanKey,
      tier,
      validUntil,
      maxEmployees
    };
  }

  /**
   * Retrieves license info and employee seat count.
   */
  static async getOrganizationLicense(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        licenseKey: true,
        licenseStatus: true,
        licenseValidUntil: true,
        licenseMaxEmployees: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndDate: true
      }
    });

    if (!org) {
      throw AppError.notFound("Organization not found");
    }

    if (!org.licenseKey && org.subscriptionStatus === "TRIAL") {
      const { key } = generatePersonalizedLicenseKey(org.name, "TRIAL", LicenseType.TRIAL);
      const trialEndDate = org.trialEndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          licenseKey: key,
          licenseStatus: LicenseStatus.ACTIVE,
          licenseValidUntil: trialEndDate,
          licenseMaxEmployees: 15
        }
      }).catch(() => {});
      org.licenseKey = key;
    }

    const activeEmployeesCount = await prisma.user.count({
      where: { organizationId: orgId, status: "ACTIVE", isDeleted: false }
    });

    // Mask license key for privacy: WFOS-ACME-****-9482
    let maskedKey = "No active key";
    if (org.licenseKey) {
      const parts = org.licenseKey.split("-");
      if (parts.length === 4) {
        maskedKey = `${parts[0]}-${parts[1]}-****-${parts[3]}`;
      } else {
        maskedKey = org.licenseKey;
      }
    }

    const isExpired = org.licenseValidUntil ? new Date() > new Date(org.licenseValidUntil) : false;

    return {
      ...org,
      maskedKey,
      activeEmployeesCount,
      isExpired,
      seatsRemaining: Math.max(0, org.licenseMaxEmployees - activeEmployeesCount)
    };
  }

  /**
   * Deactivates or revokes an organization's license.
   */
  static async setOrganizationLicenseStatus(orgId: string, status: LicenseStatus) {
    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        licenseStatus: status,
        subscriptionStatus: status === LicenseStatus.ACTIVE ? "ACTIVE" : "EXPIRED"
      }
    });

    return updated;
  }
}
