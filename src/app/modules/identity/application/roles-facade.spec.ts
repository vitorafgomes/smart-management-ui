import { TestBed } from '@angular/core/testing';

import { IdentityError } from '../domain/identity-error';
import { PagedResult } from '../domain/paged-result';
import { PermissionRepository } from '../domain/permission-repository';
import { Role } from '../domain/role';
import { RoleRepository } from '../domain/role-repository';

import { PERMISSION_REPOSITORY, ROLE_REPOSITORY } from './identity-ports';
import { RolesFacade } from './roles-facade';

function aRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'role-01',
    tenantId: 'smart-management',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
    name: 'Administrator',
    isActive: true,
    isDefault: false,
    permissionCodes: [],
    ...overrides,
  };
}

function aPage(entries: readonly Role[]): PagedResult<Role> {
  return { entries, page: 1, pageSize: 10, totalResults: entries.length, totalPages: 1 };
}

function createRepository(): RoleRepository {
  return {
    list: vi.fn().mockResolvedValue(aPage([aRole()])),
    listAll: vi.fn().mockResolvedValue([aRole()]),
    getById: vi.fn().mockResolvedValue(aRole()),
    create: vi.fn().mockResolvedValue(aRole({ id: 'role-99' })),
    update: vi.fn().mockResolvedValue(aRole()),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

function createPermissionRepository(): PermissionRepository {
  return {
    list: vi
      .fn()
      .mockResolvedValue({ entries: [], page: 1, pageSize: 500, totalResults: 0, totalPages: 1 }),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
}

describe('RolesFacade', () => {
  let repository: RoleRepository;
  let facade: RolesFacade;

  beforeEach(() => {
    repository = createRepository();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        RolesFacade,
        { provide: ROLE_REPOSITORY, useValue: repository },
        { provide: PERMISSION_REPOSITORY, useValue: createPermissionRepository() },
      ],
    });

    facade = TestBed.inject(RolesFacade);
  });

  it('goes from loading to data', async () => {
    const pending = facade.load();
    expect(facade.loading()).toBe(true);

    await pending;

    expect(facade.loading()).toBe(false);
    expect(facade.roles()).toHaveLength(1);
    expect(facade.error()).toBeNull();
  });

  it('goes from loading to error and clears the data when the repository rejects', async () => {
    vi.mocked(repository.list).mockRejectedValue(
      new IdentityError('unavailable', 'The identity service is unavailable.'),
    );

    const pending = facade.load();
    expect(facade.loading()).toBe(true);

    await pending;

    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBe('The identity service is unavailable.');
    expect(facade.roles()).toEqual([]);
  });

  it('refuses to delete the default role without calling the port', async () => {
    const removed = await facade.remove(aRole({ isDefault: true, name: 'Member' }));

    expect(removed).toBe(false);
    expect(repository.remove).not.toHaveBeenCalled();
    expect(facade.error()).toBe('Member is the default role and cannot be deleted.');
  });

  it('deletes any other role and reloads the listing', async () => {
    const removed = await facade.remove(aRole());

    expect(removed).toBe(true);
    expect(repository.remove).toHaveBeenCalledWith('role-01');
    expect(repository.list).toHaveBeenCalled();
  });

  it('surfaces a save failure and stays on the form', async () => {
    vi.mocked(repository.create).mockRejectedValue(
      new IdentityError('conflict', 'A role named "Administrator" already exists.'),
    );

    const saved = await facade.create({
      name: 'Administrator',
      isActive: true,
      isDefault: false,
      permissionCodes: [],
    });

    expect(saved).toBe(false);
    expect(facade.saveError()).toBe('A role named "Administrator" already exists.');
  });
});
