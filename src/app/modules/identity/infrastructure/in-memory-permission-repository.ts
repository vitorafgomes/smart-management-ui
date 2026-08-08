import { inject, Injectable } from '@angular/core';

import { IdentityError } from '../domain/identity-error';
import { pageOf, PagedResult } from '../domain/paged-result';
import {
  isValidPermissionCode,
  matchesPermission,
  NewPermission,
  Permission,
  PermissionEdit,
} from '../domain/permission';
import { PermissionQuery, PermissionRepository } from '../domain/permission-repository';

import { IdentityMockConfig } from './identity-mock-config';
import { SEED_PERMISSIONS, SEED_TENANT_ID } from './identity-seed';

/** The mock permission adapter. See the note on `InMemoryUserRepository` for its state lifetime. */
@Injectable()
export class InMemoryPermissionRepository implements PermissionRepository {
  private readonly mock = inject(IdentityMockConfig);

  private permissions: Permission[] = [...SEED_PERMISSIONS];
  private sequence = SEED_PERMISSIONS.length;

  async list(query: PermissionQuery): Promise<PagedResult<Permission>> {
    await this.mock.settle('permissions');

    const matching = this.permissions.filter(
      (permission) =>
        matchesPermission(permission, query.search) &&
        (!query.module || permission.module === query.module),
    );

    return pageOf(matching, query);
  }

  async getById(id: string): Promise<Permission> {
    await this.mock.settle('permissions');

    return this.require(id);
  }

  async create(payload: NewPermission): Promise<Permission> {
    await this.mock.settle('permissions');

    this.assertCodeUsable(payload.code);

    const now = new Date().toISOString();
    const created: Permission = {
      ...payload,
      id: `perm-${String(++this.sequence).padStart(2, '0')}`,
      tenantId: SEED_TENANT_ID,
      createdAt: now,
      updatedAt: now,
    };

    this.permissions = [created, ...this.permissions];

    return created;
  }

  async update(id: string, payload: PermissionEdit): Promise<Permission> {
    await this.mock.settle('permissions');

    const existing = this.require(id);
    this.assertCodeUsable(payload.code, id);

    const updated: Permission = { ...existing, ...payload, updatedAt: new Date().toISOString() };
    this.permissions = this.permissions.map((permission) =>
      permission.id === id ? updated : permission,
    );

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.mock.settle('permissions');

    this.require(id);
    this.permissions = this.permissions.filter((permission) => permission.id !== id);
  }

  private require(id: string): Permission {
    const found = this.permissions.find((permission) => permission.id === id);
    if (!found) {
      throw new IdentityError('not-found', 'That permission no longer exists.');
    }

    return found;
  }

  private assertCodeUsable(code: string, excludingId?: string): void {
    if (!isValidPermissionCode(code)) {
      throw new IdentityError(
        'validation',
        'A permission code looks like USER_READ: uppercase letters, digits and underscores.',
      );
    }

    const clash = this.permissions.some(
      (permission) => permission.id !== excludingId && permission.code === code,
    );

    if (clash) {
      throw new IdentityError('conflict', `The permission code "${code}" is already in use.`);
    }
  }
}
