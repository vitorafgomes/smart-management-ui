import { Injectable } from '@angular/core';
import { TenantSuggestion } from '@core/models/domain/identity-tenant/tenants/tenant-suggestion';

const TENANT_STORAGE_KEY = 'smart-management-last-tenant';

@Injectable({
  providedIn: 'root'
})
export class TenantStorageService {

  saveTenant(tenant: TenantSuggestion): void {
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
    } catch (error) {
      console.warn('Failed to save tenant to localStorage:', error);
    }
  }

  getLastTenant(): TenantSuggestion | null {
    try {
      const stored = localStorage.getItem(TENANT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as TenantSuggestion;
      }
      return null;
    } catch (error) {
      console.warn('Failed to retrieve tenant from localStorage:', error);
      return null;
    }
  }

  clearTenant(): void {
    try {
      localStorage.removeItem(TENANT_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear tenant from localStorage:', error);
    }
  }
}
