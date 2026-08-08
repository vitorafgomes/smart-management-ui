import { TestBed } from '@angular/core/testing';

import { IdentityError } from '../domain/identity-error';
import { PagedResult } from '../domain/paged-result';
import { Permission } from '../domain/permission';
import { PermissionRepository } from '../domain/permission-repository';

import { PERMISSION_REPOSITORY } from './identity-ports';
import { PermissionsFacade } from './permissions-facade';

function aPermission(overrides: Partial<Permission> = {}): Permission {
  return {
    id: 'perm-01',
    tenantId: 'smart-management',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
    code: 'USER_READ',
    name: 'View users',
    module: 'User',
    isActive: true,
    ...overrides,
  };
}

function aPage(entries: readonly Permission[]): PagedResult<Permission> {
  return { entries, page: 1, pageSize: 10, totalResults: entries.length, totalPages: 1 };
}

function createRepository(): PermissionRepository {
  return {
    list: vi.fn().mockResolvedValue(aPage([aPermission()])),
    getById: vi.fn().mockResolvedValue(aPermission()),
    create: vi.fn().mockResolvedValue(aPermission({ id: 'perm-99' })),
    update: vi.fn().mockResolvedValue(aPermission()),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

describe('PermissionsFacade', () => {
  let repository: PermissionRepository;
  let facade: PermissionsFacade;

  beforeEach(() => {
    repository = createRepository();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [PermissionsFacade, { provide: PERMISSION_REPOSITORY, useValue: repository }],
    });

    facade = TestBed.inject(PermissionsFacade);
  });

  it('goes from loading to data', async () => {
    const pending = facade.load();
    expect(facade.loading()).toBe(true);

    await pending;

    expect(facade.loading()).toBe(false);
    expect(facade.permissions()).toHaveLength(1);
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
    expect(facade.permissions()).toEqual([]);
  });

  it('sends the module filter to the port and restarts at page one', async () => {
    await facade.setPage(2);

    await facade.setModule('Role');

    expect(facade.page()).toBe(1);
    expect(facade.isFiltered()).toBe(true);
    expect(repository.list).toHaveBeenLastCalledWith({
      search: '',
      module: 'Role',
      page: 1,
      pageSize: 10,
    });
  });

  it('reports a rejected code as a validation message on the form', async () => {
    vi.mocked(repository.create).mockRejectedValue(
      new IdentityError(
        'validation',
        'A permission code looks like USER_READ: uppercase letters, digits and underscores.',
      ),
    );

    const saved = await facade.create({
      code: 'bad code',
      name: 'Bad',
      module: 'User',
      isActive: true,
    });

    expect(saved).toBe(false);
    expect(facade.saveError()).toContain('A permission code looks like USER_READ');
  });
});
