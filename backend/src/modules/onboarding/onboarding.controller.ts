import { Request, Response } from "express";
import { OnboardingService } from "./onboarding.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const onboard = asyncHandler(async (req: Request, res: Response) => {
  const result = await OnboardingService.onboardCompany(req.body, req);
  return sendSuccess(res, result, "Company onboarded successfully");
});

export const uploadEmployees = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new Error("No file uploaded");
  }
  const result = await OnboardingService.parseEmployeesExcel(req.file.buffer);
  return sendSuccess(res, result, "Excel file parsed successfully");
});

export const setupExisting = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const adminUserId = req.user!.id;
  const result = await OnboardingService.setupExistingCompany(orgId, adminUserId, req.body, req);
  return sendSuccess(res, result, "Organization setup successfully");
});
