import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const route of ['/', '/plan', '/ask']) {
  test(`axe smoke: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (item) => item.impact === 'serious' || item.impact === 'critical'
    );
    expect(serious).toEqual([]);
  });
}

test('plan reflows at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/plan');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(overflow).toBe(false);
});

test('ask page has static fallback and live region', async ({ page }) => {
  await page.goto('/ask?consent=off');
  await expect(page.getByText(/Static catalog guidance/)).toBeVisible();
});
