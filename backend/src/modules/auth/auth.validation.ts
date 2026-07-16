import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

export const registerTrialSchema = z.union([
  z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    companyName: z.string().min(1)
  }),
  z.object({
    organizationName: z.string().min(1),
    adminName: z.string().min(1),
    adminEmail: z.string().email()
  })
]);
