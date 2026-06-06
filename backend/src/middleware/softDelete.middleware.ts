import { Prisma } from "@prisma/client";

const modelsWithSoftDelete = [
  "Organization",
  "Department",
  "Team",
  "User",
  "Role",
  "Attendance",
  "LeavePolicy",
  "LeaveRequest",
  "Task",
  "TaskComment",
  "PerformanceReview",
  "PayrollRun",
  "PayrollRecord",
  "ExpenseClaim",
  "Asset",
  "KnowledgeArticle",
  "EmployeeDocument"
];

export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  if (params.model && modelsWithSoftDelete.includes(params.model)) {
    if (params.action === "findUnique" || params.action === "findFirst") {
      params.action = "findFirst";
      params.args.where = params.args.where || {};
      params.args.where.isDeleted = false;
    } else if (params.action === "findMany" || params.action === "count") {
      params.args.where = params.args.where || {};
      if (params.args.where.isDeleted === undefined) {
        params.args.where.isDeleted = false;
      }
    } else if (params.action === "delete") {
      params.action = "update";
      params.args.data = { isDeleted: true, deletedAt: new Date() };
    } else if (params.action === "deleteMany") {
      params.action = "updateMany";
      if (params.args.data) {
        params.args.data.isDeleted = true;
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { isDeleted: true, deletedAt: new Date() };
      }
    }
  }
  return next(params);
};
