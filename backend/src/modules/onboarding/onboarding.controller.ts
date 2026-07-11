import { Request, Response } from "express";
import { OnboardingService } from "./onboarding.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const onboard = asyncHandler(async (req: Request, res: Response) => {
  const result = await OnboardingService.onboardCompany(req.body, req);
  return sendSuccess(res, result, "Company onboarded successfully");
});
