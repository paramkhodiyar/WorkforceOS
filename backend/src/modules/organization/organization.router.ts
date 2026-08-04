import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import { 
  getOrgMetadata, 
  getOrgBySlug, 
  updateOrgFeatures, 
  updateOrgLocation, 
  verifyUpi,
  listHolidays,
  createHoliday,
  deleteHoliday,
  getOrgSettings,
  updateOrgSettings
} from "./organization.controller";
import { updateFeaturesSchema, updateLocationSchema } from "./organization.validation";
import { createHolidaySchema } from "./holiday.validation";

const router = Router();

router.get("/me", authenticate, getOrgMetadata);
router.get("/slug/:slug", getOrgBySlug);
router.post("/verify-upi", authenticate, verifyUpi);
router.patch("/:orgId/features", authenticate, validate(updateFeaturesSchema), updateOrgFeatures);
router.patch("/:orgId/location", authenticate, validate(updateLocationSchema), updateOrgLocation);

// Workplace Settings (OrgSettings)
router.get("/settings", authenticate, getOrgSettings);
router.patch("/settings", authenticate, updateOrgSettings);

// Holiday Management
router.get("/holidays", authenticate, listHolidays);
router.post("/holidays", authenticate, requirePermission("leave", ["manage_policy"]), validate(createHolidaySchema), createHoliday);
router.delete("/holidays/:id", authenticate, requirePermission("leave", ["manage_policy"]), deleteHoliday);

export const organizationRouter = router;
