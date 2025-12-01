import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { KeycloakAuthService } from '../services/auth/keycloak-auth.service';
import { CurrentUserStore } from '../stores/current-user.store';

/**
 * Guard that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(KeycloakAuthService);
  const router = inject(Router);

  // Wait for Keycloak to be initialized
  if (!authService.isInitialized()) {
    // Try to restore session from stored realm
    await authService.tryRestoreSession();
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  sessionStorage.setItem('redirectUrl', state.url);

  // Redirect to login page
  router.navigate(['/auth/login']);
  return false;
};

/**
 * Guard that checks for specific roles
 * Use as: canActivate: [roleGuard(['admin', 'manager'])]
 * Roles are checked against both realm roles and client roles
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(KeycloakAuthService);
    const router = inject(Router);

    // First check authentication
    if (!authService.isInitialized()) {
      await authService.tryRestoreSession();
    }

    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirectUrl', state.url);
      router.navigate(['/auth/login']);
      return false;
    }

    // Check roles (includes both realm and client roles)
    const hasRole = authService.hasAnyRole(allowedRoles);

    if (!hasRole) {
      // Redirect to forbidden page or dashboard
      router.navigate(['/forbidden']);
      return false;
    }

    return true;
  };
};

/**
 * Guard that prevents authenticated users from accessing public routes (like login)
 * Redirects to dashboard if user is already authenticated
 */
export const publicGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(KeycloakAuthService);
  const router = inject(Router);

  // Wait for Keycloak to be initialized
  if (!authService.isInitialized()) {
    await authService.tryRestoreSession();
  }

  if (authService.isAuthenticated()) {
    // User is already authenticated, redirect to dashboard
    router.navigate(['/dashboards/control-center']);
    return false;
  }

  return true;
};

/**
 * Permission check configuration for routes
 */
export interface PermissionGuardConfig {
  resource: string;
  action: string;
  redirectTo?: string;
}

/**
 * Guard that checks for specific permissions
 * Use as: canActivate: [permissionGuard({ resource: 'Users', action: 'Read' })]
 *
 * @example
 * // Single permission check
 * { path: 'users', canActivate: [permissionGuard({ resource: 'Users', action: 'Read' })] }
 *
 * // With custom redirect
 * { path: 'admin', canActivate: [permissionGuard({ resource: 'Admin', action: 'Manage', redirectTo: '/dashboard' })] }
 */
export const permissionGuard = (config: PermissionGuardConfig): CanActivateFn => {
  return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(KeycloakAuthService);
    const currentUserStore = inject(CurrentUserStore);
    const router = inject(Router);

    // First check authentication
    if (!authService.isInitialized()) {
      await authService.tryRestoreSession();
    }

    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirectUrl', state.url);
      router.navigate(['/auth/login']);
      return false;
    }

    // Wait for current user data to be loaded
    if (!currentUserStore.isLoaded()) {
      // Try to restore from storage
      const restored = currentUserStore.restoreFromStorage();
      if (!restored) {
        // Data not available yet, allow access and let the component handle it
        // This prevents blocking while data loads
        return true;
      }
    }

    // Check if user is admin (admins have all permissions)
    if (currentUserStore.isAdmin()) {
      return true;
    }

    // Check the specific permission
    const hasPermission = currentUserStore.hasPermission(config.resource, config.action);

    if (!hasPermission) {
      // Redirect to specified page or forbidden
      const redirectTo = config.redirectTo || '/forbidden';
      router.navigate([redirectTo]);
      return false;
    }

    return true;
  };
};

/**
 * Guard that checks for any of the specified permissions
 * Use as: canActivate: [anyPermissionGuard([{ resource: 'Users', action: 'Read' }, { resource: 'Users', action: 'Manage' }])]
 */
export const anyPermissionGuard = (permissions: PermissionGuardConfig[], redirectTo?: string): CanActivateFn => {
  return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(KeycloakAuthService);
    const currentUserStore = inject(CurrentUserStore);
    const router = inject(Router);

    // First check authentication
    if (!authService.isInitialized()) {
      await authService.tryRestoreSession();
    }

    if (!authService.isAuthenticated()) {
      sessionStorage.setItem('redirectUrl', state.url);
      router.navigate(['/auth/login']);
      return false;
    }

    // Wait for current user data
    if (!currentUserStore.isLoaded()) {
      currentUserStore.restoreFromStorage();
    }

    // Admin has all permissions
    if (currentUserStore.isAdmin()) {
      return true;
    }

    // Check if user has any of the permissions
    const hasAnyPermission = permissions.some(p =>
      currentUserStore.hasPermission(p.resource, p.action)
    );

    if (!hasAnyPermission) {
      router.navigate([redirectTo || '/forbidden']);
      return false;
    }

    return true;
  };
};

/**
 * Guard that checks if user is an admin
 */
export const adminGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(KeycloakAuthService);
  const currentUserStore = inject(CurrentUserStore);
  const router = inject(Router);

  // First check authentication
  if (!authService.isInitialized()) {
    await authService.tryRestoreSession();
  }

  if (!authService.isAuthenticated()) {
    sessionStorage.setItem('redirectUrl', state.url);
    router.navigate(['/auth/login']);
    return false;
  }

  // Wait for current user data
  if (!currentUserStore.isLoaded()) {
    currentUserStore.restoreFromStorage();
  }

  if (!currentUserStore.isAdmin()) {
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
};
