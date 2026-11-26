// Prototype Finish Click-Through E2E (Production build, Chromium desktop only)
import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

test('full prototype click-through against live production server', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop Chromium only');

  const consoleErrors: string[] = [];
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations?.push(`${e.violatedDirective}:${e.blockedURI}`);
    });
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await page.goto('/');
  await expect(page.locator('body[data-hydrated="true"]')).toBeVisible({ timeout: 10_000 });

  // 1. Choose Delhi via quick button -> numeric NAQI + Open-Meteo source
  await page.getByRole('button', { name: 'Delhi', exact: true }).click();
  const hero = page.locator('section[aria-label="Live Air Quality and Ventilation Overview"]');
  await expect(hero).toBeVisible({ timeout: 15_000 });
  await expect(hero).toContainText(/Open-Meteo|WAQI/i);
  await expect(hero).toContainText(/Model estimate \(Open-Meteo\)|Station reading \(WAQI\)/i);
  await expect(hero).toContainText(/CPCB NAQI\s*\d+/);
  await hero.screenshot({ path: 'evidence/screens/hero.png' });

  // 2. Chart jump button changes readout
  const jump6Am = hero.getByRole('button', { name: '6:00 AM' });
  await jump6Am.click();
  await expect(hero).toContainText('Keep Windows Sealed');
  await expect(hero.locator('span.text-sm', { hasText: '6:00 AM' })).toBeVisible();

  // 3. Ticking a pledge changes the impact meter
  const impactMeter = page.locator('section[aria-label="Daily Smog Playbook"]');
  await expect(impactMeter).toContainText('0 / 6 actions completed today');
  await page
    .locator('section[aria-label="Daily Smog Playbook"] input[type="checkbox"]')
    .first()
    .click();
  await expect(impactMeter).toContainText('1 / 6 actions completed today');
  await page.screenshot({ path: 'evidence/screens/playbook.png' });

  // 4. Tab switching -> Ask AI
  const askTab = page.locator('button[role="tab"]:visible', { hasText: /Ask AI/i }).first();
  await askTab.click();
  await expect(askTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Ask VayuSaathi Copilot')).toBeVisible();
  await page.screenshot({ path: 'evidence/screens/copilot.png' });

  // 5. Tab switching -> Community & Hindi WhatsApp toggle + empty pinboard
  const communityTab = page
    .locator('button[role="tab"]:visible', { hasText: /Community/i })
    .first();
  await communityTab.click();
  await expect(communityTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Your actions on this device')).toBeVisible();
  await expect(
    page.getByText('No reports yet. Add the first one (saved on this device only)')
  ).toBeVisible();

  const previewPre = page.locator('pre');
  const beforeBulletin = await previewPre.textContent();
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  const afterBulletin = await previewPre.textContent();
  expect(afterBulletin).not.toBe(beforeBulletin);
  expect(afterBulletin).toContain('आज का वायु स्वास्थ्य अलर्ट');
  await page.screenshot({ path: 'evidence/screens/community.png' });

  // 6. Profile drawer opens, editing updates header profile pill
  const headerProfileBtn = page.locator('button[title="Click to customize household profile"]');
  await expect(headerProfileBtn).toContainText('No Purifier');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: 'evidence/screens/profile-drawer.png' });
  await dialog.getByRole('button', { name: '1 Room HEPA' }).click();
  await dialog.getByRole('button', { name: 'Save & Apply' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(headerProfileBtn).toContainText('1 Room HEPA');

  // 7. Clear my data returns to empty state
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Clear my data/i }).click();
  await expect(page.getByText(/Check live winter air quality/i)).toBeVisible();

  // 8. Zero console errors & zero CSP violations throughout
  const cspViolations = await page.evaluate(() => window.__cspViolations ?? []);
  expect(cspViolations, `CSP violations: ${cspViolations.join('; ')}`).toHaveLength(0);
  expect(consoleErrors, `Console errors: ${consoleErrors.join('; ')}`).toHaveLength(0);
});
