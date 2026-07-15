import { Request, Response } from "express";
import { ChatbotService } from "./chatbot.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";

export const getPublicChatResponse = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    throw AppError.badRequest("Message is required");
  }

  const response = await ChatbotService.getPublicResponse(message);
  return sendSuccess(res, { response });
});

export const getInternalChatResponse = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || message.trim() === "") {
    throw AppError.badRequest("Message is required");
  }

  const userId = req.user!.id;
  const orgId = req.org!.id;

  const response = await ChatbotService.getInternalResponse(userId, orgId, message);
  return sendSuccess(res, { response });
});
