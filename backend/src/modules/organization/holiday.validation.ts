import { z } from "zod";

export const createHolidaySchema = z.object({
  date: z.preprocess((val) => new Date(val as string), z.date()),
  name: z.string().min(1, "Name must not be empty"),
  isOptional: z.boolean().optional()
});
