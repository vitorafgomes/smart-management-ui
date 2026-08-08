import { computed, inject, Injectable, signal } from '@angular/core';

import { toUserMessage } from '../domain/identity-error';
import { DEFAULT_PAGE_SIZE } from '../domain/paged-result';
import { Permission } from '../domain/permission';
import { canDeleteRole, NewRole, Role, RoleEdit } from '../domain/role';
import { RoleRepository } from '../domain/role-repository';

import { PERMISSION_REPOSITORY, ROLE_REPOSITORY } from './identity-ports';

/** The role management use cases, including the permissions a role grants. */
@Injectable()
export class RolesFacade {
  private readonly repository = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly permissionRepository = inject(PERMISSION_REPOSITORY);

  private readonly _roles = signal<readonly Role[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _search = signal('');
  private readonly _page = signal(1);
  private readonly _totalResults = signal(0);
  private readonly _totalPages = signal(1);

  private readonly _permissions = signal<readonly Permission[]>([]);
  private readonly _selected = signal<Role | null>(null);
  private readonly _detailLoading = signal(false);
  private readonly _detailError = signal<string | null>(null);
  private readonly _saving = signal(false);
  private readonly _saveError = signal<string | null>(null);
  private readonly _removingId = signal<string | null>(null);

  readonly pageSize = DEFAULT_PAGE_SIZE;

  readonly roles = this._roles.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly search = this._search.asReadonly();
  readonly page = this._page.asReadonly();
  readonly totalResults = this._totalResults.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();

  readonly permissions = this._permissions.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly detailError = this._detailError.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();
  readonly removingId = this._removingId.asReadonly();

  readonly isEmpty = computed(
    () => !this._loading() && this._error() === null && this._roles().length === 0,
  );
  readonly isFiltered = computed(() => this._search().trim().length > 0);

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.repository.list({
        search: this._search(),
        page: this._page(),
        pageSize: this.pageSize,
      });

      this._roles.set(result.entries);
      this._totalResults.set(result.totalResults);
      this._totalPages.set(result.totalPages);
    } catch (cause) {
      this._error.set(toUserMessage(cause, 'Failed to load roles.'));
      this._roles.set([]);
      this._totalResults.set(0);
      this._totalPages.set(1);
    } finally {
      this._loading.set(false);
    }
  }

  async setSearch(term: string): Promise<void> {
    this._search.set(term);
    this._page.set(1);
    await this.load();
  }

  async setPage(page: number): Promise<void> {
    this._page.set(page);
    await this.load();
  }

  /** The permission picker on the role form. */
  async loadPermissions(): Promise<void> {
    try {
      const result = await this.permissionRepository.list({
        search: '',
        module: '',
        page: 1,
        pageSize: 500,
      });
      this._permissions.set(result.entries);
    } catch (cause) {
      this._permissions.set([]);
      this._saveError.set(toUserMessage(cause, 'Failed to load the available permissions.'));
    }
  }

  async loadRole(id: string): Promise<void> {
    this._detailLoading.set(true);
    this._detailError.set(null);
    this._saveError.set(null);

    try {
      this._selected.set(await this.repository.getById(id));
    } catch (cause) {
      this._detailError.set(toUserMessage(cause, 'Failed to load this role.'));
      this._selected.set(null);
    } finally {
      this._detailLoading.set(false);
    }
  }

  startNew(): void {
    this._selected.set(null);
    this._detailError.set(null);
    this._saveError.set(null);
  }

  async create(payload: NewRole): Promise<boolean> {
    return this.save(() => this.repository.create(payload), 'Failed to create the role.');
  }

  async update(id: string, payload: RoleEdit): Promise<boolean> {
    return this.save(() => this.repository.update(id, payload), 'Failed to update the role.');
  }

  /**
   * Refuses before calling the port when the role is the tenant default. The adapter enforces the
   * same rule, but stopping here means the user is told why instead of watching a request fail.
   */
  async remove(role: Role): Promise<boolean> {
    if (!canDeleteRole(role)) {
      this._error.set(`${role.name} is the default role and cannot be deleted.`);
      return false;
    }

    this._removingId.set(role.id);
    this._error.set(null);

    try {
      await this.repository.remove(role.id);
      await this.load();
      return true;
    } catch (cause) {
      this._error.set(toUserMessage(cause, 'Failed to delete the role.'));
      return false;
    } finally {
      this._removingId.set(null);
    }
  }

  private async save(operation: () => Promise<Role>, fallback: string): Promise<boolean> {
    this._saving.set(true);
    this._saveError.set(null);

    try {
      this._selected.set(await operation());
      return true;
    } catch (cause) {
      this._saveError.set(toUserMessage(cause, fallback));
      return false;
    } finally {
      this._saving.set(false);
    }
  }
}
