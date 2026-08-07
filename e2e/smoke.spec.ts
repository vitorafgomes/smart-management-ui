import { expect, test } from '@playwright/test';

test.describe('application boot', () => {
  test('serves the app at the root route with rendered content', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('app-root')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('smart-management-ui');
  });
});
