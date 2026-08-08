import { computed, inject, Injectable, signal } from '@angular/core';

import { toUserMessage } from '../domain/identity-error';
import { DEFAULT_PAGE_SIZE } from '../domain/paged-result';
import { Role } from '../domain/role';
import { NewUser, User, UserEdit } from '../domain/user';
import { UserRepository } from '../domain/user-repository';

import { ROLE_REPOSITORY, USER_REPOSITORY } from './identity-ports';

/**
 * The user management use cases. This is a rewrite of the legacy one-class-per-use-case services
 * plus the state each screen kept for itself: state lives here as signals, the screens only read
 * it and call methods. See [[vault/pages/conventions/signals-state]].
 */
@Injectable()
export class UsersFacade {
  private readonly repository = inject<UserRepository>(USER_REPOSITORY);
  private readonly roleRepository = inject(ROLE_REPOSITORY);

  private readonly _users = signal<readonly User[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _search = signal('');
  private readonly _page = signal(1);
  private readonly _totalResults = signal(0);
  private readonly _totalPages = signal(1);

  private readonly _roles = signal<readonly Role[]>([]);
  private readonly _selected = signal<User | null>(null);
  private readonly _detailLoading = signal(false);
  private readonly _detailError = signal<string | null>(null);
  private readonly _saving = signal(false);
  private readonly _saveError = signal<string | null>(null);
  private readonly _removingId = signal<string | null>(null);

  readonly pageSize = DEFAULT_PAGE_SIZE;

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly search = this._search.asReadonly();
  readonly page = this._page.asReadonly();
  readonly totalResults = this._totalResults.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();

  readonly roles = this._roles.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly detailError = this._detailError.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();
  readonly removingId = this._removingId.asReadonly();

  /** Distinct from the error case on purpose: "no results" and "the request failed" render differently. */
  readonly isEmpty = computed(
    () => !this._loading() && this._error() === null && this._users().length === 0,
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

      this._users.set(result.entries);
      this._totalResults.set(result.totalResults);
      this._totalPages.set(result.totalPages);
    } catch (cause) {
      this._error.set(toUserMessage(cause, 'Failed to load users.'));
      this._users.set([]);
      this._totalResults.set(0);
      this._totalPages.set(1);
    } finally {
      this._loading.set(false);
    }
  }

  /** A new search always restarts at page one - page 4 of the previous result set means nothing. */
  async setSearch(term: string): Promise<void> {
    this._search.set(term);
    this._page.set(1);
    await this.load();
  }

  async setPage(page: number): Promise<void> {
    this._page.set(page);
    await this.load();
  }

  /** The role picker on the user form. Its failure is reported through the form's error state. */
  async loadRoles(): Promise<void> {
    try {
      this._roles.set(await this.roleRepository.listAll());
    } catch (cause) {
      this._roles.set([]);
      this._saveError.set(toUserMessage(cause, 'Failed to load the available roles.'));
    }
  }

  async loadUser(id: string): Promise<void> {
    this._detailLoading.set(true);
    this._detailError.set(null);
    this._saveError.set(null);

    try {
      this._selected.set(await this.repository.getById(id));
    } catch (cause) {
      this._detailError.set(toUserMessage(cause, 'Failed to load this user.'));
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

  /** Returns whether the save succeeded, so the caller knows whether to navigate away. */
  async create(payload: NewUser): Promise<boolean> {
    return this.save(() => this.repository.create(payload), 'Failed to create the user.');
  }

  async update(id: string, payload: UserEdit): Promise<boolean> {
    return this.save(() => this.repository.update(id, payload), 'Failed to update the user.');
  }

  async remove(id: string): Promise<boolean> {
    this._removingId.set(id);
    this._error.set(null);

    try {
      await this.repository.remove(id);
      await this.load();
      return true;
    } catch (cause) {
      this._error.set(toUserMessage(cause, 'Failed to delete the user.'));
      return false;
    } finally {
      this._removingId.set(null);
    }
  }

  private async save(operation: () => Promise<User>, fallback: string): Promise<boolean> {
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
