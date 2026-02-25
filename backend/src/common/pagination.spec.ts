import { normalizePagination, buildPagination, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from './pagination';

describe('normalizePagination', () => {
  it('returns defaults when called with no arguments', () => {
    expect(normalizePagination()).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('returns defaults when called with empty object', () => {
    expect(normalizePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('calculates skip from page and limit', () => {
    expect(normalizePagination({ page: 3, limit: 10 })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps page to minimum of 1', () => {
    const result = normalizePagination({ page: 0 });
    expect(result.page).toBe(DEFAULT_PAGE);
    expect(result.skip).toBe(0);
  });

  it('clamps negative page to 1', () => {
    expect(normalizePagination({ page: -5 }).page).toBe(1);
  });

  it('clamps limit to minimum of 1', () => {
    expect(normalizePagination({ limit: 0 }).limit).toBe(1);
  });

  it('clamps limit to MAX_LIMIT', () => {
    expect(normalizePagination({ limit: 200 }).limit).toBe(MAX_LIMIT);
  });

  it('allows limit at exactly MAX_LIMIT', () => {
    expect(normalizePagination({ limit: MAX_LIMIT }).limit).toBe(MAX_LIMIT);
  });
});

describe('buildPagination', () => {
  it('calculates totalPages correctly', () => {
    expect(buildPagination(1, 20, 50)).toEqual({
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
    });
  });

  it('returns totalPages of 0 when total is 0', () => {
    expect(buildPagination(1, 20, 0).totalPages).toBe(0);
  });

  it('returns totalPages of 1 when total equals limit', () => {
    expect(buildPagination(1, 20, 20).totalPages).toBe(1);
  });

  it('rounds up partial pages', () => {
    expect(buildPagination(1, 20, 21).totalPages).toBe(2);
  });
});
