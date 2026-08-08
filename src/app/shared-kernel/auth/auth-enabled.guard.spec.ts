import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authEnabledGuard } from './auth-enabled.guard';
import { AUTH_ENABLED } from './auth-enabled.token';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('authEnabledGuard', () => {
  it('lets a visitor reach the auth routes when auth is enabled', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AUTH_ENABLED, useValue: true }],
    });

    const result = TestBed.runInInjectionContext(() => authEnabledGuard(route, state));

    expect(result).toBe(true);
  });

  it('sends a visitor to the landing page when auth is disabled', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AUTH_ENABLED, useValue: false }],
    });

    const result = TestBed.runInInjectionContext(() => authEnabledGuard(route, state));

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/');
  });
});
