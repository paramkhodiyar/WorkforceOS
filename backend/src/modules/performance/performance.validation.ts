import { z } from "zod";

export const getMetricsSchema = z.object({
  period: z.string().min(1),
  type: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"])
});

export const getReviewsSchema = z.object({
  period: z.string().optional(),
  type: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).optional(),
  isManager: z.preprocess((val) => val === "true", z.boolean().optional())
});

export const createReviewSchema = z.object({
  subjectId: z.string().min(1),
  period: z.string().min(1),
  periodType: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
  comments: z.string().optional()
});

export const updateReviewSchema = z.object({
  comments: z.string().optional(),
  score: z.number().min(1).max(5).optional()
});

export const getLeaderboardSchema = z.object({
  departmentId: z.string().optional(),
  period: z.string().default("2026-Q1"),
  type: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).default("QUARTERLY")
});
