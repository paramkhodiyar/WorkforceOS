import { z } from "zod";
import { AssetStatus } from "@prisma/client";

export const createAssetSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  serialNumber: z.string().optional()
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional()
});

export const assignAssetSchema = z.object({
  userId: z.string().min(1),
  notes: z.string().optional()
});

export const returnAssetSchema = z.object({
  condition: z.enum(["AVAILABLE", "DAMAGED"])
});

export const getAssetsFilterSchema = z.object({
  category: z.string().optional(),
  status: z.nativeEnum(AssetStatus).optional()
});
