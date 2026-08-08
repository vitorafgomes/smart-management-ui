import {
  isPermissionModule,
  isValidPermissionCode,
  matchesPermission,
  Permission,
} from './permission';

function aPermission(overrides: Partial<Permission> = {}): Permission {
  return {
    id: 'perm-01',
    tenantId: 'smart-management',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
    code: 'USER_READ',
    name: 'View users',
    description: 'Read the user directory.',
    module: 'User',
    isActive: true,
    ...overrides,
  };
}

describe('isValidPermissionCode', () => {
  it.each(['USER_READ', 'TENANT_SETTINGS_WRITE', 'A1', 'GROUP_MEMBER_WRITE'])(
    'accepts %s',
    (code) => {
      expect(isValidPermissionCode(code)).toBe(true);
    },
  );

  it.each(['user_read', 'USER__READ', '_USER', 'USER_', '1USER', 'USER READ', ''])(
    'rejects %s',
    (code) => {
      expect(isValidPermissionCode(code)).toBe(false);
    },
  );
});

describe('isPermissionModule', () => {
  it('accepts a module from the catalogue', () => {
    expect(isPermissionModule('Tenant')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isPermissionModule('Billing')).toBe(false);
  });
});

describe('matchesPermission', () => {
  it('matches on the code', () => {
    expect(matchesPermission(aPermission(), 'user_re')).toBe(true);
  });

  it('matches on the name', () => {
    expect(matchesPermission(aPermission(), 'view')).toBe(true);
  });

  it('rejects a term that appears nowhere', () => {
    expect(matchesPermission(aPermission(), 'delete')).toBe(false);
  });
});
