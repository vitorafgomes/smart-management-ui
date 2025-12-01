import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddBranding } from '@core/models/useCases/identity-tenant';
import { Branding } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandingsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/brandings`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new branding
   */
  addBranding(request: AddBranding): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get branding by ID
   */
  getBrandingById(id: string): Observable<Branding> {
    return this.http.get<Branding>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update branding (partial update using JSON Patch)
   */
  updateBranding(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete branding
   */
  deleteBranding(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get brandings with filters
   */
  getBrandingsByFilters(filters: any): Observable<PagedResult<Branding>> {
    return this.http.get<PagedResult<Branding>>(`${this.apiUrl}/Filters`, {
      params: filters
    });
  }
}
