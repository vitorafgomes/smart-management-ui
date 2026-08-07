import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { CorrelationService } from './correlation.service';

export const SESSION_ID_HEADER = 'X-Session-Id';
export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

/**
 * The single enforcement point for request identity. No other code sets either header:
 * a hand-added header in a repository would make the pinning spec insufficient.
 */
export const correlationInterceptor: HttpInterceptorFn = (request, next) => {
  const correlation = inject(CorrelationService);

  return next(
    request.clone({
      setHeaders: {
        [SESSION_ID_HEADER]: correlation.sessionId,
        [CORRELATION_ID_HEADER]: correlation.newCorrelationId(),
      },
    }),
  );
};
