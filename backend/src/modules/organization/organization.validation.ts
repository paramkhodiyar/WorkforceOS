import { z } from "zod";

export const getOrganizationSchema = z.object({
  slug: z.string().min(1)
});

export const updateFeaturesSchema = z.object({
  enabledFeatures: z.array(z.string()).min(1)
});

export const updateLocationSchema = z.object({
  officeLatitude: z.number().nullable(),
  officeLongitude: z.number().nullable(),
  officeRadius: z.number().min(10).max(10000).nullable()
});
