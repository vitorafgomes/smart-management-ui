import { TestBed } from '@angular/core/testing';

import { IdentityError } from '../domain/identity-error';

import { IdentityMockConfig } from './identity-mock-config';
import { SEED_USERS } from './identity-seed';
import { InMemoryUserRepository } from './in-memory-user-repository';

const NEW_USER = {
  userName: 'grete',
  email: 'grete.hermann@smart-management.local',
  firstName: 'Grete',
  lastName: 'Hermann',
  isActive: true,
  emailVerified: false,
  roleIds: ['role-04'],
};

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('identity-mock-latency', '0');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [IdentityMockConfig, InMemoryUserRepository] });

    repository = TestBed.inject(InMemoryUserRepository);
  });

  afterEach(() => localStorage.clear());

  it('returns the first page of the seeded directory', async () => {
    const result = await repository.list({ search: '', page: 1, pageSize: 10 });

    expect(result.entries).toHaveLength(10);
    expect(result.totalResults).toBe(SEED_USERS.length);
    expect(result.totalPages).toBe(2);
  });

  it('narrows the result set to the search term', async () => {
    const result = await repository.list({ search: 'hopper', page: 1, pageSize: 10 });

    expect(result.entries.map((user) => user.userName)).toEqual(['grace']);
    expect(result.totalResults).toBe(1);
  });

  it('creates a user and puts it at the head of the listing', async () => {
    const created = await repository.create(NEW_USER);

    expect(created.id).toBeTruthy();
    expect(created.tenantId).toBe('smart-management');

    const result = await repository.list({ search: 'grete', page: 1, pageSize: 10 });
    expect(result.entries[0].userName).toBe('grete');
  });

  it('rejects a duplicate username with a conflict the user can read', async () => {
    await expect(repository.create({ ...NEW_USER, userName: 'ada' })).rejects.toThrow(
      IdentityError,
    );
    await expect(repository.create({ ...NEW_USER, userName: 'ada' })).rejects.toThrow(
      'The username "ada" is already taken.',
    );
  });

  it('lets a user keep its own username on update', async () => {
    const updated = await repository.update('user-01', { ...NEW_USER, userName: 'ada' });

    expect(updated.userName).toBe('ada');
    expect(updated.firstName).toBe('Grete');
  });

  it('rejects an unknown id as not found', async () => {
    await expect(repository.getById('user-404')).rejects.toThrow('That user no longer exists.');
  });

  it('removes a user from the listing', async () => {
    await repository.remove('user-01');

    await expect(repository.getById('user-01')).rejects.toThrow(IdentityError);
  });

  it('fails every call when the port is armed to fail', async () => {
    localStorage.setItem('identity-mock-failure', 'users');

    await expect(repository.list({ search: '', page: 1, pageSize: 10 })).rejects.toThrow(
      'The identity service is unavailable.',
    );
    await expect(repository.create(NEW_USER)).rejects.toThrow(IdentityError);
  });

  it('leaves other ports alone when only one is armed to fail', async () => {
    localStorage.setItem('identity-mock-failure', 'roles');

    await expect(repository.list({ search: '', page: 1, pageSize: 10 })).resolves.toBeTruthy();
  });
});
