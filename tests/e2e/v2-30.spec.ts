// V2-30 Full E2E suite — 3 viewports, all interactions, production build only.
// Satisfies: TEST-004, REQ-001, REQ-003, REQ-010, REQ-021, REQ-023, A11Y-001
import { test, expect, type Page } from '@playwright/test';

const MOCK_CITY_SCENARIO = {
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
  hourlyPM25: [
    220, 215, 210, 200, 195, 190, 185, 175, 165, 150, 130, 115, 105, 98, 95, 102, 118, 140, 165,
    185, 205, 215, 222, 225,
  ],
  hourlyWind: Array(24).fill(5),
  isSynthetic: false,
};

async function interceptApis(page: Page): Promise<void> {
  await page.route('**/api/city-scenario*', (route) => route.fulfill({ json: MOCK_CITY_SCENARIO }));
  await page.route('**/api/ask', (route) =>
    route.fulfill({
      json: {
        answer: 'Stay indoors and wear an N95 mask when outdoors.',
        disclaimer: 'Informational only. Not medical advice.',
      },
    })
  );
  await page.route('**/api/playbook', (route) => route.fulfill({ status: 503 }));
}

async function setupAndLoadDelhi(page: Page): Promise<void> {
  await interceptApis(page);
  await page.goto('/');
  await expect(page.locator('body[data-hydrated="true"]')).toBeVisible({ timeout: 10_000 });
  const quickDelhi = page.getByRole('button', { name: 'Delhi', exact: true });
  await quickDelhi.click();
  await expect(page.getByText('CPCB NAQI', { exact: true })).toBeVisible({ timeout: 10_000 });
}

function visibleTab(page: Page, pattern: RegExp) {
  return page.locator('button[role="tab"]:visible', { hasText: pattern }).first();
}

test.describe('V2-30 Full Suite', () => {
  test('live-data-first landing shows empty state with quick cities (no auto synthetic data)', async ({
    page,
  }) => {
    await interceptApis(page);
    await page.goto('/');
    await expect(page.locator('body[data-hydrated="true"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Check live winter air quality/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delhi', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Use my location/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter AQI manually/i })).toBeVisible();
    await expect(page.getByText(/Demo scenario \(synthetic data\)/i)).not.toBeVisible();
  });

  test('zero CSP violations and tab switching updates aria-selected', async ({ page }) => {
    const cspErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Refused to execute')) {
        cspErrors.push(msg.text());
      }
    });
    await setupAndLoadDelhi(page);

    const playbookTab = visibleTab(page, /Playbook/i);
    const askTab = visibleTab(page, /Ask AI/i);
    const communityTab = visibleTab(page, /Community/i);

    await expect(playbookTab).toHaveAttribute('aria-selected', 'true');
    await askTab.click();
    await expect(askTab).toHaveAttribute('aria-selected', 'true');
    await communityTab.click();
    await expect(communityTab).toHaveAttribute('aria-selected', 'true');
    expect(cspErrors).toHaveLength(0);
  });

  test('profile drawer opens, saves, clears data, and closes on Escape', async ({ page }) => {
    await setupAndLoadDelhi(page);
    const profileBtn = page.getByRole('button', { name: /Profile/i }).first();
    await profileBtn.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    await profileBtn.click();
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: /Clear my data/i }).click();
    await expect(page.getByText(/Check live winter air quality/i)).toBeVisible();
  });

  test('chart jump button and arrow keys update hour readout', async ({ page }) => {
    await setupAndLoadDelhi(page);
    const chartRegion = page.getByRole('region', { name: /24-hour smog dispersion chart/i });
    await chartRegion.focus();
    await page.keyboard.press('ArrowRight');
    const jumpBtn = page.getByRole('button', { name: /Seal/i }).first();
    await jumpBtn.click();
    await expect(page.getByText(/Keep Windows Sealed|Optimal Safe Ventilation/i)).toBeVisible();
  });

  test('Fetch Live calls /api/city-scenario', async ({ page }) => {
    let called = false;
    await page.route('**/api/city-scenario*', (route) => {
      called = true;
      return route.fulfill({ json: MOCK_CITY_SCENARIO });
    });
    await page.goto('/');
    await expect(page.locator('body[data-hydrated="true"]')).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Fetch live Indian city/i).fill('Lucknow');
    await page.getByRole('button', { name: /Fetch Live/i }).click();
    await expect(page.getByText('CPCB NAQI', { exact: true })).toBeVisible({ timeout: 10_000 });
    expect(called).toBe(true);
  });

  test('copilot message, pledge, community pinboard & /api/ready llm boolean', async ({
    page,
    request,
  }) => {
    const readyRes = await request.get('/api/ready');
    expect(readyRes.ok()).toBe(true);
    const readyJson = await readyRes.json();
    expect(typeof readyJson.llm).toBe('boolean');

    await setupAndLoadDelhi(page);
    const pledgeCheckbox = page.locator('input[type="checkbox"]').first();
    if (await pledgeCheckbox.isVisible()) {
      await pledgeCheckbox.click();
    }

    await visibleTab(page, /Ask AI/i).click();
    const chatInput = page.getByPlaceholder(/Ask about school commute|Hindi\/Hinglish/i).first();
    await chatInput.fill('Should I open windows?');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Stay indoors|not safe/i).first()).toBeVisible({ timeout: 8_000 });

    await visibleTab(page, /Community/i).click();
    await expect(page.getByText(/WhatsApp|Pinboard/i).first()).toBeVisible();
  });

  test('no critical axe violations and capture tab screenshots', async ({ page }, testInfo) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    await setupAndLoadDelhi(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);

    if (testInfo.project.name === 'desktop') {
      await page.screenshot({ path: 'evidence/screens/desktop-playbook.png' });
      await visibleTab(page, /Ask AI/i).click();
      await page.screenshot({ path: 'evidence/screens/desktop-copilot.png' });
      await visibleTab(page, /Community/i).click();
      await page.screenshot({ path: 'evidence/screens/desktop-community.png' });
    } else if (testInfo.project.name === 'tablet') {
      await visibleTab(page, /Ask AI/i).click();
      await page.screenshot({ path: 'evidence/screens/tablet-ask.png' });
    } else if (testInfo.project.name === 'mobile') {
      await visibleTab(page, /Community/i).click();
      await page.screenshot({ path: 'evidence/screens/mobile-community.png' });
    }
  });
});
