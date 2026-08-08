import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * Whether the auth surface (sign in, sign up, and everything behind `authGuard`) is reachable
 * in this build. Defaults from `environment.authEnabled`, so re-enabling for a future release
 * is a one-line flip in `src/environments/environment.production.ts`. Kept as an InjectionToken,
 * not a bare import, so specs can override it per test instead of mocking the environment module.
 */
export const AUTH_ENABLED = new InjectionToken<boolean>('AUTH_ENABLED', {
  providedIn: 'root',
  factory: () => environment.authEnabled,
});
