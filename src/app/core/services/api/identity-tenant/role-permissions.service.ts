import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddRolePermissionRequest } from '@core/models/useCases/identity-tenant';
import { RolePermission } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolePermissionsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/role-permissions`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new role permission
   */
  addRolePermission(request: AddRolePermissionRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get role permission by ID
   */
  getRolePermissionById(id: string): Observable<RolePermission> {
    return this.http.get<RolePermission>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update role permission (partial update using JSON Patch)
   */
  updateRolePermission(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete role permission
   */
  deleteRolePermission(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get role permissions with filters
   */
  getRolePermissionsByFilters(filters: any): Observable<PagedResult<RolePermission>> {
    return this.http.get<PagedResult<RolePermission>>(`${this.apiUrl}/Filters`, {
      params: filters
    });
  }
}
