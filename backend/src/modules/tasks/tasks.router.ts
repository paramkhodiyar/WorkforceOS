import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { upload } from "../../utils/upload.util";
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  acceptTask,
  submitTask,
  reviewTask,
  resubmitTask,
  closeTask,
  addComment,
  listComments,
  uploadAttachment,
  deleteAttachment
} from "./tasks.controller";
import {
  createTaskSchema,
  updateTaskSchema,
  commentSchema,
  reviewSchema,
  assignSchema,
  getTasksFilterSchema
} from "./tasks.validation";

import { requireFeature } from "../../middleware/feature.middleware";

const router = Router();

router.use(authenticate);
router.use(requireFeature("tasks"));

router.post("/", validate(createTaskSchema), createTask);
router.get("/", validate(getTasksFilterSchema, "query"), listTasks);
router.get("/:id", getTask);
router.patch("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);

router.post("/:id/assign", validate(assignSchema), assignTask);
router.post("/:id/accept", acceptTask);
router.post("/:id/submit", submitTask);
router.post("/:id/review", validate(reviewSchema), reviewTask);
router.post("/:id/resubmit", resubmitTask);
router.post("/:id/close", closeTask);

router.post("/:id/comments", validate(commentSchema), addComment);
router.get("/:id/comments", listComments);

router.post("/:id/attachments", upload.single("attachment"), uploadAttachment);
router.delete("/:id/attachments/:attachId", deleteAttachment);

export const tasksRouter = router;
