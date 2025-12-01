import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';
import { TenantStorageService } from '../storage/tenant-storage.service';
import { CurrentUserStore } from '@core/stores/current-user.store';

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
  refreshToken: string | null;
  roles: string[];
  expiresAt: number | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  realm: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeycloakAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tenantStorage = inject(TenantStorageService);
  private readonly currentUserStore = inject(CurrentUserStore);

  private refreshTokenTimeout: ReturnType<typeof setTimeout> | null = null;

  // Reactive state
  private readonly _state = signal<AuthState>({
    isAuthenticated: false,
    isInitialized: false,
    currentRealm: null,
    userProfile: null,
    accessToken: null,
    refreshToken: null,
    roles: [],
    expiresAt: null
  });

  // Public computed signals
  readonly state = this._state.asReadonly();
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isInitialized = computed(() => this._state().isInitialized);
  readonly currentRealm = computed(() => this._state().currentRealm);
  readonly userProfile = computed(() => this._state().userProfile);
  readonly token = computed(() => this._state().accessToken);
  readonly roles = computed(() => this._state().roles);

  /**
   * Login with username and password directly via Keycloak API
   * Uses Resource Owner Password Credentials Grant
   */
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const tokenUrl = `${environment.keycloak.url}/realms/${credentials.realm}/protocol/openid-connect/token`;

      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: environment.keycloak.clientId,
        username: credentials.username,
        password: credentials.password,
        scope: 'openid profile email'
      });

      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      const response = await firstValueFrom(
        this.http.post<TokenResponse>(tokenUrl, body.toString(), { headers })
      );

      // Store tokens
      this.storeTokens(credentials.realm, response);

      // Decode and store user info from token (pass token directly as it's not in state yet)
      await this.loadUserProfile(credentials.realm, response.access_token);

      // Setup automatic token refresh
      this.setupTokenRefresh(response.expires_in, credentials.realm);

      this._state.update(state => ({
        ...state,
        isAuthenticated: true,
        isInitialized: true,
        currentRealm: credentials.realm,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + (response.expires_in * 1000),
        roles: this.extractRolesFromToken(response.access_token)
      }));

      // Load current user complete data (User, Tenant, Roles, Permissions)
      const userProfile = this._state().userProfile;
      if (userProfile?.id) {
        this.currentUserStore.loadCurrentUserData({ keycloakUserId: userProfile.id });
      }

      return true;
    } catch (error: any) {
      console.error('Login failed:', error);

      this._state.update(state => ({
        ...state,
        isAuthenticated: false,
        isInitialized: true
      }));

      // Rethrow with friendly message
      if (error.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.status === 400) {
        throw new Error('Invalid credentials or account is disabled');
      } else {
        throw new Error('Authentication failed. Please try again.');
      }
    }
  }

  /**
   * Logout and clear session
   */
  async logout(redirectToLogin: boolean = true): Promise<void> {
    try {
      const realm = this._state().currentRealm;
      const refreshToken = this._state().refreshToken;

      if (realm && refreshToken) {
        // Call Keycloak logout endpoint
        const logoutUrl = `${environment.keycloak.url}/realms/${realm}/protocol/openid-connect/logout`;

        const body = new URLSearchParams({
          client_id: environment.keycloak.clientId,
          refresh_token: refreshToken
        });

        const headers = new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        });

        try {
          await firstValueFrom(
            this.http.post(logoutUrl, body.toString(), { headers })
          );
        } catch {
          // Ignore logout errors
        }
      }
    } finally {
      // Clear local state
      this.clearSession();

      // Clear current user data
      this.currentUserStore.clear();

      if (redirectToLogin) {
        this.router.navigate(['/auth/login']);
      }
    }
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken(): Promise<boolean> {
    const realm = this._state().currentRealm;
    const refreshToken = this._state().refreshToken;

    if (!realm || !refreshToken) {
      return false;
    }

    try {
      const tokenUrl = `${environment.keycloak.url}/realms/${realm}/protocol/openid-connect/token`;

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: environment.keycloak.clientId,
        refresh_token: refreshToken
      });

      const headers = new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      const response = await firstValueFrom(
        this.http.post<TokenResponse>(tokenUrl, body.toString(), { headers })
      );

      // Update tokens
      this.storeTokens(realm, response);

      this._state.update(state => ({
        ...state,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + (response.expires_in * 1000),
        roles: this.extractRolesFromToken(response.access_token)
      }));

      // Setup next refresh
      this.setupTokenRefresh(response.expires_in, realm);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get the current access token
   * Automatically refreshes if expired or about to expire
   */
  async getToken(): Promise<string | null> {
    const expiresAt = this._state().expiresAt;
    const token = this._state().accessToken;

    if (!token) {
      return null;
    }

    // Refresh if token expires in less than 30 seconds
    if (expiresAt && Date.now() > expiresAt - 30000) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      return this._state().accessToken;
    }

    return token;
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
   * Get tenant information from storage
   * Returns the tenant that was selected during login
   */
  getTenantInfo(): { id: string; keycloakRealmName: string; companyName: string } | null {
    return this.tenantStorage.getLastTenant();
  }

  /**
   * Try to restore session from stored tokens
   */
  async tryRestoreSession(): Promise<boolean> {
    try {
      const storedData = this.getStoredTokens();

      if (!storedData) {
        this._state.update(state => ({ ...state, isInitialized: true }));
        return false;
      }

      const { realm, accessToken, refreshToken, expiresAt } = storedData;

      // Check if access token is still valid
      if (expiresAt && Date.now() < expiresAt - 30000) {
        this._state.update(state => ({
          ...state,
          isAuthenticated: true,
          isInitialized: true,
          currentRealm: realm,
          accessToken,
          refreshToken,
          expiresAt,
          roles: this.extractRolesFromToken(accessToken)
        }));

        // Load user profile
        await this.loadUserProfile(realm);

        // Setup refresh
        const remainingTime = Math.floor((expiresAt - Date.now()) / 1000);
        this.setupTokenRefresh(remainingTime, realm);

        // Try to restore current user data from storage or reload
        const restored = this.currentUserStore.restoreFromStorage();
        if (!restored) {
          const userProfile = this._state().userProfile;
          if (userProfile?.id) {
            this.currentUserStore.loadCurrentUserData({ keycloakUserId: userProfile.id });
          }
        }

        return true;
      }

      // Try to refresh the token
      this._state.update(state => ({
        ...state,
        currentRealm: realm,
        refreshToken
      }));

      const refreshed = await this.refreshAccessToken();

      if (refreshed) {
        await this.loadUserProfile(realm);

        // Try to restore current user data from storage or reload
        const restored = this.currentUserStore.restoreFromStorage();
        if (!restored) {
          const userProfile = this._state().userProfile;
          if (userProfile?.id) {
            this.currentUserStore.loadCurrentUserData({ keycloakUserId: userProfile.id });
          }
        }

        return true;
      }

      this.clearSession();
      this._state.update(state => ({ ...state, isInitialized: true }));
      return false;
    } catch (error) {
      console.error('Session restore failed:', error);
      this.clearSession();
      this._state.update(state => ({ ...state, isInitialized: true }));
      return false;
    }
  }

  /**
   * Load user profile from Keycloak
   * @param realm - The Keycloak realm
   * @param accessToken - Optional token to use (useful when token is not yet in state)
   */
  private async loadUserProfile(realm: string, accessToken?: string): Promise<void> {
    try {
      const token = accessToken || this._state().accessToken;
      if (!token) return;

      const userInfoUrl = `${environment.keycloak.url}/realms/${realm}/protocol/openid-connect/userinfo`;

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const userInfo = await firstValueFrom(
        this.http.get<any>(userInfoUrl, { headers })
      );

      const userProfile: UserProfile = {
        id: userInfo.sub || '',
        username: userInfo.preferred_username || '',
        email: userInfo.email || '',
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        fullName: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim(),
        emailVerified: userInfo.email_verified || false,
        attributes: userInfo.attributes
      };

      this._state.update(state => ({
        ...state,
        userProfile
      }));
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  /**
   * Extract roles from JWT token
   */
  private extractRolesFromToken(token: string): string[] {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const realmRoles = payload.realm_access?.roles || [];
      const clientRoles = payload.resource_access?.[environment.keycloak.clientId]?.roles || [];

      return [...realmRoles, ...clientRoles];
    } catch {
      return [];
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(expiresIn: number, realm: string): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    // Refresh 60 seconds before expiry
    const refreshTime = (expiresIn - 60) * 1000;

    if (refreshTime > 0) {
      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshAccessToken();
      }, refreshTime);
    }
  }

  /**
   * Store tokens in sessionStorage
   */
  private storeTokens(realm: string, response: TokenResponse): void {
    const data = {
      realm,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: Date.now() + (response.expires_in * 1000)
    };

    sessionStorage.setItem('keycloak_session', JSON.stringify(data));
  }

  /**
   * Get stored tokens from sessionStorage
   */
  private getStoredTokens(): { realm: string; accessToken: string; refreshToken: string; expiresAt: number } | null {
    const data = sessionStorage.getItem('keycloak_session');
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Clear session and stored tokens
   */
  private clearSession(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }

    sessionStorage.removeItem('keycloak_session');

    this._state.set({
      isAuthenticated: false,
      isInitialized: true,
      currentRealm: null,
      userProfile: null,
      accessToken: null,
      refreshToken: null,
      roles: [],
      expiresAt: null
    });
  }
}
