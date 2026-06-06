import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { getNotifications, markAsRead, markAllAsRead, dismiss, getUnreadCount } from "./notifications.controller";
import { getNotificationsSchema } from "./notifications.validation";

const router = Router();

router.use(authenticate);

router.get("/", validate(getNotificationsSchema, "query"), getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", dismiss);

export const notificationsRouter = router;
