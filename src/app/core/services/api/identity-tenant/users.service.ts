import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AddUserRequest, FilterUsersRequest, toFilterUsersParams, UpdateUserRequest } from '@core/models/useCases/identity-tenant';
import { User } from '@core/models/domain/identity-tenant';
import { PagedResult, JsonPatchDocument, JsonPatchOperation } from '@core/models/common';
import { environment } from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/users`;
  private readonly http = inject(HttpClient);

  /**
   * Create a new user
   */
  addUser(request: AddUserRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update user (partial update using JSON Patch)
   */
  updateUserPatch(id: string, patchDocument: JsonPatchDocument): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Update user profile using UpdateUserRequest
   * Converts the request to JSON Patch format
   */
  updateUser(request: UpdateUserRequest): Observable<void> {
    const patchDocument = this.createPatchDocument(request);
    return this.updateUserPatch(request.id, patchDocument);
  }

  /**
   * Delete user
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Resync user event (republish to RabbitMQ)
   * Used to resync users that were not properly synced to MongoDB
   */
  resyncUser(id: string): Observable<{ userId: string; success: boolean; message: string }> {
    return this.http.post<{ userId: string; success: boolean; message: string }>(`${this.apiUrl}/${id}/resync`, {});
  }

  /**
   * Get users with filters using FilterUsersRequest Use Case
   * Note: Users endpoint wraps PagedResult in "users" property
   */
  getUsersByFilters(request: FilterUsersRequest): Observable<PagedResult<User>> {
    const params = toFilterUsersParams(request);
    return this.http.get<{ users: PagedResult<User> }>(`${this.apiUrl}/Filters`, { params }).pipe(
      map(response => response.users)
    );
  }

  /**
   * Create JSON Patch document from UpdateUserRequest
   */
  private createPatchDocument(request: UpdateUserRequest): JsonPatchOperation[] {
    const operations: JsonPatchOperation[] = [];
    const fieldsToUpdate: (keyof Omit<UpdateUserRequest, 'id' | 'tenantId'>)[] = [
      'firstName', 'lastName', 'middleName', 'displayName',
      'phoneCountryCode', 'phone', 'mobile', 'avatarUrl',
      'preferredLanguage', 'preferredTimezone', 'preferredCurrency',
      'preferredDateFormat', 'preferredTimeFormat',
      'countryCode', 'city', 'stateProvince',
      'spokenLanguages', 'workingHours'
    ];

    for (const field of fieldsToUpdate) {
      if (request[field] !== undefined) {
        operations.push({
          op: 'replace',
          path: `/${field}`,
          value: request[field]
        });
      }
    }

    return operations;
  }
}
