import { Request, Response } from "express";
import { LicenseService } from "./license.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const activateLicense = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org?.id || req.user?.organizationId;
  const { key } = req.body;
  if (!key) {
    throw AppError.badRequest("License Key is required");
  }
  if (!orgId) {
    throw AppError.badRequest("Organization context required to activate license key.");
  }

  const result = await LicenseService.activateLicenseKey(key, orgId, req.user?.id);
  return sendSuccess(res, result, "License key activated successfully");
});

export const getLicenseDetails = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org?.id || req.user?.organizationId;
  const isSysOwner = req.user?.systemRole === "SYS_OWNER" || req.user?.originalRole === "SYS_OWNER";

  if (!orgId) {
    if (isSysOwner) {
      return sendSuccess(res, {
        id: "sys_owner_master_org",
        name: "WorkforceOS Master Platform",
        licenseKey: "WFOS-SYS-OWNER-MASTER-KEY",
        maskedKey: "WFOS-SYS-****-MASTER",
        licenseStatus: "ACTIVE",
        licenseValidUntil: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
        licenseMaxEmployees: 999999,
        activeEmployeesCount: 1,
        seatsRemaining: 999998,
        subscriptionStatus: "ACTIVE",
        subscriptionTier: "ENTERPRISE",
        isExpired: false,
        isMaster: true
      });
    }
    throw AppError.badRequest("Organization context required to fetch license");
  }

  const details = await LicenseService.getOrganizationLicense(orgId);
  return sendSuccess(res, details);
});
