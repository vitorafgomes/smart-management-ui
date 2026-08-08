import { IdentityEntity } from './identity-entity';

export interface Role extends IdentityEntity {
  readonly name: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly isDefault: boolean;
  readonly permissionCodes: readonly string[];
}

export interface NewRole {
  readonly name: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly isDefault: boolean;
  readonly permissionCodes: readonly string[];
}

export type RoleEdit = NewRole;

export function matchesRole(role: Role, term: string): boolean {
  const search = term.trim().toLowerCase();
  if (!search) {
    return true;
  }

  return [role.name, role.description ?? ''].some((field) => field.toLowerCase().includes(search));
}

/**
 * The default role is what a new user gets when nothing else is chosen, so removing it would
 * leave user creation with no fallback. Deactivating it is refused for the same reason.
 */
export function canDeleteRole(role: Role): boolean {
  return !role.isDefault;
}

/** Exactly one role is the default; promoting one demotes whichever held it. */
export function applyDefaultRole(roles: readonly Role[], defaultRoleId: string): readonly Role[] {
  return roles.map((role) => ({ ...role, isDefault: role.id === defaultRoleId }));
}
