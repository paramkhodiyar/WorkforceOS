import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional()
});

export const updateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional()
});

export const getArticlesSchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  isPublished: z.preprocess((val) => (val === "true" ? true : val === "false" ? false : undefined), z.boolean().optional()),
  search: z.string().optional(),
  page: z.preprocess((val) => parseInt(val as string, 10) || 1, z.number().min(1).optional()),
  limit: z.preprocess((val) => parseInt(val as string, 10) || 10, z.number().min(1).optional())
});
