import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { getOrgMetadata, getOrgBySlug, updateOrgFeatures, updateOrgLocation } from "./organization.controller";
import { updateFeaturesSchema, updateLocationSchema } from "./organization.validation";

const router = Router();

router.get("/slug/:slug", getOrgBySlug);
router.get("/me", authenticate, getOrgMetadata);
router.patch("/:orgId/features", authenticate, validate(updateFeaturesSchema), updateOrgFeatures);
router.patch("/:orgId/location", authenticate, validate(updateLocationSchema), updateOrgLocation);

export const organizationRouter = router;
