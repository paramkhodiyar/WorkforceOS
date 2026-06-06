import { Request, Response } from "express";
import { KnowledgeService } from "./knowledge.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const listArticles = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = parsePagination(req.query);
  const filters = {
    category: req.query.category as string,
    tag: req.query.tag as string,
    isPublished: req.query.isPublished === undefined ? undefined : req.query.isPublished === "true",
    search: req.query.search as string
  };

  const result = await KnowledgeService.listArticles(filters, page, limit);

  return sendPaginated(res, result.articles, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const authorId = req.user!.id;
  const article = await KnowledgeService.createArticle(orgId, authorId, req.body, req);
  return sendSuccess(res, article, "Article draft created successfully");
});

export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const isHrOrAdmin = req.user!.systemRole === "ORG_ADMIN" || req.user!.systemRole === "SUPER_ADMIN" || (req.user!.roles?.some((ur: any) => ur.roleName === "HR_MANAGER") ?? false);

  const article = await KnowledgeService.getArticleById(req.params.id, userId, isHrOrAdmin);
  return sendSuccess(res, article);
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const updated = await KnowledgeService.updateArticle(req.params.id, orgId, actorId, req.body, req);
  return sendSuccess(res, updated, "Article updated successfully");
});

export const publishArticle = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const updated = await KnowledgeService.publishArticle(req.params.id, orgId, actorId, req);
  return sendSuccess(res, updated, "Article published successfully");
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  await KnowledgeService.deleteArticle(req.params.id, orgId, actorId, req);
  return sendSuccess(res, null, "Article deleted successfully");
});

export const getVersions = asyncHandler(async (req: Request, res: Response) => {
  const list = await KnowledgeService.getVersions(req.params.id);
  return sendSuccess(res, list);
});

export const getVersionById = asyncHandler(async (req: Request, res: Response) => {
  const version = await KnowledgeService.getVersionById(req.params.id, req.params.versionId);
  return sendSuccess(res, version);
});
