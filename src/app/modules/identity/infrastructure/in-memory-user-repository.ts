import { inject, Injectable } from '@angular/core';

import { IdentityError } from '../domain/identity-error';
import { pageOf, PagedResult } from '../domain/paged-result';
import { isUserNameTaken, matchesUser, NewUser, User, UserEdit } from '../domain/user';
import { UserRepository, UserQuery } from '../domain/user-repository';

import { IdentityMockConfig } from './identity-mock-config';
import { SEED_TENANT_ID, SEED_USERS } from './identity-seed';

/**
 * The mock user adapter. It implements the port exactly as an HTTP adapter would, so replacing it
 * is one binding change in the module's index.ts - see ADR 0002. State lives for the lifetime of
 * the injector, which is the route: leaving the module and coming back restores the seed, and that
 * is deliberate rather than a gap, because persistence is the backend's job.
 */
@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly mock = inject(IdentityMockConfig);

  private users: User[] = [...SEED_USERS];
  private sequence = SEED_USERS.length;

  async list(query: UserQuery): Promise<PagedResult<User>> {
    await this.mock.settle('users');

    const matching = this.users.filter((user) => matchesUser(user, query.search));

    return pageOf(matching, query);
  }

  async getById(id: string): Promise<User> {
    await this.mock.settle('users');

    return this.require(id);
  }

  async create(payload: NewUser): Promise<User> {
    await this.mock.settle('users');

    this.assertUserNameAvailable(payload.userName);

    const now = new Date().toISOString();
    const created: User = {
      ...payload,
      id: `user-${String(++this.sequence).padStart(2, '0')}`,
      tenantId: SEED_TENANT_ID,
      createdAt: now,
      updatedAt: now,
      roleIds: [...payload.roleIds],
    };

    this.users = [created, ...this.users];

    return created;
  }

  async update(id: string, payload: UserEdit): Promise<User> {
    await this.mock.settle('users');

    const existing = this.require(id);
    this.assertUserNameAvailable(payload.userName, id);

    const updated: User = {
      ...existing,
      ...payload,
      roleIds: [...payload.roleIds],
      updatedAt: new Date().toISOString(),
    };

    this.users = this.users.map((user) => (user.id === id ? updated : user));

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.mock.settle('users');

    this.require(id);
    this.users = this.users.filter((user) => user.id !== id);
  }

  private require(id: string): User {
    const found = this.users.find((user) => user.id === id);
    if (!found) {
      throw new IdentityError('not-found', 'That user no longer exists.');
    }

    return found;
  }

  private assertUserNameAvailable(userName: string, excludingId?: string): void {
    if (isUserNameTaken(this.users, userName, excludingId)) {
      throw new IdentityError('conflict', `The username "${userName}" is already taken.`);
    }
  }
}
