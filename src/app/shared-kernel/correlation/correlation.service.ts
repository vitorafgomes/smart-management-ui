import { Injectable } from '@angular/core';

/**
 * Two-level request identity. The session id is generated once per application boot and is
 * stable for the lifetime of the tab; a correlation id is generated per outgoing request.
 * The session id is a diagnostic value only: it is not the auth session and carries no
 * personal data.
 */
@Injectable({ providedIn: 'root' })
export class CorrelationService {
  readonly sessionId: string = crypto.randomUUID();

  newCorrelationId(): string {
    return crypto.randomUUID();
  }
}
