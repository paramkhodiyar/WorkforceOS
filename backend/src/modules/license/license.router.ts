import { Router } from "express";
import { activateLicense, getLicenseDetails } from "./license.controller";
import { rateLimit } from "../../middleware/rateLimit.middleware";

const router = Router();

router.get("/", getLicenseDetails);
router.post("/activate", rateLimit(5, 60), activateLicense);

export const licenseRouter = router;
