import { computed, Injectable, signal } from '@angular/core';

import { AuthSession, AuthUser, Credentials, LoginResult } from './auth-models';

const SESSION_KEY = 'smart-management-auth-session';

/**
 * Mock authentication. Any non-blank credentials are accepted and produce a fixed user; the
 * session is persisted so a refresh keeps the user signed in. Blank credentials are rejected so
 * the login surface has a real failure path to render and to test, per ADR 0002.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly _session = signal<AuthSession | null>(readStoredSession());

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly currentUser = computed<AuthUser | null>(() => this._session()?.user ?? null);

  login(credentials: Credentials): LoginResult {
    const username = credentials.username.trim();

    if (!username || !credentials.password) {
      return { ok: false, reason: 'Enter both a username and a password.' };
    }

    const session: AuthSession = { user: mockUserFor(username), issuedAt: Date.now() };
    this._session.set(session);
    writeStoredSession(session);

    return { ok: true };
  }

  logout(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
  }
}

function mockUserFor(username: string): AuthUser {
  const name = username.includes('@') ? username.split('@')[0] : username;

  return {
    id: 'mock-user',
    name,
    email: username.includes('@') ? username : `${username}@smart-management.local`,
    initials: name.slice(0, 2).toUpperCase(),
  };
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    // A corrupted entry is not recoverable and must not block boot: drop it and start signed out.
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeStoredSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
