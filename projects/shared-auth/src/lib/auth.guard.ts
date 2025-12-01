import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SharedAuthService } from './shared-auth.service';

/**
 * Auth Guard for MFE routes
 * Redirects to login if not authenticated
 */
export const sharedAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(SharedAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const redirectUrl = state.url;

  // Redirect to Shell's login page
  // In MFE context, we navigate to the parent application's login
  window.location.href = `/auth/login?returnUrl=${encodeURIComponent(redirectUrl)}`;

  return false;
};

/**
 * Role-based Auth Guard for MFE routes
 * Checks if user has required roles
 */
export const sharedRoleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(SharedAuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      window.location.href = `/auth/login?returnUrl=${encodeURIComponent(state.url)}`;
      return false;
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // User doesn't have required role - redirect to unauthorized page
    router.navigate(['/error/403']);
    return false;
  };
};
