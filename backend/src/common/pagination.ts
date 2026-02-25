export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function normalizePagination(query?: { page?: number; limit?: number }) {
  const page = Math.max(DEFAULT_PAGE, query?.page ?? DEFAULT_PAGE);
  const limit = Math.min(Math.max(query?.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
