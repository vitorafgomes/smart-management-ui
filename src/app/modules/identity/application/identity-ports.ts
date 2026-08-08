import { InjectionToken } from '@angular/core';

import { PermissionRepository } from '../domain/permission-repository';
import { RoleRepository } from '../domain/role-repository';
import { UserRepository } from '../domain/user-repository';

/**
 * DI tokens for the domain ports. They live here rather than beside the interfaces because an
 * `InjectionToken` is an Angular value and `domain/` imports no framework
 * ([[vault/pages/invariants/domain-layer-purity]]). The interface stays the contract; this is
 * only the handle DI resolves it by, and the module's index.ts is the one place that binds it.
 */
export const USER_REPOSITORY = new InjectionToken<UserRepository>('identity.UserRepository');
export const ROLE_REPOSITORY = new InjectionToken<RoleRepository>('identity.RoleRepository');
export const PERMISSION_REPOSITORY = new InjectionToken<PermissionRepository>(
  'identity.PermissionRepository',
);
