import { z } from "zod";

export const getOrganizationSchema = z.object({
  slug: z.string().min(1)
});

export const updateFeaturesSchema = z.object({
  enabledFeatures: z.array(z.string()).min(1)
});
