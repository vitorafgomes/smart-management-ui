import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AUTH_ENABLED } from '@shared-kernel/auth/auth-enabled.token';

import { LandingNavbar } from './landing-navbar';

async function render(authEnabled: boolean): Promise<ComponentFixture<LandingNavbar>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [LandingNavbar],
    providers: [provideRouter([]), { provide: AUTH_ENABLED, useValue: authEnabled }],
  }).compileComponents();

  const fixture = TestBed.createComponent(LandingNavbar);
  fixture.detectChanges();

  return fixture;
}

describe('LandingNavbar', () => {
  it('shows the sign-in and create-account CTAs when auth is enabled', async () => {
    const fixture = await render(true);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="navbar-sign-in"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="navbar-register"]')).not.toBeNull();
  });

  it('hides the sign-in and create-account CTAs when auth is disabled', async () => {
    const fixture = await render(false);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="navbar-sign-in"]')).toBeNull();
    expect(el.querySelector('[data-testid="navbar-register"]')).toBeNull();
  });
});
