import { computed, inject, Injectable, signal } from '@angular/core';

import { toUserMessage } from '../domain/identity-error';
import { DEFAULT_PAGE_SIZE } from '../domain/paged-result';
import { NewPermission, Permission, PermissionEdit } from '../domain/permission';
import { PermissionRepository } from '../domain/permission-repository';

import { PERMISSION_REPOSITORY } from './identity-ports';

/** The permission catalogue use cases. Unlike users and roles, permissions also filter by module. */
@Injectable()
export class PermissionsFacade {
  private readonly repository = inject<PermissionRepository>(PERMISSION_REPOSITORY);

  private readonly _permissions = signal<readonly Permission[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _search = signal('');
  private readonly _module = signal('');
  private readonly _page = signal(1);
  private readonly _totalResults = signal(0);
  private readonly _totalPages = signal(1);

  private readonly _selected = signal<Permission | null>(null);
  private readonly _detailLoading = signal(false);
  private readonly _detailError = signal<string | null>(null);
  private readonly _saving = signal(false);
  private readonly _saveError = signal<string | null>(null);
  private readonly _removingId = signal<string | null>(null);

  readonly pageSize = DEFAULT_PAGE_SIZE;

  readonly permissions = this._permissions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly search = this._search.asReadonly();
  readonly module = this._module.asReadonly();
  readonly page = this._page.asReadonly();
  readonly totalResults = this._totalResults.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();

  readonly selected = this._selected.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly detailError = this._detailError.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();
  readonly removingId = this._removingId.asReadonly();

  readonly isEmpty = computed(
    () => !this._loading() && this._error() === null && this._permissions().length === 0,
  );
  readonly isFiltered = computed(
    () => this._search().trim().length > 0 || this._module().length > 0,
  );

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.repository.list({
        search: this._search(),
        module: this._module(),
        page: this._page(),
        pageSize: this.pageSize,
      });

      this._permissions.set(result.entries);
      this._totalResults.set(result.totalResults);
      this._totalPages.set(result.totalPages);
    } catch (cause) {
      this._error.set(toUserMessage(cause, 'Failed to load permissions.'));
      this._permissions.set([]);
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

  async setModule(module: string): Promise<void> {
    this._module.set(module);
    this._page.set(1);
    await this.load();
  }

  async setPage(page: number): Promise<void> {
    this._page.set(page);
    await this.load();
  }

  async loadPermission(id: string): Promise<void> {
    this._detailLoading.set(true);
    this._detailError.set(null);
    this._saveError.set(null);

    try {
      this._selected.set(await this.repository.getById(id));
    } catch (cause) {
      this._detailError.set(toUserMessage(cause, 'Failed to load this permission.'));
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

  async create(payload: NewPermission): Promise<boolean> {
    return this.save(() => this.repository.create(payload), 'Failed to create the permission.');
  }

  async update(id: string, payload: PermissionEdit): Promise<boolean> {
    return this.save(() => this.repository.update(id, payload), 'Failed to update the permission.');
  }

  async remove(id: string): Promise<boolean> {
    this._removingId.set(id);
    this._error.set(null);

    try {
      await this.repository.remove(id);
      await this.load();
      return true;
    } catch (cause) {
      this._error.set(toUserMessage(cause, 'Failed to delete the permission.'));
      return false;
    } finally {
      this._removingId.set(null);
    }
  }

  private async save(operation: () => Promise<Permission>, fallback: string): Promise<boolean> {
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
