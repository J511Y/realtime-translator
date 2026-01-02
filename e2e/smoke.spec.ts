import { test, expect } from '@playwright/test';

test('has title and welcome text', async ({ page }) => {
  await page.goto('/');

  // 페이지 제목 확인
  await expect(page).toHaveTitle(/Create Next App/);

  // 메인 요소가 존재하는지 확인
  const main = page.locator('main');
  await expect(main).toBeVisible();
});
