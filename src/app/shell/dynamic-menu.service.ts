import { Injectable, signal } from '@angular/core';

import { MOCK_MENU } from './menu-data';
import { MenuItem } from './menu-item';

/**
 * Serves the sidenav its items. The real implementation fetches modules, applications and pages
 * and filters them by role; this one hands back the fixture in menu-data.ts, keeping the same
 * signal surface (items, loading, error) so swapping in the API is a change inside this service.
 * See vault/pages/decisions/0002-mock-first-auth-and-data.md.
 */
@Injectable({ providedIn: 'root' })
export class DynamicMenuService {
  private readonly _items = signal<readonly MenuItem[]>(MOCK_MENU);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
}
