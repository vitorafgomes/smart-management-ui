import { expect, Page, test } from '@playwright/test';

const SESSION_KEY = 'smart-management-auth-session';

async function signIn(page: Page): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Email or username').fill('ada@smart.dev');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Seeds the mock session the way a previous visit would have left it, without a login round trip. */
async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    SESSION_KEY,
    JSON.stringify({
      user: { id: 'mock-user', name: 'ada', email: 'ada@smart.dev', initials: 'AD' },
      issuedAt: Date.now(),
    }),
  ] as const);
}

test.describe('shell and mock auth', () => {
  test('shows the landing page to an unauthenticated visitor at the root', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('landing-headline')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Built around the whole business' }),
    ).toBeVisible();
    await expect(page.getByTestId('navbar-register')).toBeVisible();
  });

  test('sends an authenticated visitor from the root into the app', async ({ page }) => {
    await seedSession(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('app-main-layout')).toBeVisible();
  });

  test('signs up from the landing call to action and lands in the main layout', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByTestId('cta-register').click();
    await expect(page).toHaveURL(/\/auth\/register$/);

    await page.getByLabel('Full name').fill('Grace Hopper');
    await page.getByLabel('Email').fill('grace@smart.dev');
    await page.getByLabel('Password', { exact: true }).fill('compiler-1952');
    await page.getByLabel('Confirm password').fill('compiler-1952');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('app-main-layout')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome back, Grace Hopper' })).toBeVisible();
  });

  test('refuses a second signup with the same email and says why', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel('Full name').fill('Grace Hopper');
    await page.getByLabel('Email').fill('grace@smart.dev');
    await page.getByLabel('Password', { exact: true }).fill('compiler-1952');
    await page.getByLabel('Confirm password').fill('compiler-1952');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('button', { name: 'Open profile menu' }).click();
    await page.getByTestId('logout').click();
    await page.goto('/auth/register');

    await page.getByLabel('Full name').fill('Someone Else');
    await page.getByLabel('Email').fill('grace@smart.dev');
    await page.getByLabel('Password', { exact: true }).fill('another-password');
    await page.getByLabel('Confirm password').fill('another-password');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/auth\/register$/);
    await expect(page.getByTestId('register-error')).toContainText('already exists');
  });

  test('signs in with mock credentials and renders the main layout', async ({ page }) => {
    await signIn(page);

    await expect(page.locator('app-main-layout')).toBeVisible();
    await expect(page.locator('app-topbar')).toBeVisible();
    await expect(page.locator('app-sidenav')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome back, ada' })).toBeVisible();
  });

  test('returns to the login page on logout', async ({ page }) => {
    await signIn(page);

    await page.getByRole('button', { name: 'Open profile menu' }).click();
    await page.getByTestId('logout').click();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.locator('app-main-layout')).toHaveCount(0);
  });

  test('sends an unauthenticated deep link to a protected route to the login page', async ({
    page,
  }) => {
    await page.goto('/identity/users');

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('renders a deep-linked route inside the layout for an authenticated user', async ({
    page,
  }) => {
    await seedSession(page);

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('app-main-layout app-dashboard')).toBeVisible();
    await expect(page.locator('app-sidenav')).toBeVisible();
  });
});
