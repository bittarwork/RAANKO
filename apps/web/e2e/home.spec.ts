import { test, expect } from '@playwright/test';

test('public home scaffold loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /RAANKO/i })).toBeVisible();
});
