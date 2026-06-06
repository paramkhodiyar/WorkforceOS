import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listArticles,
  createArticle,
  getArticle,
  updateArticle,
  publishArticle,
  deleteArticle,
  getVersions,
  getVersionById
} from "./knowledge.controller";
import { createArticleSchema, updateArticleSchema, getArticlesSchema } from "./knowledge.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("knowledge"));

router.get("/articles", validate(getArticlesSchema, "query"), listArticles);
router.post("/articles", requirePermission("knowledge", "create"), validate(createArticleSchema), createArticle);
router.get("/articles/:id", getArticle);
router.patch("/articles/:id", requirePermission("knowledge", "update"), validate(updateArticleSchema), updateArticle);
router.post("/articles/:id/publish", requirePermission("knowledge", "publish"), publishArticle);
router.delete("/articles/:id", requirePermission("knowledge", "delete"), deleteArticle);
router.get("/articles/:id/versions", getVersions);
router.get("/articles/:id/versions/:versionId", getVersionById);

export const knowledgeRouter = router;
