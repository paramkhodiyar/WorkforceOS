import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { getOrgMetadata, getOrgBySlug, updateOrgFeatures, updateOrgLocation, verifyUpi } from "./organization.controller";
import { updateFeaturesSchema, updateLocationSchema } from "./organization.validation";

const router = Router();

router.get("/me", authenticate, getOrgMetadata);
router.get("/slug/:slug", getOrgBySlug);
router.post("/verify-upi", authenticate, verifyUpi);
router.patch("/:orgId/features", authenticate, validate(updateFeaturesSchema), updateOrgFeatures);
router.patch("/:orgId/location", authenticate, validate(updateLocationSchema), updateOrgLocation);

export const organizationRouter = router;
