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
  GROQ_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  LEAD_NOTIFY_EMAIL: z.string().email().optional()
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production") {
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === "df06bc5258e72753ffc1ab1f0cdcdbfb876a3f0190a424e8d35759ef62cdab12") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "In production, ENCRYPTION_KEY must be defined explicitly and cannot use the default developer fallback key.",
        path: ["ENCRYPTION_KEY"]
      });
    }
    const defaultAccessSecret = "183cede7f56eb8c445b28eb2b6d027f3c8f019f743c144e69b226eff0cd33849d5df86eaa14f3c1971b37fef230cabc67807cd0fa132d7e357e28d1df6a0adf7";
    if (!data.JWT_ACCESS_SECRET || data.JWT_ACCESS_SECRET === defaultAccessSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "In production, JWT_ACCESS_SECRET must be defined explicitly and cannot use the default developer fallback key.",
        path: ["JWT_ACCESS_SECRET"]
      });
    }
    const defaultRefreshSecret = "894b433eef9d456e37d844a258d0490f8aa43e0fa29fc9dc432399f9e7aa41e5f6eca60ada9846777409bb6a48db811c69bec7fc848c7f5d96c79a6190aa9529";
    if (!data.JWT_REFRESH_SECRET || data.JWT_REFRESH_SECRET === defaultRefreshSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "In production, JWT_REFRESH_SECRET must be defined explicitly and cannot use the default developer fallback key.",
        path: ["JWT_REFRESH_SECRET"]
      });
    }
    if (!data.CORS_ORIGINS || data.CORS_ORIGINS === "*") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "In production, CORS_ORIGINS must be defined explicitly and cannot be '*'.",
        path: ["CORS_ORIGINS"]
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
  CORS_ORIGINS: parsed.data.CORS_ORIGINS === "*" ? ["*"] : parsed.data.CORS_ORIGINS.split(","),
  SMTP_SECURE: parsed.data.SMTP_SECURE === "true"
};
