import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from './auth-state.service';

/**
 * Guards every anonymous surface: the landing page and the auth screens. It redirects to
 * `/dashboard` rather than to `/`, because `/` is itself a public route now - sending an
 * authenticated user there would bounce them straight back through this guard.
 */
export const publicGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
