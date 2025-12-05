import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AddTenant } from '@core/models/useCases/identity-tenant';
import { Tenant } from '@core/models/domain/identity-tenant';
import { TenantSuggestion } from '@core/models/domain/identity-tenant/tenants/tenant-suggestion';
import { PagedResult } from '@core/models/common';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/tenants`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new tenant
   */
  addTenant(request: AddTenant): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get tenant by ID
   */
  getTenantById(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update tenant (partial update using JSON Patch)
   */
  updateTenant(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete tenant
   */
  deleteTenant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get tenants with filters
   * Note: Tenants endpoint returns PagedResult directly (no wrapper)
   */
  getTenantsByFilters(filters: any): Observable<PagedResult<Tenant>> {
    return this.http.get<PagedResult<Tenant>>(`${this.apiUrl}/Filters`, {
      params: filters
    });
  }

  /**
   * Search tenants by Keycloak Realm Name for autocomplete
   * Note: Tenants endpoint returns PagedResult directly (no wrapper)
   * @param searchTerm - The search term (minimum 3 characters)
   * @param pageSize - Number of results to return (default: 10)
   */
  searchTenantsByRealmName(searchTerm: string, pageSize: number = 10): Observable<TenantSuggestion[]> {
    const params = new HttpParams()
      .set('CompanyNameFilteringOperation', 'None')
      .set('SubdomainFilteringOperation', 'None')
      .set('CustomDomainFilteringOperation', 'None')
      .set('KeycloakRealmIdFilteringOperation', 'None')
      .set('KeycloakRealmName', searchTerm)
      .set('KeycloakRealmNameFilteringOperation', 'StartsWith')
      .set('DefaultLanguageFilteringOperation', 'None')
      .set('DefaultCurrencyFilteringOperation', 'None')
      .set('CountryCodeFilteringOperation', 'None')
      .set('RegionCodeFilteringOperation', 'None')
      .set('Status', 'None')
      .set('PageFilter', `page=1,pageSize=${pageSize}`);

    return this.http.get<PagedResult<Tenant>>(`${this.apiUrl}/Filters`, { params }).pipe(
      map(result => result.entries.map((tenant: Tenant) => ({
        id: tenant.id,
        keycloakRealmName: tenant.keycloakRealmName,
        companyName: tenant.companyName
      })))
    );
  }

  /**
   * Upload tenant logo
   * @param tenantId - The tenant ID
   * @param formData - FormData containing the logo file
   */
  uploadLogo(tenantId: string, formData: FormData): Observable<{ logoUrl: string }> {
    return this.http.post<{ logoUrl: string }>(`${this.apiUrl}/${tenantId}/logo`, formData);
  }

  /**
   * Delete tenant logo
   * @param tenantId - The tenant ID
   */
  deleteLogo(tenantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tenantId}/logo`);
  }
}
