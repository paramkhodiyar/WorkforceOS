import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requireFeature } from "../../middleware/feature.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  deleteInstance,
  respondEvent,
  checkAvailability
} from "./calendar.controller";
import {
  createEventSchema,
  updateEventSchema,
  respondEventSchema,
  checkAvailabilitySchema
} from "./calendar.validation";

const router = Router();

router.use(authenticate);
router.use(requireFeature("calendar"));

router.get("/events", listEvents);
router.post("/events", validate(createEventSchema), createEvent);
router.patch("/events/:id", validate(updateEventSchema), updateEvent);
router.delete("/events/:id", deleteEvent);
router.delete("/events/:id/instance", deleteInstance);
router.post("/events/:id/respond", validate(respondEventSchema), respondEvent);
router.post("/check-availability", validate(checkAvailabilitySchema), checkAvailability);

export const calendarRouter = router;
