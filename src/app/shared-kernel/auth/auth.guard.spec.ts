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

  it('sends an authenticated user away from a public route', () => {
    TestBed.inject(AuthStateService).login({ username: 'ada', password: 'secret' });

    const result = TestBed.runInInjectionContext(() => publicGuard(route, state));

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/');
  });
});
