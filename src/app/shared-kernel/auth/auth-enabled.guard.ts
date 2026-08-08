import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AUTH_ENABLED } from './auth-enabled.token';

/**
 * Guards the auth routes themselves. When AUTH_ENABLED is off for this build, there is no
 * sign-in or sign-up surface to serve, so a visit to `/auth/**` - direct or via authGuard's own
 * redirect - lands on the public landing instead of a route with nothing behind it.
 */
export const authEnabledGuard: CanActivateFn = () => {
  const router = inject(Router);

  return inject(AUTH_ENABLED) ? true : router.createUrlTree(['/']);
};
