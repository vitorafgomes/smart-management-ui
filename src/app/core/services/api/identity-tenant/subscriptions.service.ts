import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddSubscriptionRequest } from '@core/models/useCases/identity-tenant';
import { Subscription } from '@core/models/domain/identity-tenant';
import { PagedResult } from '@core/models/common';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/subscriptions`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new subscription
   */
  addSubscription(request: AddSubscriptionRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }

  /**
   * Get subscription by ID
   */
  getSubscriptionById(id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update subscription (partial update using JSON Patch)
   */
  updateSubscription(id: string, patchDocument: any): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, patchDocument, {
      headers: { 'Content-Type': 'application/json-patch+json' }
    });
  }

  /**
   * Delete subscription
   */
  deleteSubscription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get subscriptions with filters
   */
  getSubscriptionsByFilters(filters: any): Observable<PagedResult<Subscription>> {
    return this.http.get<PagedResult<Subscription>>(`${this.apiUrl}/Filters`, {
      params: filters
    });
  }
}
