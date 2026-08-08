import { Injectable, signal } from '@angular/core';

const TENANT_KEY = 'smart-management-last-tenant';
const DEFAULT_TENANT = 'smart-management';

/**
 * Mock tenant selection. There is no tenant resolution and no realm this phase - the slug is
 * remembered so the chrome can brand itself, nothing more. See ADR 0002.
 */
@Injectable({ providedIn: 'root' })
export class TenantStorageService {
  private readonly _currentTenant = signal(localStorage.getItem(TENANT_KEY) ?? DEFAULT_TENANT);

  readonly currentTenant = this._currentTenant.asReadonly();

  setTenant(slug: string): void {
    this._currentTenant.set(slug);
    localStorage.setItem(TENANT_KEY, slug);
  }

  clearTenant(): void {
    this._currentTenant.set(DEFAULT_TENANT);
    localStorage.removeItem(TENANT_KEY);
  }
}
