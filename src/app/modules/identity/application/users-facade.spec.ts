import { TestBed } from '@angular/core/testing';

import { IdentityError } from '../domain/identity-error';
import { PagedResult } from '../domain/paged-result';
import { RoleRepository } from '../domain/role-repository';
import { User } from '../domain/user';
import { UserRepository } from '../domain/user-repository';

import { ROLE_REPOSITORY, USER_REPOSITORY } from './identity-ports';
import { UsersFacade } from './users-facade';

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-01',
    tenantId: 'smart-management',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
    userName: 'ada',
    email: 'ada@smart-management.local',
    firstName: 'Ada',
    lastName: 'Lovelace',
    isActive: true,
    emailVerified: true,
    roleIds: [],
    ...overrides,
  };
}

function aPage(entries: readonly User[]): PagedResult<User> {
  return { entries, page: 1, pageSize: 10, totalResults: entries.length, totalPages: 1 };
}

/** The spec depends on the port, never on a transport - that is what the port is for. */
function createRepository(): UserRepository {
  return {
    list: vi.fn().mockResolvedValue(aPage([aUser()])),
    getById: vi.fn().mockResolvedValue(aUser()),
    create: vi.fn().mockResolvedValue(aUser({ id: 'user-99' })),
    update: vi.fn().mockResolvedValue(aUser()),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

function createRoleRepository(): RoleRepository {
  return {
    list: vi.fn(),
    listAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
}

describe('UsersFacade', () => {
  let repository: UserRepository;
  let roleRepository: RoleRepository;
  let facade: UsersFacade;

  beforeEach(() => {
    repository = createRepository();
    roleRepository = createRoleRepository();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UsersFacade,
        { provide: USER_REPOSITORY, useValue: repository },
        { provide: ROLE_REPOSITORY, useValue: roleRepository },
      ],
    });

    facade = TestBed.inject(UsersFacade);
  });

  it('starts with no data, no error and nothing loading', () => {
    expect(facade.users()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('goes from loading to data', async () => {
    const pending = facade.load();
    expect(facade.loading()).toBe(true);

    await pending;

    expect(facade.loading()).toBe(false);
    expect(facade.users()).toHaveLength(1);
    expect(facade.totalResults()).toBe(1);
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
    expect(facade.users()).toEqual([]);
    expect(facade.totalResults()).toBe(0);
  });

  it('falls back to a generic message when the failure is not an identity error', async () => {
    vi.mocked(repository.list).mockRejectedValue(new Error('socket hang up'));

    await facade.load();

    expect(facade.error()).toBe('Failed to load users.');
  });

  it('clears a previous error when a retry succeeds', async () => {
    vi.mocked(repository.list).mockRejectedValueOnce(new Error('down'));
    await facade.load();
    expect(facade.error()).not.toBeNull();

    await facade.load();

    expect(facade.error()).toBeNull();
    expect(facade.users()).toHaveLength(1);
  });

  it('reports an empty result as empty rather than as a failure', async () => {
    vi.mocked(repository.list).mockResolvedValue(aPage([]));

    await facade.load();

    expect(facade.isEmpty()).toBe(true);
    expect(facade.error()).toBeNull();
  });

  it('is not empty while the first load is still in flight', () => {
    void facade.load();

    expect(facade.isEmpty()).toBe(false);
  });

  it('restarts at the first page when the search term changes', async () => {
    await facade.setPage(3);
    expect(facade.page()).toBe(3);

    await facade.setSearch('ada');

    expect(facade.page()).toBe(1);
    expect(facade.search()).toBe('ada');
    expect(repository.list).toHaveBeenLastCalledWith({ search: 'ada', page: 1, pageSize: 10 });
  });

  it('reloads the listing after a delete so the removed row disappears', async () => {
    const removed = await facade.remove('user-01');

    expect(removed).toBe(true);
    expect(repository.remove).toHaveBeenCalledWith('user-01');
    expect(repository.list).toHaveBeenCalled();
    expect(facade.removingId()).toBeNull();
  });

  it('surfaces a delete failure and leaves the listing alone', async () => {
    vi.mocked(repository.remove).mockRejectedValue(
      new IdentityError('not-found', 'That user no longer exists.'),
    );

    const removed = await facade.remove('user-01');

    expect(removed).toBe(false);
    expect(facade.error()).toBe('That user no longer exists.');
    expect(facade.removingId()).toBeNull();
  });

  it('reports a create conflict without navigating away', async () => {
    vi.mocked(repository.create).mockRejectedValue(
      new IdentityError('conflict', 'The username "ada" is already taken.'),
    );

    const saved = await facade.create({
      userName: 'ada',
      email: 'ada@smart-management.local',
      firstName: 'Ada',
      lastName: 'Lovelace',
      isActive: true,
      emailVerified: true,
      roleIds: [],
    });

    expect(saved).toBe(false);
    expect(facade.saveError()).toBe('The username "ada" is already taken.');
    expect(facade.saving()).toBe(false);
  });

  it('lands in a detail error state when the requested user is gone', async () => {
    vi.mocked(repository.getById).mockRejectedValue(
      new IdentityError('not-found', 'That user no longer exists.'),
    );

    await facade.loadUser('user-404');

    expect(facade.detailError()).toBe('That user no longer exists.');
    expect(facade.selected()).toBeNull();
    expect(facade.detailLoading()).toBe(false);
  });
});
