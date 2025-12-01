import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddRoleRequest, FilterRolesRequest, toFilterRolesParams } from '@core/models/useCases/identity-tenant';
import { Role } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/roles`;
  private readonly http = inject(HttpClient);

  /**
   * Create a new role
   */
  addRole(request: AddRoleRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get role by ID
   */
  getRoleById(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update role (partial update using JSON Patch)
   */
  updateRole(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete role
   */
  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get roles with filters using FilterRolesRequest Use Case
   */
  getRolesByFilters(request: FilterRolesRequest): Observable<PagedResult<Role>> {
    const params = toFilterRolesParams(request);
    return this.http.get<PagedResult<Role>>(`${this.apiUrl}/Filters`, { params });
  }
}
