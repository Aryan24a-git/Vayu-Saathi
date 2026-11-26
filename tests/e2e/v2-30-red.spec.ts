// V2-30 Green verification test matching the red-first test.
// Satisfies: REQ-001, REQ-003, SEC-005, TEST-004
import { test, expect } from '@playwright/test';

const MOCK_DELHI = {
  id: 'live-delhi',
  city: 'Delhi, Delhi',
  shortCity: 'Delhi',
  subtitle: 'Live observations from Open-Meteo model (10:00)',
  sourceLabel: 'Model-derived NAQI equivalent (Open-Meteo)',
  pm25: 185,
  pm10: 230,
  no2: 48,
  wind: 4,
  basePledges: 120,
  baseCo2Kg: 420,
  hourlyPM25: Array(24).fill(185),
  hourlyWind: Array(24).fill(4),
  isSynthetic: false,
};

test.describe('V2-30 Red: Hydration + CSP baseline', () => {
  test('no CSP violations and UI is interactive', async ({ page }) => {
    const cspErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Refused to execute') || text.includes('Content Security Policy')) {
          cspErrors.push(text);
        }
      }
    });

    await page.route('**/api/city-scenario*', (route) => route.fulfill({ json: MOCK_DELHI }));
    await page.goto('/');

    // Wait for hydration canary
    await expect(page.locator('body[data-hydrated="true"]')).toBeVisible({ timeout: 8000 });

    // Load live city via quick city button
    await page.getByRole('button', { name: 'Delhi', exact: true }).click();
    await expect(page.getByText('CPCB NAQI', { exact: true })).toBeVisible({ timeout: 8000 });

    // Tab click must work after hydration
    const askTab = page.locator('button[role="tab"]:visible', { hasText: /Ask AI/i }).first();
    await askTab.click();
    await expect(askTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Playbook to verify chart jump button
    const playbookTab = page
      .locator('button[role="tab"]:visible', { hasText: /Playbook/i })
      .first();
    await playbookTab.click();
    const jumpBtn = page.getByRole('button', { name: /Vent|Seal/i }).first();
    await jumpBtn.click();

    // Profile drawer must be openable
    const profileBtn = page.getByRole('button', { name: /Profile/i }).first();
    await profileBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');

    expect(cspErrors, `CSP violations found: ${cspErrors.join('\n')}`).toHaveLength(0);
  });
});
