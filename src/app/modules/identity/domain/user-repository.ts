import { PageRequest, PagedResult } from './paged-result';
import { NewUser, User, UserEdit } from './user';

export interface UserQuery extends PageRequest {
  readonly search: string;
}

/**
 * The user port. Promise-based rather than `Observable`-based: the domain layer imports no RxJS
 * ([[vault/pages/invariants/domain-layer-purity]]), and a single-value request is what a promise
 * is for. Failures reject with an `IdentityError`.
 */
export interface UserRepository {
  list(query: UserQuery): Promise<PagedResult<User>>;
  getById(id: string): Promise<User>;
  create(payload: NewUser): Promise<User>;
  update(id: string, payload: UserEdit): Promise<User>;
  remove(id: string): Promise<void>;
}
