import { ErrorHandler, inject, Injectable } from '@angular/core';

import { CorrelationService } from '../correlation/correlation.service';
import { ToastService } from '../toasts/toast.service';

/**
 * Last line of defence for root Rule G: an error that reached here was not handled at its own
 * boundary, so it is logged against the session id (the same one the correlation interceptor
 * puts on outgoing requests) and surfaced to the user rather than dying in the console.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly correlation = inject(CorrelationService);
  private readonly toasts = inject(ToastService);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`[session ${this.correlation.sessionId}] Unhandled error:`, error);
    this.toasts.show('error', 'Something went wrong', message);
  }
}
