import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listAssets,
  createAsset,
  updateAsset,
  assignAsset,
  returnAsset,
  getHistory,
  getEmployeeAssets
} from "./assets.controller";
import {
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  returnAssetSchema,
  getAssetsFilterSchema
} from "./assets.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("assets"));

router.get("/", requirePermission("asset", "read"), validate(getAssetsFilterSchema, "query"), listAssets);
router.post("/", requirePermission("asset", "create"), validate(createAssetSchema), createAsset);
router.patch("/:id", requirePermission("asset", "update"), validate(updateAssetSchema), updateAsset);
router.post("/:id/assign", requirePermission("asset", "assign"), validate(assignAssetSchema), assignAsset);
router.post("/:id/return", validate(returnAssetSchema), returnAsset);
router.get("/:id/history", getHistory);
router.get("/employee/:id", getEmployeeAssets);

export const assetsRouter = router;
