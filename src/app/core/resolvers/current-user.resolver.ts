import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { firstValueFrom, filter, take, timeout, catchError, of } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { CurrentUserStore, CurrentUserState } from '@core/stores/current-user.store';
import { KeycloakAuthService } from '@core/services/auth/keycloak-auth.service';

/**
 * Resolver that ensures current user data is loaded before navigating to protected routes.
 * This prevents the UI from showing empty user information (like initials, name, etc.)
 *
 * The resolver will:
 * 1. Check if user data is already loaded (from previous navigation or page refresh)
 * 2. Try to restore from sessionStorage if available
 * 3. Trigger a fresh load from API if needed
 * 4. Wait for the loading to complete before allowing navigation
 */
export const currentUserResolver: ResolveFn<boolean> = async () => {
  const currentUserStore = inject(CurrentUserStore);
  const authService = inject(KeycloakAuthService);

  // If already loaded, proceed immediately
  if (currentUserStore.isLoaded()) {
    return true;
  }

  // Try to restore from sessionStorage first (faster)
  const restored = currentUserStore.restoreFromStorage();
  if (restored) {
    return true;
  }

  // If authenticated but no user data, load from API
  if (authService.isAuthenticated()) {
    const userProfile = authService.userProfile();

    if (userProfile?.id) {
      // Trigger load
      currentUserStore.loadCurrentUserData({ keycloakUserId: userProfile.id });

      // Wait for loading to complete with timeout
      try {
        // Convert signal to observable and wait for isLoaded to become true
        const isLoaded$ = toObservable(currentUserStore.isLoaded);

        await firstValueFrom(
          isLoaded$.pipe(
            filter(isLoaded => isLoaded === true),
            take(1),
            timeout(10000), // 10 second timeout
            catchError(() => {
              console.warn('User data loading timed out');
              return of(false);
            })
          )
        );

        return true;
      } catch (error) {
        console.error('Error waiting for user data:', error);
        // Allow navigation even if loading fails - UI will show loading state
        return true;
      }
    }
  }

  // No authentication or user profile, let the auth guard handle it
  return true;
};
