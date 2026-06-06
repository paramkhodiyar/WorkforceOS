import { PAGINATION } from "../config/constants";

export function parsePagination(query: any) {
  const page = Math.max(1, parseInt(query.page as string, 10) || PAGINATION.DEFAULT_PAGE);
  let limit = parseInt(query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT;
  limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));
  return { page, limit };
}

export function buildPrismaPage(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit
  };
}
