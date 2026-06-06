import { prisma } from "../../config/database";
import { AuditAction } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { AuditService } from "../audit/audit.service";

export class KnowledgeService {
  static async listArticles(
    filters: { category?: string; tag?: string; isPublished?: boolean; search?: string },
    page = 1,
    limit = 10
  ) {
    const where: any = { isDeleted: false };
    if (filters.category) where.category = filters.category;
    if (filters.tag) where.tags = { has: filters.tag };
    if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { body: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    const total = await prisma.knowledgeArticle.count({ where });
    const articles = await prisma.knowledgeArticle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    return { articles, total };
  }

  static async createArticle(
    orgId: string,
    authorId: string,
    data: { title: string; body: string; category: string; tags?: string[] },
    req?: any
  ) {
    const article = await prisma.knowledgeArticle.create({
      data: {
        title: data.title,
        body: data.body,
        category: data.category,
        tags: data.tags || [],
        authorId,
        isPublished: false
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId: authorId,
      action: AuditAction.CREATED,
      module: "knowledge",
      targetId: article.id,
      targetType: "KnowledgeArticle",
      req
    });

    return article;
  }

  static async getArticleById(id: string, userId: string, isHrOrAdmin: boolean) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id, isDeleted: false },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (!article) {
      throw AppError.notFound("Article not found");
    }

    if (!article.isPublished && article.authorId !== userId && !isHrOrAdmin) {
      throw AppError.forbidden("Access denied: article is not published");
    }

    return article;
  }

  static async updateArticle(
    id: string,
    orgId: string,
    actorId: string,
    data: { title?: string; body?: string; category?: string; tags?: string[] },
    req?: any
  ) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id, isDeleted: false }
    });

    if (!article) {
      throw AppError.notFound("Article not found");
    }

    if (data.body && data.body !== article.body) {
      await prisma.knowledgeVersion.create({
        data: {
          articleId: id,
          body: article.body,
          editedBy: actorId
        }
      });
    }

    const updated = await prisma.knowledgeArticle.update({
      where: { id },
      data
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.UPDATED,
      module: "knowledge",
      targetId: id,
      targetType: "KnowledgeArticle",
      oldValue: article,
      newValue: updated,
      req
    });

    return updated;
  }

  static async publishArticle(id: string, orgId: string, actorId: string, req?: any) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id, isDeleted: false }
    });

    if (!article) {
      throw AppError.notFound("Article not found");
    }

    const updated = await prisma.knowledgeArticle.update({
      where: { id },
      data: { isPublished: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.STATUS_CHANGED,
      module: "knowledge",
      targetId: id,
      targetType: "KnowledgeArticle",
      newValue: { isPublished: true },
      req
    });

    return updated;
  }

  static async deleteArticle(id: string, orgId: string, actorId: string, req?: any) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id, isDeleted: false }
    });

    if (!article) {
      throw AppError.notFound("Article not found");
    }

    await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.DELETED,
      module: "knowledge",
      targetId: id,
      targetType: "KnowledgeArticle",
      req
    });
  }

  static async getVersions(id: string) {
    return prisma.knowledgeVersion.findMany({
      where: { articleId: id },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getVersionById(id: string, versionId: string) {
    const version = await prisma.knowledgeVersion.findFirst({
      where: { id: versionId, articleId: id }
    });

    if (!version) {
      throw AppError.notFound("Version not found");
    }

    return version;
  }
}
