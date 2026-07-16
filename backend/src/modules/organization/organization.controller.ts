import { Request, Response } from "express";
import { OrganizationService } from "./organization.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const getOrgMetadata = asyncHandler(async (req: Request, res: Response) => {
  const org = await OrganizationService.getById(req.org!.id);
  if (!org) {
    throw AppError.notFound("Organization not found");
  }
  return sendSuccess(res, org);
});

export const getOrgBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const org = await OrganizationService.getBySlug(slug);
  if (!org) {
    throw AppError.notFound("Organization not found");
  }
  return sendSuccess(res, org);
});

export const updateOrgFeatures = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.systemRole !== "SUPER_ADMIN" && req.user!.systemRole !== "ORG_ADMIN") {
    throw AppError.forbidden("Only organization administrators are authorized to configure features");
  }

  const { orgId } = req.params;

  if (req.user!.systemRole === "ORG_ADMIN" && req.user!.organizationId !== orgId) {
    throw AppError.forbidden("You can only configure features for your own organization");
  }

  const { enabledFeatures } = req.body;

  const updated = await OrganizationService.updateFeatures(orgId, enabledFeatures, req.user!.id, req);
  return sendSuccess(res, updated, "Organization features configured successfully");
});

export const updateOrgLocation = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.systemRole !== "SUPER_ADMIN" && req.user!.systemRole !== "ORG_ADMIN") {
    throw AppError.forbidden("Only organization administrators are authorized to configure geofencing settings");
  }

  const { orgId } = req.params;

  if (req.user!.systemRole === "ORG_ADMIN" && req.user!.organizationId !== orgId) {
    throw AppError.forbidden("You can only configure geofencing settings for your own organization");
  }

  const { officeLatitude, officeLongitude, officeRadius } = req.body;

  const updated = await OrganizationService.updateLocation(
    orgId,
    { officeLatitude, officeLongitude, officeRadius },
    req.user!.id,
    req
  );
  return sendSuccess(res, updated, "Organization geofencing configured successfully");
});

export const verifyUpi = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.systemRole !== "SUPER_ADMIN" && req.user!.systemRole !== "ORG_ADMIN") {
    throw AppError.forbidden("Only organization administrators are authorized to verify payments");
  }

  const { utr, tier } = req.body;
  const orgId = req.org!.id;

  const updated = await OrganizationService.verifyUpi(orgId, utr, tier, req.user!.id, req);
  return sendSuccess(res, updated, "Payment verified and organization subscription updated successfully");
});
