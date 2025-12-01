export interface PagedResult<T> {
  pageNumber: number;
  pageSize: number;
  pageSizeLimit: number;
  totalPages: number;
  totalResults: number;
  entries: T[];
}
