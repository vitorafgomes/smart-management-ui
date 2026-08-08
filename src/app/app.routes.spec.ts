import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthStateService } from '@shared-kernel/auth/auth-state.service';

import { routes } from './app.routes';

async function harness(): Promise<RouterTestingHarness> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });

  return RouterTestingHarness.create();
}

function signIn(): void {
  TestBed.inject(AuthStateService).login({ username: 'ada', password: 'secret' });
}

describe('app routes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the landing page to an anonymous visitor at the root', async () => {
    const router = await harness();

    await router.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(router.routeNativeElement?.querySelector('app-landing-hero')).not.toBeNull();
  });

  it('sends an authenticated visitor from the root into the app', async () => {
    const router = await harness();
    signIn();

    await router.navigateByUrl('/');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('sends an anonymous deep link to a protected route to the login page', async () => {
    const router = await harness();

    await router.navigateByUrl('/identity/users');

    expect(TestBed.inject(Router).url).toBe('/auth/login');
  });

  it('keeps an authenticated visitor out of the auth screens', async () => {
    const router = await harness();
    signIn();

    await router.navigateByUrl('/auth/register');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('serves the registration screen to an anonymous visitor', async () => {
    const router = await harness();

    await router.navigateByUrl('/auth/register');

    expect(TestBed.inject(Router).url).toBe('/auth/register');
    expect(router.routeNativeElement?.querySelector('#confirm-password')).not.toBeNull();
  });
});
