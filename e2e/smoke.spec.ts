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
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      SESSION_KEY,
      JSON.stringify({
        user: { id: 'mock-user', name: 'ada', email: 'ada@smart.dev', initials: 'AD' },
        issuedAt: Date.now(),
      }),
    ] as const,
  );
}

test.describe('shell and mock auth', () => {
  test('sends an unauthenticated visitor from the root to the login page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
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
