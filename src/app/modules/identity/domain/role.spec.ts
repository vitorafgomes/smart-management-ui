import { applyDefaultRole, canDeleteRole, matchesRole, Role } from './role';

function aRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'role-01',
    tenantId: 'smart-management',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
    name: 'Administrator',
    description: 'Full access to every management surface.',
    isActive: true,
    isDefault: false,
    permissionCodes: [],
    ...overrides,
  };
}

describe('matchesRole', () => {
  it('matches on the name', () => {
    expect(matchesRole(aRole(), 'admin')).toBe(true);
  });

  it('matches on the description', () => {
    expect(matchesRole(aRole(), 'management surface')).toBe(true);
  });

  it('does not throw on a role with no description', () => {
    expect(matchesRole(aRole({ description: undefined }), 'anything')).toBe(false);
  });
});

describe('canDeleteRole', () => {
  it('refuses the default role, which new users fall back to', () => {
    expect(canDeleteRole(aRole({ isDefault: true }))).toBe(false);
  });

  it('allows any other role', () => {
    expect(canDeleteRole(aRole())).toBe(true);
  });
});

describe('applyDefaultRole', () => {
  it('promotes one role and demotes the previous default', () => {
    const roles = [aRole({ id: 'role-01', isDefault: true }), aRole({ id: 'role-02' })];

    const result = applyDefaultRole(roles, 'role-02');

    expect(result.map((role) => role.isDefault)).toEqual([false, true]);
  });

  it('leaves exactly one default when the target already held it', () => {
    const roles = [aRole({ id: 'role-01', isDefault: true }), aRole({ id: 'role-02' })];

    const result = applyDefaultRole(roles, 'role-01');

    expect(result.filter((role) => role.isDefault)).toHaveLength(1);
  });
});
