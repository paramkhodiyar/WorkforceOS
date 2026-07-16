import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { onboardingSchema } from "./onboarding.validation";
import { onboard, uploadEmployees, setupExisting } from "./onboarding.controller";
import multer from "multer";

const router = Router();
const memoryUpload = multer({ storage: multer.memoryStorage() });

router.post("/", validate(onboardingSchema), onboard);
router.post("/setup", authenticate, setupExisting);
router.post("/upload-employees", memoryUpload.single("file"), uploadEmployees);

export const onboardingRouter = router;
