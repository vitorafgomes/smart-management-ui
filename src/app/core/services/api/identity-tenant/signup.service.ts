import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SignUpRequest } from '@core/models/useCases/identity-tenant';
import {environment} from '@/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/signup`;

  constructor(private http: HttpClient) {}

  /**
   * Register a new user
   */
  signUp(request: SignUpRequest): Observable<void> {
    return this.http.post<void>(this.apiUrl, request);
  }
}