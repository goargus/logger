export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function normalizePagination(query?: { page?: number; limit?: number }) {
  const page = Math.max(DEFAULT_PAGE, query?.page ?? DEFAULT_PAGE);
  const limit = Math.min(Math.max(query?.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

export function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
