import { TestBed } from '@angular/core/testing';

import { AuthStateService } from './auth-state.service';

const SESSION_KEY = 'smart-management-auth-session';
const ACCOUNTS_KEY = 'smart-management-auth-accounts';

function freshService(): AuthStateService {
  TestBed.resetTestingModule();
  return TestBed.inject(AuthStateService);
}

describe('AuthStateService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated when nothing is stored', () => {
    const service = freshService();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('authenticates and derives a mock user from the username', () => {
    const service = freshService();

    const result = service.login({ username: 'ada@smart.dev', password: 'anything' });

    expect(result).toEqual({ ok: true });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual({
      id: 'mock-user',
      name: 'ada',
      email: 'ada@smart.dev',
      initials: 'AD',
    });
  });

  it('rejects blank credentials without opening a session', () => {
    const service = freshService();

    const result = service.login({ username: '   ', password: '' });

    expect(result).toEqual({ ok: false, reason: 'Enter both a username and a password.' });
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('restores the session from storage so a refresh stays signed in', () => {
    freshService().login({ username: 'ada', password: 'secret' });

    const afterRefresh = freshService();

    expect(afterRefresh.isAuthenticated()).toBe(true);
    expect(afterRefresh.currentUser()?.name).toBe('ada');
  });

  it('clears the session and its stored copy on logout', () => {
    const service = freshService();
    service.login({ username: 'ada', password: 'secret' });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('registers an account and signs the new user straight in', () => {
    const service = freshService();

    const result = service.register({
      name: 'Ada Lovelace',
      email: 'ada@smart.dev',
      password: 'analytical-engine',
    });

    expect(result).toEqual({ ok: true });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()).toEqual({
      id: 'mock-user',
      name: 'Ada Lovelace',
      email: 'ada@smart.dev',
      initials: 'AL',
    });
  });

  it('refuses a second signup with the same email, whatever its casing', () => {
    freshService().register({ name: 'Ada', email: 'ada@smart.dev', password: 'first-pass' });

    const service = freshService();
    const result = service.register({
      name: 'Impostor',
      email: 'ADA@Smart.dev',
      password: 'second-pass',
    });

    expect(result).toEqual({ ok: false, reason: 'An account with that email already exists.' });
    expect(service.currentUser()?.name).toBe('Ada');
  });

  it('refuses a signup with a missing field without recording an account', () => {
    const service = freshService();

    const result = service.register({ name: '  ', email: 'ada@smart.dev', password: 'secret' });

    expect(result).toEqual({ ok: false, reason: 'Enter your name, your email and a password.' });
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(ACCOUNTS_KEY)).toBeNull();
  });

  it('keeps registered accounts across instances so the duplicate check survives a refresh', () => {
    freshService().register({ name: 'Ada', email: 'ada@smart.dev', password: 'secret-pass' });

    const result = freshService().register({
      name: 'Ada Again',
      email: 'ada@smart.dev',
      password: 'secret-pass',
    });

    expect(result.ok).toBe(false);
  });

  it('lets signup proceed and drops the entry when the stored accounts are corrupt', () => {
    localStorage.setItem(ACCOUNTS_KEY, 'not-json');

    const result = freshService().register({
      name: 'Ada',
      email: 'ada@smart.dev',
      password: 'secret-pass',
    });

    expect(result).toEqual({ ok: true });
  });

  it('starts signed out and drops the entry when stored data is corrupt', () => {
    localStorage.setItem(SESSION_KEY, 'not-json');

    const service = freshService();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
