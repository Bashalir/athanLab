import { test, expect } from '@playwright/test';

test('app loads without white screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.locator('.sky-section')).toBeVisible();
  await expect(page.locator('.clock')).toBeVisible();
});
