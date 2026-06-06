import { z } from "zod";
import { NotificationType } from "@prisma/client";

export const getNotificationsSchema = z.object({
  unreadOnly: z.preprocess((val) => val === "true", z.boolean().optional()),
  type: z.nativeEnum(NotificationType).optional(),
  page: z.preprocess((val) => parseInt(val as string, 10) || 1, z.number().min(1).optional()),
  limit: z.preprocess((val) => parseInt(val as string, 10) || 10, z.number().min(1).optional())
});
