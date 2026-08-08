import { PageRequest, PagedResult } from './paged-result';
import { NewRole, Role, RoleEdit } from './role';

export interface RoleQuery extends PageRequest {
  readonly search: string;
}

export interface RoleRepository {
  list(query: RoleQuery): Promise<PagedResult<Role>>;
  /** Every role, unpaged - the user form needs the full set to render its role picker. */
  listAll(): Promise<readonly Role[]>;
  getById(id: string): Promise<Role>;
  create(payload: NewRole): Promise<Role>;
  update(id: string, payload: RoleEdit): Promise<Role>;
  remove(id: string): Promise<void>;
}
