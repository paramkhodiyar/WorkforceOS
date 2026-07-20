import { Router } from "express";
import { getPublicChatResponse, getInternalChatResponse } from "./chatbot.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { rateLimit } from "../../middleware/rateLimit.middleware";

const router = Router();

// Public chatbot endpoint (Landing Page: Voyager) - no auth
router.post("/public", rateLimit(20, 60), getPublicChatResponse);

// Internal chatbot endpoint (App Dashboard: Nexus) - authenticated
router.post("/internal", authenticate, getInternalChatResponse);

export const chatbotRouter = router;
