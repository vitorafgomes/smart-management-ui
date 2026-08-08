import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ROLE_REPOSITORY, USER_REPOSITORY } from '../../application/identity-ports';
import { UsersFacade } from '../../application/users-facade';
import { IdentityError } from '../../domain/identity-error';
import { RoleRepository } from '../../domain/role-repository';
import { User } from '../../domain/user';
import { UserRepository } from '../../domain/user-repository';

import { UsersPage } from './users-page';

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
    roleIds: ['role-01'],
    ...overrides,
  };
}

function createRepository(users: readonly User[]): UserRepository {
  return {
    list: vi.fn().mockResolvedValue({
      entries: users,
      page: 1,
      pageSize: 10,
      totalResults: users.length,
      totalPages: 1,
    }),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

async function render(repository: UserRepository): Promise<ComponentFixture<UsersPage>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [UsersPage],
    providers: [
      provideRouter([]),
      UsersFacade,
      { provide: USER_REPOSITORY, useValue: repository },
      { provide: ROLE_REPOSITORY, useValue: createRoleRepository() },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(UsersPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function text(fixture: ComponentFixture<UsersPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function query<T extends HTMLElement>(fixture: ComponentFixture<UsersPage>, selector: string): T {
  return (fixture.nativeElement as HTMLElement).querySelector<T>(selector)!;
}

describe('UsersPage', () => {
  it('renders a row per user once the facade has loaded', async () => {
    const fixture = await render(
      createRepository([aUser(), aUser({ id: 'user-02', userName: 'grace' })]),
    );

    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(text(fixture)).toContain('ada');
    expect(text(fixture)).toContain('Ada Lovelace');
    expect(text(fixture)).toContain('2 user(s) found');
  });

  it('tells the user the request failed and offers a retry', async () => {
    const repository = createRepository([]);
    vi.mocked(repository.list).mockRejectedValue(
      new IdentityError('unavailable', 'The identity service is unavailable.'),
    );

    const fixture = await render(repository);

    expect(query(fixture, '[data-testid="users-error"]').textContent).toContain(
      'The identity service is unavailable.',
    );
    expect(fixture.nativeElement.querySelector('[data-testid="users-table"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="users-empty"]')).toBeNull();
  });

  it('distinguishes an empty result from a failure', async () => {
    const fixture = await render(createRepository([]));

    expect(query(fixture, '[data-testid="users-empty"]').textContent).toContain('No users yet');
    expect(fixture.nativeElement.querySelector('[data-testid="users-error"]')).toBeNull();
  });

  it('asks for confirmation before deleting and only then calls the port', async () => {
    const repository = createRepository([aUser()]);
    const fixture = await render(repository);

    query<HTMLButtonElement>(fixture, '[aria-label="Delete ada"]').click();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Delete user');
    expect(repository.remove).not.toHaveBeenCalled();

    query<HTMLButtonElement>(fixture, '[data-testid="confirm-delete"]').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(repository.remove).toHaveBeenCalledWith('user-01');
    expect(fixture.nativeElement.querySelector('[data-testid="confirm-delete"]')).toBeNull();
  });

  it('closes the dialog and shows the error when the delete fails', async () => {
    const repository = createRepository([aUser()]);
    vi.mocked(repository.remove).mockRejectedValue(
      new IdentityError('not-found', 'That user no longer exists.'),
    );

    const fixture = await render(repository);

    query<HTMLButtonElement>(fixture, '[aria-label="Delete ada"]').click();
    fixture.detectChanges();
    query<HTMLButtonElement>(fixture, '[data-testid="confirm-delete"]').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="confirm-delete"]')).toBeNull();
    expect(query(fixture, '[data-testid="users-error"]').textContent).toContain(
      'That user no longer exists.',
    );
  });
});
