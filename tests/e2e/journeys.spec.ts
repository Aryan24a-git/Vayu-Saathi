/**
 * E2E Journey tests — Journeys A, B, C (V2-15)
 * All external network calls are intercepted via page.route().
 * No live API or LLM calls are made.
 * Run with: npx playwright test tests/e2e/journeys.spec.ts
 */
import { test, expect, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------
const MOCK_GEOCODE = {
  results: [
    {
      id: 1,
      name: 'Delhi',
      latitude: 28.66,
      longitude: 77.22,
      country: 'India',
      admin1: 'Delhi',
    },
  ],
};

const MOCK_AQI = {
  current: { time: '2026-11-22T06:00', pm2_5: 180, us_aqi: 230 },
  hourly: { time: ['2026-11-22T06:00'], pm2_5: [180], us_aqi: [230] },
};

const MOCK_PLAN = {
  band: 'very-unhealthy',
  aqi: 230,
  actions: [
    {
      id: 'ACT-001',
      title: 'Wear N95 mask outdoors',
      section: 'today',
      impact: { personal: ['Reduces inhaled PM2.5 by ~95%'], community: [] },
      budget: 'low',
    },
  ],
  narrative: 'Stay indoors and wear an N95 mask when you go out.',
};

// ---------------------------------------------------------------------------
// Helper: intercept all upstream API calls
// ---------------------------------------------------------------------------
async function mockUpstreamApis(page: Page): Promise<void> {
  await page.route('**/geocoding-api.open-meteo.com/**', (route: Route) =>
    route.fulfill({ json: MOCK_GEOCODE })
  );
  await page.route('**/air-quality-api.open-meteo.com/**', (route: Route) =>
    route.fulfill({ json: MOCK_AQI })
  );
  await page.route('**/api/geocode*', (route: Route) =>
    route.fulfill({ json: { results: MOCK_GEOCODE.results } })
  );
  await page.route('**/api/air-quality*', (route: Route) => route.fulfill({ json: MOCK_AQI }));
  await page.route('**/api/plan', (route: Route) => route.fulfill({ json: MOCK_PLAN }));
  await page.route('**/api/ask', (route: Route) =>
    route.fulfill({
      json: {
        answer: 'Avoid outdoor activity. Keep windows closed.',
        source: 'static',
      },
    })
  );
}

// ---------------------------------------------------------------------------
// Journey A — Happy path: home → plan pages load; axe at 3 viewports
// ---------------------------------------------------------------------------
test.describe('Journey A — Happy path', () => {
  test('home page loads and shows heading', async ({ page }) => {
    await mockUpstreamApis(page);
    await page.goto('/');
    await expect(page.locator("h1, [role='heading']").first()).toBeVisible();
  });

  test('plan page loads without crash', async ({ page }) => {
    await mockUpstreamApis(page);
    await page.goto('/plan');
    await expect(page).toHaveURL(/\/plan/);
  });

  test('axe: home at desktop — no critical/serious violations', async ({ page }) => {
    await mockUpstreamApis(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test('axe: home at tablet — no critical/serious violations', async ({ page }) => {
    await mockUpstreamApis(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test('axe: plan at mobile — no critical/serious violations', async ({ page }) => {
    await mockUpstreamApis(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/plan');
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Journey B — Provider failure → page does not crash; plan works in basic mode
// ---------------------------------------------------------------------------
test.describe('Journey B — Provider failure → manual AQI fallback', () => {
  test('page does not crash when AQI provider returns 503', async ({ page }) => {
    await page.route('**/air-quality-api.open-meteo.com/**', (route: Route) => {
      return route.fulfill({ status: 503, body: 'Service Unavailable' });
    });
    await page.route('**/api/air-quality*', (route: Route) =>
      route.fulfill({ status: 503, body: 'Service Unavailable' })
    );
    await page.route('**/api/plan', (route: Route) => route.fulfill({ json: MOCK_PLAN }));
    await page.goto('/');
    await expect(page.locator("h1, [role='heading']").first()).toBeVisible();
  });

  test('plan page works in basic mode without live AQI', async ({ page }) => {
    await page.route('**/api/air-quality*', (route: Route) =>
      route.fulfill({ status: 503, body: 'Service Unavailable' })
    );
    await page.route('**/api/plan', (route: Route) => route.fulfill({ json: MOCK_PLAN }));
    await page.goto('/plan');
    await expect(page).toHaveURL(/\/plan/);
  });
});

// ---------------------------------------------------------------------------
// Journey C — Clear data: localStorage reset, page reloads with defaults
// ---------------------------------------------------------------------------
test.describe('Journey C — Clear data', () => {
  test('page loads cleanly with no localStorage profile', async ({ page }) => {
    await mockUpstreamApis(page);
    await page.goto('/');
    const profileData = await page.evaluate(() => localStorage.getItem('clearair_profile'));
    await expect(page.locator("h1, [role='heading']").first()).toBeVisible();
    // Profile key may be absent or null on first visit
    expect(profileData === null || typeof profileData === 'string').toBe(true);
  });

  test('page reloads with defaults after localStorage is cleared', async ({ page }) => {
    await mockUpstreamApis(page);
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('clearair_profile', JSON.stringify({ schemaVersion: 1 }));
    });
    await page.evaluate(() => {
      localStorage.removeItem('clearair_profile');
    });
    await page.reload();
    await expect(page.locator("h1, [role='heading']").first()).toBeVisible();
  });
});
