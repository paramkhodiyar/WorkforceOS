import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { login, refresh, logout, getMe, changePassword } from "./auth.controller";
import { loginSchema, refreshSchema, changePasswordSchema } from "./auth.validation";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", authenticate, validate(refreshSchema), logout);
router.get("/me", authenticate, getMe);
router.patch("/change-password", authenticate, validate(changePasswordSchema), changePassword);

export const authRouter = router;
