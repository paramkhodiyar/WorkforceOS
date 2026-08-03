import { Request, Response } from "express";
import { AdminCmsService } from "./admin-cms.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { parsePagination } from "../../utils/pagination.util";
import { SubscriptionTier, LicenseStatus, PaymentStatus } from "@prisma/client";

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const search = req.query.search as string;

  const result = await AdminCmsService.listAllCustomers(search, page, limit);
  return sendSuccess(res, result);
});

export const mintKey = asyncHandler(async (req: Request, res: Response) => {
  const { companyName, tier, type, maxEmployees, validityDays, notes, orgId } = req.body;

  const created = await AdminCmsService.generateCustomKey({
    companyName,
    tier: tier as SubscriptionTier,
    type,
    maxEmployees: maxEmployees ? parseInt(maxEmployees, 10) : undefined,
    validityDays: validityDays ? parseInt(validityDays, 10) : undefined,
    notes,
    orgId
  });

  return sendSuccess(res, created, "Custom license key minted successfully");
});

export const updateCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.params;
  const { status } = req.body;

  const updated = await AdminCmsService.updateCustomerStatus(orgId, status as LicenseStatus);
  return sendSuccess(res, updated, `Customer license status updated to ${status}`);
});

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as PaymentStatus;
  const invoices = await AdminCmsService.listInvoices(status);
  return sendSuccess(res, invoices);
});

export const verifyInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  const { isApproved, notes } = req.body;

  const updated = await AdminCmsService.verifyInvoice(invoiceId, Boolean(isApproved), notes, req.user?.id);
  return sendSuccess(res, updated, isApproved ? "Payment invoice verified and license activated" : "Payment invoice rejected");
});
