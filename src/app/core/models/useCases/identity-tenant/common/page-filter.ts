/**
 * PageFilter interface for pagination parameters
 * Following backend pattern from UseCases
 */
export interface PageFilter {
  pageNumber: number;
  pageSize: number;
}

/**
 * Converts PageFilter to the string format expected by the API
 * Format: page={pageNumber},pageSize={pageSize}
 */
export function toPageFilterString(filter: PageFilter): string {
  return `page=${filter.pageNumber},pageSize=${filter.pageSize}`;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE_FILTER: PageFilter = {
  pageNumber: 1,
  pageSize: 10
};
