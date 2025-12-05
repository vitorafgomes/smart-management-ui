import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AddGroupRequest, FilterGroupsRequest, toFilterGroupsParams } from '@core/models/useCases/identity-tenant';
import { Group } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/groups`;
  private readonly http = inject(HttpClient);

  /**
   * Create a new group
   */
  addGroup(request: AddGroupRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get group by ID
   */
  getGroupById(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update group (partial update using JSON Patch)
   */
  updateGroup(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete group
   */
  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get groups with filters using FilterGroupsRequest Use Case
   * Note: Groups endpoint wraps PagedResult in "pagedResult" property
   */
  getGroupsByFilters(request: FilterGroupsRequest): Observable<PagedResult<Group>> {
    const params = toFilterGroupsParams(request);
    return this.http.get<{ pagedResult: PagedResult<Group> }>(`${this.apiUrl}/Filters`, { params }).pipe(
      map(response => response.pagedResult)
    );
  }
}
