import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddCompanyProfile } from '@core/models/useCases/identity-tenant';
import { CompanyProfile } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfilesService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/company-profiles`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new company profile
   */
  addCompanyProfile(request: AddCompanyProfile): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get company profile by ID
   */
  getCompanyProfileById(id: string): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update company profile (partial update using JSON Patch)
   */
  updateCompanyProfile(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete company profile
   */
  deleteCompanyProfile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get company profiles with filters
   */
  getCompanyProfilesByFilters(filters: any): Observable<PagedResult<CompanyProfile>> {
    return this.http.get<PagedResult<CompanyProfile>>(`${this.apiUrl}/Filters`, {
      params: filters
    });
  }
}
