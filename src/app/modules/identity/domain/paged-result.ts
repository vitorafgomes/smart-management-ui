/**
 * One page of a listing. Mirrors the legacy `PagedResult<T>` the identity API returns, so the
 * shape survives the swap from the mock adapter to a real one.
 */
export interface PagedResult<T> {
  readonly entries: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalResults: number;
  readonly totalPages: number;
}

export interface PageRequest {
  readonly page: number;
  readonly pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Slices an already-filtered collection into a page. A page beyond the end returns no entries
 * rather than clamping - the caller decides whether that is an empty result or a bad request,
 * and silently moving the user to another page hides a paging bug.
 */
export function pageOf<T>(items: readonly T[], request: PageRequest): PagedResult<T> {
  const pageSize = Math.max(1, Math.trunc(request.pageSize));
  const page = Math.max(1, Math.trunc(request.page));
  const start = (page - 1) * pageSize;

  return {
    entries: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalResults: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

export function emptyPage<T>(pageSize = DEFAULT_PAGE_SIZE): PagedResult<T> {
  return { entries: [], page: 1, pageSize, totalResults: 0, totalPages: 1 };
}
