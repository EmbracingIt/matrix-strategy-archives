import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = 'http://localhost:3010/';
try {
  for (const width of [320, 375, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + '?view=explore&step=market');
    await page.waitForLoadState('networkidle');
    const progress = page.getByRole('navigation', { name: 'Archive retrieval progress' });
    assert.equal(await progress.getByRole('link').count(), 3);
    assert.doesNotMatch(await progress.innerText(), /ASSETS|OBJECTIVE/);
    await progress.getByRole('link', { name: /02 MARKET PHASE/ }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /BTC-Led Expansion/ }).click();
    await page.waitForURL(/view=results/);
    await page.waitForLoadState('networkidle');
    assert.ok(await page.getByText('Crypto Lending', { exact: true }).isVisible());
    assert.equal(await page.getByRole('link', { name: /EDIT ASSETS|EDIT OBJECTIVE/ }).count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await progress.getByRole('link', { name: /03 RESULTS/ }).getAttribute('aria-current'), 'step');
    await page.getByRole('link', { name: 'EDIT PHASE', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /All Market Phases/ }).click();
    await page.waitForURL(/view=results/);
    await page.waitForLoadState('networkidle');
    assert.ok(await page.getByText('8 records retrieved.', { exact: true }).isVisible());
  }
  for (const step of ['assets', 'objective']) {
    await page.goto(base + `?view=explore&step=${step}&market=bull&phase=btc-led-expansion&assets=SOL&objective=hedging`);
    await page.waitForURL(url => url.searchParams.get('view') === 'results' && !url.searchParams.has('assets') && !url.searchParams.has('objective'));
    await page.waitForLoadState('networkidle');
    assert.ok(await page.getByText('Crypto Lending', { exact: true }).isVisible());
    assert.equal(new URL(page.url()).searchParams.get('phase'), 'btc-led-expansion');
  }
  await page.goto(base + '?view=results&market=bull&assets=SOL&objective=hedging');
  await page.waitForURL(url => !url.searchParams.has('assets') && !url.searchParams.has('objective'));
  await page.waitForLoadState('networkidle');
  assert.ok(await page.getByText('5 records retrieved.', { exact: true }).isVisible());
  assert.deepEqual(errors, []);
  console.log('PASS: three-step flow, direct phase/all-phase results, edit navigation, legacy URL cleanup and ignored retired filters at five mobile/desktop widths.');
} finally { await browser.close(); }
