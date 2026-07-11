import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { onboardingSchema } from "./onboarding.validation";
import { onboard } from "./onboarding.controller";

const router = Router();

router.post("/", validate(onboardingSchema), onboard);

export const onboardingRouter = router;
