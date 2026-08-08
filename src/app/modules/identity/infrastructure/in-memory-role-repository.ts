import { inject, Injectable } from '@angular/core';

import { IdentityError } from '../domain/identity-error';
import { pageOf, PagedResult } from '../domain/paged-result';
import {
  applyDefaultRole,
  canDeleteRole,
  matchesRole,
  NewRole,
  Role,
  RoleEdit,
} from '../domain/role';
import { RoleQuery, RoleRepository } from '../domain/role-repository';

import { IdentityMockConfig } from './identity-mock-config';
import { SEED_ROLES, SEED_TENANT_ID } from './identity-seed';

/** The mock role adapter. See the note on `InMemoryUserRepository` for the lifetime of its state. */
@Injectable()
export class InMemoryRoleRepository implements RoleRepository {
  private readonly mock = inject(IdentityMockConfig);

  private roles: Role[] = [...SEED_ROLES];
  private sequence = SEED_ROLES.length;

  async list(query: RoleQuery): Promise<PagedResult<Role>> {
    await this.mock.settle('roles');

    return pageOf(
      this.roles.filter((role) => matchesRole(role, query.search)),
      query,
    );
  }

  async listAll(): Promise<readonly Role[]> {
    await this.mock.settle('roles');

    return [...this.roles];
  }

  async getById(id: string): Promise<Role> {
    await this.mock.settle('roles');

    return this.require(id);
  }

  async create(payload: NewRole): Promise<Role> {
    await this.mock.settle('roles');

    this.assertNameAvailable(payload.name);

    const now = new Date().toISOString();
    const created: Role = {
      ...payload,
      id: `role-${String(++this.sequence).padStart(2, '0')}`,
      tenantId: SEED_TENANT_ID,
      createdAt: now,
      updatedAt: now,
      permissionCodes: [...payload.permissionCodes],
    };

    this.roles = [created, ...this.roles];
    this.enforceSingleDefault(created);

    return this.require(created.id);
  }

  async update(id: string, payload: RoleEdit): Promise<Role> {
    await this.mock.settle('roles');

    const existing = this.require(id);
    this.assertNameAvailable(payload.name, id);

    const updated: Role = {
      ...existing,
      ...payload,
      permissionCodes: [...payload.permissionCodes],
      updatedAt: new Date().toISOString(),
    };

    this.roles = this.roles.map((role) => (role.id === id ? updated : role));
    this.enforceSingleDefault(updated);

    return this.require(id);
  }

  async remove(id: string): Promise<void> {
    await this.mock.settle('roles');

    const existing = this.require(id);
    if (!canDeleteRole(existing)) {
      throw new IdentityError(
        'conflict',
        `${existing.name} is the default role and cannot be deleted.`,
      );
    }

    this.roles = this.roles.filter((role) => role.id !== id);
  }

  private require(id: string): Role {
    const found = this.roles.find((role) => role.id === id);
    if (!found) {
      throw new IdentityError('not-found', 'That role no longer exists.');
    }

    return found;
  }

  private assertNameAvailable(name: string, excludingId?: string): void {
    const candidate = name.trim().toLowerCase();
    const clash = this.roles.some(
      (role) => role.id !== excludingId && role.name.toLowerCase() === candidate,
    );

    if (clash) {
      throw new IdentityError('conflict', `A role named "${name}" already exists.`);
    }
  }

  private enforceSingleDefault(candidate: Role): void {
    if (candidate.isDefault) {
      this.roles = [...applyDefaultRole(this.roles, candidate.id)];
    }
  }
}
