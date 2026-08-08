import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthStateService } from './auth-state.service';
import { publicGuard } from './public.guard';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('route guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('sends an anonymous visitor to the login page', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/auth/login');
  });

  it('lets an authenticated user through', () => {
    TestBed.inject(AuthStateService).login({ username: 'ada', password: 'secret' });

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
  });

  it('lets an anonymous visitor reach a public route', () => {
    const result = TestBed.runInInjectionContext(() => publicGuard(route, state));

    expect(result).toBe(true);
  });

  // The landing page is public and lives at '/', so this redirect has to name the dashboard:
  // sending an authenticated user to '/' would bounce them straight back through this guard.
  it('sends an authenticated user from a public route to the dashboard', () => {
    TestBed.inject(AuthStateService).login({ username: 'ada', password: 'secret' });

    const result = TestBed.runInInjectionContext(() => publicGuard(route, state));

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/dashboard');
  });
});
