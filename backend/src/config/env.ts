import { z } from "zod";

try {
  require("dotenv").config();
} catch (e) {}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  AWS_BUCKET: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BASE_URL: z.string().url(),
  S3_ENDPOINT: z.string().url().optional(),
   CORS_ORIGINS: z.string().default("*"),
  ENCRYPTION_KEY: z.string().default("df06bc5258e72753ffc1ab1f0cdcdbfb876a3f0190a424e8d35759ef62cdab12"),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === "df06bc5258e72753ffc1ab1f0cdcdbfb876a3f0190a424e8d35759ef62cdab12") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "In production, ENCRYPTION_KEY must be defined explicitly and cannot use the default developer fallback key.",
        path: ["ENCRYPTION_KEY"]
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS === "*" ? ["*"] : parsed.data.CORS_ORIGINS.split(",")
};
