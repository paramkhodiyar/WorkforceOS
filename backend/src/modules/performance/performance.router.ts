import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  getMetrics,
  listReviews,
  createReview,
  getReviewById,
  updateReview,
  getLeaderboard
} from "./performance.controller";
import {
  getMetricsSchema,
  getReviewsSchema,
  createReviewSchema,
  updateReviewSchema,
  getLeaderboardSchema
} from "./performance.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("performance"));

router.get("/metrics/:userId", validate(getMetricsSchema, "query"), getMetrics);
router.get("/reviews", validate(getReviewsSchema, "query"), listReviews);
router.post("/reviews", requirePermission("performance", "review"), validate(createReviewSchema), createReview);
router.get("/reviews/:id", getReviewById);
router.patch("/reviews/:id", validate(updateReviewSchema), updateReview);
router.get("/leaderboard", requirePermission("performance", "leaderboard"), validate(getLeaderboardSchema, "query"), getLeaderboard);

export const performanceRouter = router;
