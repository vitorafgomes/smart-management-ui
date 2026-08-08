import { expect, Page, test } from '@playwright/test';

const SESSION_KEY = 'smart-management-auth-session';

/**
 * Seeds the mock session and the identity mock knobs before the app boots. `failingPort` is the
 * seam the in-memory adapters read (see `infrastructure/identity-mock-config.ts`): it is the only
 * way to reach an error state while every port is a mock, and Rule G says that state has to be
 * provably renderable rather than merely written.
 */
async function seed(page: Page, failingPort?: string): Promise<void> {
  await page.addInitScript(
    ([sessionKey, session, failure]) => {
      window.localStorage.setItem(sessionKey, session);
      window.localStorage.setItem('identity-mock-latency', '20');
      if (failure) {
        window.localStorage.setItem('identity-mock-failure', failure);
      } else {
        window.localStorage.removeItem('identity-mock-failure');
      }
    },
    [
      SESSION_KEY,
      JSON.stringify({
        user: { id: 'mock-user', name: 'ada', email: 'ada@smart.dev', initials: 'AD' },
        issuedAt: Date.now(),
      }),
      failingPort ?? '',
    ] as const,
  );
}

test.describe('identity module', () => {
  test('reaches the users screen from the sidenav and lists the seeded directory', async ({
    page,
  }) => {
    await seed(page);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Identity' }).click();
    await page.getByRole('link', { name: 'Users', exact: true }).click();

    await expect(page).toHaveURL(/\/identity\/users$/);
    await expect(page.getByTestId('users-table')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'ada', exact: true })).toBeVisible();
    await expect(page.getByTestId('user-count')).toContainText('14 user(s) found');
  });

  test('navigates between the three identity screens', async ({ page }) => {
    await seed(page);
    await page.goto('/identity/users');

    // Scoped to the module's own tab strip: the sidenav offers the same three destinations.
    const tabs = page.locator('.nav-pills');

    await tabs.getByRole('link', { name: 'Roles' }).click();
    await expect(page.getByTestId('roles-table')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Administrator', exact: true })).toBeVisible();

    await tabs.getByRole('link', { name: 'Permissions' }).click();
    await expect(page.getByTestId('permissions-table')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'USER_READ', exact: true })).toBeVisible();
  });

  test('creates a user and shows it in the listing', async ({ page }) => {
    await seed(page);
    await page.goto('/identity/users');

    await page.getByRole('link', { name: 'New user' }).click();
    await expect(page).toHaveURL(/\/identity\/users\/new$/);

    await page.getByLabel('Username').fill('grete');
    await page.getByLabel('Email', { exact: true }).fill('grete.hermann@smart-management.local');
    await page.getByLabel('First name').fill('Grete');
    await page.getByLabel('Last name').fill('Hermann');
    await page.getByTestId('save-user').click();

    await expect(page).toHaveURL(/\/identity\/users$/);
    await expect(page.getByRole('cell', { name: 'grete', exact: true })).toBeVisible();
    await expect(page.getByTestId('user-count')).toContainText('15 user(s) found');
  });

  test('edits a user and keeps the change in the listing', async ({ page }) => {
    await seed(page);
    await page.goto('/identity/users');

    await page.getByLabel('Edit ada').click();
    await expect(page).toHaveURL(/\/identity\/users\/user-01$/);

    // Proves the form waits for the record before accepting input, rather than rendering blank.
    await expect(page.getByLabel('Last name')).toHaveValue('Lovelace');

    await page.getByLabel('Last name').fill('Byron');
    await page.getByTestId('save-user').click();

    await expect(page).toHaveURL(/\/identity\/users$/);
    await expect(page.getByRole('cell', { name: 'Ada Byron' })).toBeVisible();
  });

  test('refuses a duplicate username and keeps the user on the form', async ({ page }) => {
    await seed(page);
    await page.goto('/identity/users/new');

    await page.getByLabel('Username').fill('grace');
    await page.getByLabel('Email', { exact: true }).fill('someone@smart-management.local');
    await page.getByLabel('First name').fill('Some');
    await page.getByLabel('Last name').fill('One');
    await page.getByTestId('save-user').click();

    await expect(page).toHaveURL(/\/identity\/users\/new$/);
    await expect(page.getByTestId('user-save-error')).toContainText('already taken');
  });

  test('shows a readable error instead of an empty table when the users port fails', async ({
    page,
  }) => {
    await seed(page, 'users');
    await page.goto('/identity/users');

    await expect(page.getByTestId('users-error')).toContainText(
      'The identity service is unavailable.',
    );
    await expect(page.getByTestId('users-table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('shows the same error state on the permissions screen when its port fails', async ({
    page,
  }) => {
    await seed(page, 'permissions');
    await page.goto('/identity/permissions');

    await expect(page.getByTestId('permissions-error')).toContainText(
      'The identity service is unavailable.',
    );
    await expect(page.getByTestId('permissions-table')).toHaveCount(0);
  });
});
