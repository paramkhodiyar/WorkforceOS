import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { login, registerTrial, refresh, logout, getMe, changePassword, getAdminContact, switchRole, cookieExchange, dismissWelcome } from "./auth.controller";
import { loginSchema, refreshSchema, changePasswordSchema, registerTrialSchema } from "./auth.validation";
import { rateLimit } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post("/login", rateLimit(10, 60), validate(loginSchema), login);
router.post("/register-trial", rateLimit(10, 60), validate(registerTrialSchema), registerTrial);
router.get("/admin-contact", rateLimit(10, 60), getAdminContact);
router.post("/refresh", rateLimit(20, 60), validate(refreshSchema), refresh);
router.post("/cookie-exchange", rateLimit(10, 60), cookieExchange);

router.post("/logout", authenticate, validate(refreshSchema), logout);
router.post("/switch-role", authenticate, switchRole);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, validate(changePasswordSchema), changePassword);
router.patch("/dismiss-welcome", authenticate, dismissWelcome);

export const authRouter = router;
