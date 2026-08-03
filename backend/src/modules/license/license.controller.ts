import { Request, Response } from "express";
import { LicenseService } from "./license.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const activateLicense = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { key } = req.body;
  if (!key) {
    throw AppError.badRequest("License Key is required");
  }

  const result = await LicenseService.activateLicenseKey(key, orgId, req.user?.id);
  return sendSuccess(res, result, "License key activated successfully");
});

export const getLicenseDetails = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const details = await LicenseService.getOrganizationLicense(orgId);
  return sendSuccess(res, details);
});
