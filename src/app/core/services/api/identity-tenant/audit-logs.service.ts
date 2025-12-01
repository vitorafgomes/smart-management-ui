import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/audit-logs`;

  constructor(private http: HttpClient) {}

  /**
   * Get audit log by ID
   */
  getAuditLogById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get audit logs with filters
   */
  getAuditLogsByFilters(filters: any): Observable<PagedResult<AuditLog>> {
    return this.http.get<PagedResult<AuditLog>>(`${this.apiUrl}/Filters`, {
      params: filters
    });
  }
}
