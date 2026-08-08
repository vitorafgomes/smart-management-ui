import { PageRequest, PagedResult } from './paged-result';
import { NewPermission, Permission, PermissionEdit } from './permission';

export interface PermissionQuery extends PageRequest {
  readonly search: string;
  /** Empty string means every module, matching the "All modules" option in the filter. */
  readonly module: string;
}

export interface PermissionRepository {
  list(query: PermissionQuery): Promise<PagedResult<Permission>>;
  getById(id: string): Promise<Permission>;
  create(payload: NewPermission): Promise<Permission>;
  update(id: string, payload: PermissionEdit): Promise<Permission>;
  remove(id: string): Promise<void>;
}
