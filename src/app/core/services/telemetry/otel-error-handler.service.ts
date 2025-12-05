import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { TelemetryService } from './telemetry.service';

@Injectable()
export class OtelErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);
  private readonly telemetry = inject(TelemetryService);

  handleError(error: unknown): void {
    // Run outside Angular zone to avoid triggering change detection
    this.zone.runOutsideAngular(() => {
      try {
        if (error instanceof Error) {
          // Capture error with OpenTelemetry
          this.telemetry.captureError(error, {
            'error.source': 'angular_error_handler',
            'error.unhandled': true
          });

          // Log to console
          console.error('[Angular Error Handler]', error);
        } else {
          // Handle non-Error objects
          const errorObj = new Error(String(error));
          this.telemetry.captureError(errorObj, {
            'error.source': 'angular_error_handler',
            'error.unhandled': true,
            'error.original_type': typeof error
          });

          console.error('[Angular Error Handler] Non-Error object:', error);
        }
      } catch (telemetryError) {
        // Fallback if telemetry fails
        console.error('[Angular Error Handler] Original error:', error);
        console.error('[Angular Error Handler] Telemetry error:', telemetryError);
      }
    });
  }
}
