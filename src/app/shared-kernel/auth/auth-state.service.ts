import { computed, Injectable, signal } from '@angular/core';

import {
  AuthSession,
  AuthUser,
  Credentials,
  LoginResult,
  Registration,
  RegisterResult,
} from './auth-models';

const SESSION_KEY = 'smart-management-auth-session';
const ACCOUNTS_KEY = 'smart-management-auth-accounts';

/** What signup records. No credential is kept: mock login accepts any password (ADR 0002). */
interface StoredAccount {
  readonly name: string;
  readonly email: string;
}

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

  /**
   * Mock signup: records the account so a second attempt with the same email can fail, then
   * signs the new user straight in. Email comparison is case-insensitive because an email
   * address is, and a duplicate that only differs in case would otherwise slip through.
   */
  register(registration: Registration): RegisterResult {
    const name = registration.name.trim();
    const email = registration.email.trim();

    if (!name || !email || !registration.password) {
      return { ok: false, reason: 'Enter your name, your email and a password.' };
    }

    const accounts = readStoredAccounts();
    if (accounts.some((account) => account.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, reason: 'An account with that email already exists.' };
    }

    writeStoredAccounts([...accounts, { name, email }]);

    const session: AuthSession = { user: registeredUser(name, email), issuedAt: Date.now() };
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

function registeredUser(name: string, email: string): AuthUser {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return { id: 'mock-user', name, email, initials };
}

function readStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    // Same reasoning as the session: a corrupted entry is dropped rather than allowed to
    // break signup for good.
    localStorage.removeItem(ACCOUNTS_KEY);
    return [];
  }
}

function writeStoredAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
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
