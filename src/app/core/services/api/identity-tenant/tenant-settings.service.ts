import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddTenantSettings } from '@core/models/useCases/identity-tenant';
import { TenantSettings } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantSettingsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/tenant-settings`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new tenant settings
   */
  addTenantSettings(request: AddTenantSettings): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get tenant settings by ID
   */
  getTenantSettingsById(id: string): Observable<TenantSettings> {
    return this.http.get<TenantSettings>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update tenant settings (partial update using JSON Patch)
   */
  updateTenantSettings(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete tenant settings
   */
  deleteTenantSettings(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get tenant settings with filters
   */
  getTenantSettingsByFilters(filters: any): Observable<PagedResult<TenantSettings>> {
    return this.http.get<PagedResult<TenantSettings>>(`${this.apiUrl}/Filters`, {
      params: filters
    });
  }
}
