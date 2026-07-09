import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { login, refresh, logout, getMe, changePassword, getAdminContact } from "./auth.controller";
import { loginSchema, refreshSchema, changePasswordSchema } from "./auth.validation";
import { rateLimit } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post("/login", rateLimit(10, 60), validate(loginSchema), login);
router.get("/admin-contact", rateLimit(10, 60), getAdminContact);
router.post("/refresh", rateLimit(20, 60), validate(refreshSchema), refresh);

router.post("/logout", authenticate, validate(refreshSchema), logout);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, validate(changePasswordSchema), changePassword);

export const authRouter = router;
