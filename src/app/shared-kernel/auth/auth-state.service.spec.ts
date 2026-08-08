import { TestBed } from '@angular/core/testing';

import { AuthStateService } from './auth-state.service';

const SESSION_KEY = 'smart-management-auth-session';

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

  it('starts signed out and drops the entry when stored data is corrupt', () => {
    localStorage.setItem(SESSION_KEY, 'not-json');

    const service = freshService();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
