import { IdentityEntity } from './identity-entity';

/** The modules a permission can be scoped to. Legacy hardcoded this list in the form component. */
export const PERMISSION_MODULES = ['Tenant', 'User', 'Role', 'Permission', 'Group'] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export interface Permission extends IdentityEntity {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly module: PermissionModule;
  readonly isActive: boolean;
}

export interface NewPermission {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly module: PermissionModule;
  readonly isActive: boolean;
}

export type PermissionEdit = NewPermission;

/** Screaming snake case: `USER_READ`, `TENANT_SETTINGS_WRITE`. Ported verbatim from the legacy form. */
export const PERMISSION_CODE_PATTERN = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

export function isValidPermissionCode(code: string): boolean {
  return PERMISSION_CODE_PATTERN.test(code);
}

export function isPermissionModule(value: string): value is PermissionModule {
  return (PERMISSION_MODULES as readonly string[]).includes(value);
}

export function matchesPermission(permission: Permission, term: string): boolean {
  const search = term.trim().toLowerCase();
  if (!search) {
    return true;
  }

  return [permission.code, permission.name, permission.description ?? ''].some((field) =>
    field.toLowerCase().includes(search),
  );
}
