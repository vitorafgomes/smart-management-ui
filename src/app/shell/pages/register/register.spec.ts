import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthStateService } from '@shared-kernel/auth/auth-state.service';

import { Register } from './register';

async function render(): Promise<ComponentFixture<Register>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [Register],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(Register);
  fixture.detectChanges();

  return fixture;
}

function fill(fixture: ComponentFixture<Register>, id: string, value: string): void {
  const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function fillValidForm(fixture: ComponentFixture<Register>): void {
  fill(fixture, 'name', 'Ada Lovelace');
  fill(fixture, 'email', 'ada@smart.dev');
  fill(fixture, 'password', 'analytical-engine');
  fill(fixture, 'confirm-password', 'analytical-engine');
}

async function submit(fixture: ComponentFixture<Register>): Promise<void> {
  (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
  await fixture.whenStable();
  fixture.detectChanges();
}

function errorText(fixture: ComponentFixture<Register>): string {
  return (
    (fixture.nativeElement as HTMLElement).querySelector('[data-testid="register-error"]')
      ?.textContent ?? ''
  ).trim();
}

describe('Register', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates the account and lands the new user in the app', async () => {
    const fixture = await render();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fillValidForm(fixture);

    await submit(fixture);

    expect(TestBed.inject(AuthStateService).currentUser()?.email).toBe('ada@smart.dev');
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(errorText(fixture)).toBe('');
  });

  it('shows the duplicate-email failure instead of navigating away', async () => {
    const fixture = await render();
    TestBed.inject(AuthStateService).register({
      name: 'Ada',
      email: 'ada@smart.dev',
      password: 'analytical-engine',
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fillValidForm(fixture);

    await submit(fixture);

    expect(errorText(fixture)).toBe('An account with that email already exists.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('refuses a mismatched confirmation and says which field is wrong', async () => {
    const fixture = await render();
    fillValidForm(fixture);
    fill(fixture, 'confirm-password', 'something-else');

    await submit(fixture);

    expect(errorText(fixture)).toBe('The two passwords do not match.');
    expect(TestBed.inject(AuthStateService).isAuthenticated()).toBe(false);
  });

  it('refuses a malformed email before reaching the auth store', async () => {
    const fixture = await render();
    fillValidForm(fixture);
    fill(fixture, 'email', 'not-an-email');

    await submit(fixture);

    expect(errorText(fixture)).toBe('Enter a valid email address.');
    expect(TestBed.inject(AuthStateService).isAuthenticated()).toBe(false);
  });

  it('refuses a password that is too short', async () => {
    const fixture = await render();
    fillValidForm(fixture);
    fill(fixture, 'password', 'short');
    fill(fixture, 'confirm-password', 'short');

    await submit(fixture);

    expect(errorText(fixture)).toBe('Use a password of at least 8 characters.');
  });

  it('asks for the empty fields when the form is submitted blank', async () => {
    const fixture = await render();

    await submit(fixture);

    expect(errorText(fixture)).toBe('Fill in every field to create your account.');
  });
});
