export interface TableSettings {
  pageSize: number;
  sortColumn: string;
  sortDirection: string;
  visibleColumns: string[];
  filters: Record<string, any>;
}
