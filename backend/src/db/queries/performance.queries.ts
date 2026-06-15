import { prisma } from "../../config/database";
import { calculateWorkingDays } from "../../utils/date.util";

/**
 * Default weight configuration for the composite performance score.
 * All weights must sum to 1.0.
 */
export const DEFAULT_WEIGHT_CONFIG = {
  taskCompletion: 0.25,   // 25% — % of tasks closed/approved
  deadlineAdherence: 0.20, // 20% — % of deadlines met on time
  qualityScore: 0.25,     // 25% — avg review score (0–10 scale, normalised) with rework penalty
  attendance: 0.20,       // 20% — attendance presence percentage
  hrFeedback: 0.10        // 10% — average of HR qualitative ratings (0–5 scale, normalised)
};

export interface WeightConfig {
  taskCompletion: number;
  deadlineAdherence: number;
  qualityScore: number;
  attendance: number;
  hrFeedback: number;
}

export interface PerformanceMetrics {
  // Raw metrics
  totalTasks: number;
  completedTasks: number;
  completionRate: number;       // 0–100

  deadlinesMet: number;         // 0–100

  avgReviewScore: number;       // 0–10 (raw average from TaskReview.score)
  reworkCount: number;
  qualityScore: number;         // 0–10 after rework penalty

  attendancePct: number;        // 0–100

  hrFeedbackAvg: number;        // 0–5 (average of hrCollaboration, hrCommunication, etc.)

  // Composite
  finalScore: number;           // 0–100
  scoreBand: string;            // S / A / B / C / D
  weights: WeightConfig;
}

function scoreToScoreBand(score: number): string {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

/**
 * Aggregates all performance metrics for a given user over a date range.
 * Uses the composite weighted formula to produce a 0–100 final score.
 *
 * @param userId - the employee being evaluated
 * @param startDate - period start
 * @param endDate - period end
 * @param weightConfig - optional custom weights (defaults to DEFAULT_WEIGHT_CONFIG)
 * @param hrFeedbackOverride - optional pre-loaded HR qualitative scores from PerformanceReview
 */
export async function aggregatePerformanceMetrics(
  userId: string,
  startDate: Date,
  endDate: Date,
  weightConfig?: Partial<WeightConfig>,
  hrFeedbackOverride?: {
    hrCollaboration?: number | null;
    hrCommunication?: number | null;
    hrDiscipline?: number | null;
    hrInitiative?: number | null;
    hrConduct?: number | null;
  }
): Promise<PerformanceMetrics> {
  const weights: WeightConfig = {
    ...DEFAULT_WEIGHT_CONFIG,
    ...(weightConfig ?? {})
  };

  // ── 1. Task metrics ──────────────────────────────────────────────────────────
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      createdAt: { gte: startDate, lte: endDate },
      isDeleted: false
    },
    include: {
      reviews: true,
      statusHistory: {
        orderBy: { changedAt: "asc" }
      }
    }
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "CLOSED" || t.status === "APPROVED"
  );
  const completionRate =
    totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 100;

  // ── 2. Deadline adherence — use TaskStatusHistory for precision ──────────────
  // A task met its deadline if the first transition to APPROVED/CLOSED was on or before dueDate.
  let deadlineCheckedCount = 0;
  let deadlineMetCount = 0;

  for (const t of completedTasks) {
    if (!t.dueDate) continue;
    deadlineCheckedCount++;

    // Find the earliest history entry that moved the task to APPROVED or CLOSED
    const completionEntry = t.statusHistory.find(
      (h) => h.toStatus === "APPROVED" || h.toStatus === "CLOSED"
    );
    const completedAt = completionEntry?.changedAt ?? t.updatedAt;

    if (completedAt <= t.dueDate) {
      deadlineMetCount++;
    }
  }

  const deadlinesMet =
    deadlineCheckedCount > 0
      ? (deadlineMetCount / deadlineCheckedCount) * 100
      : 100;

  // ── 3. Quality score (review scores + rework penalty) ────────────────────────
  let scoreSum = 0;
  let scoreCount = 0;
  let reworkCount = 0;

  for (const t of tasks) {
    for (const r of t.reviews) {
      if (r.score !== null && r.score !== undefined) {
        scoreSum += r.score;
        scoreCount++;
      }
      if (r.action === "CHANGES_REQUESTED") {
        reworkCount++;
      }
    }
  }

  // Raw average on 0–10 scale (TaskReview.score is stored as 0–10 int)
  const avgReviewScore = scoreCount > 0 ? scoreSum / scoreCount : 8.0; // generous default

  // Rework penalty: each rework reduces quality score by 0.5 (capped at –3.0)
  const reworkPenalty = Math.min(reworkCount * 0.5, 3.0);
  const qualityScore = Math.max(avgReviewScore - reworkPenalty, 0);

  // ── 4. Attendance ─────────────────────────────────────────────────────────────
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      isDeleted: false
    }
  });

  let attendedDays = 0;
  for (const att of attendanceRecords) {
    if (att.status === "PRESENT" || att.status === "LATE" || att.status === "ON_LEAVE") {
      attendedDays += 1;
    } else if (att.status === "HALF_DAY" || att.status === "EARLY_DEP") {
      attendedDays += 0.5;
    }
  }

  const workingDays = calculateWorkingDays(startDate, endDate) || 1;
  const attendancePct = Math.min((attendedDays / workingDays) * 100, 100);

  // ── 5. HR feedback (qualitative, 0–5 scale) ───────────────────────────────────
  let hrFeedbackAvg = 0;
  if (hrFeedbackOverride) {
    const hrScores = [
      hrFeedbackOverride.hrCollaboration,
      hrFeedbackOverride.hrCommunication,
      hrFeedbackOverride.hrDiscipline,
      hrFeedbackOverride.hrInitiative,
      hrFeedbackOverride.hrConduct
    ].filter((s): s is number => s !== null && s !== undefined);

    hrFeedbackAvg = hrScores.length > 0
      ? hrScores.reduce((a, b) => a + b, 0) / hrScores.length
      : 2.5; // neutral default
  } else {
    // Attempt to pull most recent HR feedback from PerformanceReview for this user
    const latestReview = await prisma.performanceReview.findFirst({
      where: {
        subjectId: userId,
        isDeleted: false,
        hrFeedbackBy: { not: null }
      },
      orderBy: { hrFeedbackAt: "desc" }
    });

    if (latestReview) {
      const hrScores = [
        latestReview.hrCollaboration,
        latestReview.hrCommunication,
        latestReview.hrDiscipline,
        latestReview.hrInitiative,
        latestReview.hrConduct
      ].filter((s): s is number => s !== null && s !== undefined);

      hrFeedbackAvg = hrScores.length > 0
        ? hrScores.reduce((a, b) => a + b, 0) / hrScores.length
        : 2.5;
    } else {
      hrFeedbackAvg = 2.5; // neutral default when no HR review exists
    }
  }

  // ── 6. Composite score (0–100) ────────────────────────────────────────────────
  // Each component is normalised to 0–100 before weighting:
  //   completionRate    — already 0–100
  //   deadlinesMet      — already 0–100
  //   qualityScore      — 0–10 → *10 for 0–100
  //   attendancePct     — already 0–100
  //   hrFeedbackAvg     — 0–5 → *20 for 0–100

  const normalised = {
    taskCompletion: completionRate,
    deadlineAdherence: deadlinesMet,
    qualityScore: qualityScore * 10,
    attendance: attendancePct,
    hrFeedback: hrFeedbackAvg * 20
  };

  const finalScore =
    weights.taskCompletion * normalised.taskCompletion +
    weights.deadlineAdherence * normalised.deadlineAdherence +
    weights.qualityScore * normalised.qualityScore +
    weights.attendance * normalised.attendance +
    weights.hrFeedback * normalised.hrFeedback;

  const roundedFinalScore = Math.round(finalScore * 100) / 100;
  const scoreBand = scoreToScoreBand(roundedFinalScore);

  return {
    totalTasks,
    completedTasks: completedTasks.length,
    completionRate: Math.round(completionRate * 100) / 100,
    deadlinesMet: Math.round(deadlinesMet * 100) / 100,
    avgReviewScore: Math.round(avgReviewScore * 100) / 100,
    reworkCount,
    qualityScore: Math.round(qualityScore * 100) / 100,
    attendancePct: Math.round(attendancePct * 100) / 100,
    hrFeedbackAvg: Math.round(hrFeedbackAvg * 100) / 100,
    finalScore: roundedFinalScore,
    scoreBand,
    weights,
    // Legacy aliases for backward compat
    score: Math.round(avgReviewScore * 100) / 100
  } as PerformanceMetrics & { score: number };
}
