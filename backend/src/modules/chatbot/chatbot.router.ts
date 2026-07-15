import { Router } from "express";
import { getPublicChatResponse, getInternalChatResponse } from "./chatbot.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// Public chatbot endpoint (Landing Page: Voyager) - no auth
router.post("/public", getPublicChatResponse);

// Internal chatbot endpoint (App Dashboard: Nexus) - authenticated
router.post("/internal", authenticate, getInternalChatResponse);

export const chatbotRouter = router;
