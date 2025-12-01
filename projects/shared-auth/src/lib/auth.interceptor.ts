import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SharedAuthService } from './shared-auth.service';

/**
 * HTTP Interceptor to add authentication token to requests
 * Use this in MFE applications to automatically add the Bearer token
 */
export const sharedAuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(SharedAuthService);
  const token = authService.getToken();

  // Skip adding token for certain URLs (e.g., public endpoints)
  const skipUrls = ['/assets/', '/public/'];
  const shouldSkip = skipUrls.some(url => req.url.includes(url));

  if (token && !shouldSkip) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
