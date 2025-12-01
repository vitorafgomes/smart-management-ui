import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from '@/environments/environment';

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  // Only mock in development and when API is unavailable
  if (environment.production) {
    return next(req);
  }

  // Pass through all requests to real API
  return next(req);
};
