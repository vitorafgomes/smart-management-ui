import { Injectable, signal, computed } from '@angular/core';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  emailVerified: boolean;
  attributes?: Record<string, string[]>;
}

export interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  currentRealm: string | null;
  userProfile: UserProfile | null;
  accessToken: string | null;
  roles: string[];
}

const AUTH_STORAGE_KEY = 'keycloak_session';
const AUTH_EVENT_KEY = 'mfe_auth_event';

/**
 * Shared Authentication Service for Microfrontends
 *
 * This service provides a way to share authentication state between
 * the Shell application and MFE remotes using sessionStorage events.
 */
@Injectable({
  providedIn: 'root'
})
export class SharedAuthService {
  private readonly _state = signal<AuthState>({
    isAuthenticated: false,
    isInitialized: false,
    currentRealm: null,
    userProfile: null,
    accessToken: null,
    roles: []
  });

  // Public computed signals
  readonly state = this._state.asReadonly();
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isInitialized = computed(() => this._state().isInitialized);
  readonly currentRealm = computed(() => this._state().currentRealm);
  readonly userProfile = computed(() => this._state().userProfile);
  readonly token = computed(() => this._state().accessToken);
  readonly roles = computed(() => this._state().roles);

  constructor() {
    this.initializeFromStorage();
    this.listenForAuthEvents();
  }

  /**
   * Initialize state from sessionStorage
   */
  private initializeFromStorage(): void {
    try {
      const sessionData = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const userProfile = this.extractUserFromToken(parsed.accessToken);

        this._state.set({
          isAuthenticated: true,
          isInitialized: true,
          currentRealm: parsed.realm,
          userProfile,
          accessToken: parsed.accessToken,
          roles: this.extractRolesFromToken(parsed.accessToken)
        });
      } else {
        this._state.update(s => ({ ...s, isInitialized: true }));
      }
    } catch (error) {
      console.error('[SharedAuth] Failed to initialize from storage:', error);
      this._state.update(s => ({ ...s, isInitialized: true }));
    }
  }

  /**
   * Listen for authentication events from the Shell application
   */
  private listenForAuthEvents(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === AUTH_STORAGE_KEY) {
        if (event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            const userProfile = this.extractUserFromToken(parsed.accessToken);

            this._state.set({
              isAuthenticated: true,
              isInitialized: true,
              currentRealm: parsed.realm,
              userProfile,
              accessToken: parsed.accessToken,
              roles: this.extractRolesFromToken(parsed.accessToken)
            });
          } catch (error) {
            console.error('[SharedAuth] Failed to parse auth event:', error);
          }
        } else {
          // Session was cleared - user logged out
          this._state.set({
            isAuthenticated: false,
            isInitialized: true,
            currentRealm: null,
            userProfile: null,
            accessToken: null,
            roles: []
          });
        }
      }
    });

    // Also listen for custom auth events (for same-tab communication)
    window.addEventListener(AUTH_EVENT_KEY, ((event: CustomEvent) => {
      const { type, data } = event.detail;

      if (type === 'login') {
        const userProfile = this.extractUserFromToken(data.accessToken);
        this._state.set({
          isAuthenticated: true,
          isInitialized: true,
          currentRealm: data.realm,
          userProfile,
          accessToken: data.accessToken,
          roles: this.extractRolesFromToken(data.accessToken)
        });
      } else if (type === 'logout') {
        this._state.set({
          isAuthenticated: false,
          isInitialized: true,
          currentRealm: null,
          userProfile: null,
          accessToken: null,
          roles: []
        });
      } else if (type === 'refresh') {
        this._state.update(s => ({
          ...s,
          accessToken: data.accessToken,
          roles: this.extractRolesFromToken(data.accessToken)
        }));
      }
    }) as EventListener);
  }

  /**
   * Get the current access token (synchronous)
   */
  getToken(): string | null {
    return this._state().accessToken;
  }

  /**
   * Get the current access token (async - refreshes from storage)
   */
  async getTokenAsync(): Promise<string | null> {
    // Re-read from storage to get latest token
    try {
      const sessionData = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);

        // Update local state if token changed
        if (parsed.accessToken !== this._state().accessToken) {
          this._state.update(s => ({
            ...s,
            accessToken: parsed.accessToken,
            roles: this.extractRolesFromToken(parsed.accessToken)
          }));
        }

        return parsed.accessToken;
      }
    } catch (error) {
      console.error('[SharedAuth] Failed to get token:', error);
    }
    return null;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this._state().roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Extract user profile from JWT token
   */
  private extractUserFromToken(token: string): UserProfile | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return {
        id: payload.sub || '',
        username: payload.preferred_username || '',
        email: payload.email || '',
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        fullName: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        emailVerified: payload.email_verified || false,
        attributes: payload.attributes
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract roles from JWT token
   */
  private extractRolesFromToken(token: string): string[] {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const realmRoles = payload.realm_access?.roles || [];
      // Extract client roles - use the aud claim or a known client id
      const clientId = payload.azp || 'smart-management-ui';
      const clientRoles = payload.resource_access?.[clientId]?.roles || [];

      return [...realmRoles, ...clientRoles];
    } catch {
      return [];
    }
  }

  /**
   * Notify MFEs of auth state change (called by Shell)
   */
  static notifyAuthChange(type: 'login' | 'logout' | 'refresh', data?: any): void {
    const event = new CustomEvent(AUTH_EVENT_KEY, {
      detail: { type, data }
    });
    window.dispatchEvent(event);
  }
}
