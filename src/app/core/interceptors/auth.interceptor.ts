import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { KeycloakAuthService } from '../services/auth/keycloak-auth.service';
import { environment } from '@/environments/environment';

/**
 * HTTP Interceptor that adds Bearer token to API requests
 * Also handles 401 responses by redirecting to login
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(KeycloakAuthService);

  // Skip token injection for non-API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Skip for authentication endpoints that don't need a token
  const skipUrls = [
    '/api/v1/tenants/Filters' // Tenant search for login autocomplete
  ];

  if (skipUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  // Get token and add to request
  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      return next(req);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token is invalid or expired
        // The authService.getToken() should have tried to refresh
        // If we still get 401, logout the user
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};

/**
 * Interceptor that adds the current tenant ID to requests
 */
export const tenantInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(KeycloakAuthService);

  // Skip for non-API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const currentRealm = authService.currentRealm();

  if (currentRealm) {
    const tenantReq = req.clone({
      setHeaders: {
        'X-Tenant-Realm': currentRealm
      }
    });
    return next(tenantReq);
  }

  return next(req);
};
