import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dtoToInput } from "../src/lib/strategy-form";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const origin = "http://localhost:3010";
if (!process.env.STORAGE_DATABASE_URL?.includes("@127.0.0.1:55432/matrix_rebuild")) throw new Error("Admin tests are local-only");

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  let original;
  let created;
  let protocol;
  async function api(path: string, method = "GET", data?: unknown) {
    const response = await page.request.fetch(origin + path, { method, data, headers: { origin } });
    assert.ok(response.ok(), `${method} ${path}: ${response.status()}`);
    return response.status() === 204 ? null : response.json();
  }
  async function save() {
    const response = page.waitForResponse(r => r.url().includes('/api/strategies/') && r.request().method() === 'PUT');
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    assert.equal((await response).status(), 200);
  }
  try {
    await page.goto(origin + "/?view=admin");
    await page.getByLabel("Password", { exact: true }).fill("local-preview-only");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Log out", exact: true }).waitFor();
    const records = await api("/api/strategies?status=ALL");
    assert.equal(records.length, 22);
    original = await api(`/api/strategies/${records.find(s => s.strategyId === 'STRATEGY_001').id}`);
    assert.equal(original.education.example.scenarios.length, 4);
    const unchangedLp = await api(`/api/strategies/${records.find(s => s.strategyId === 'STRATEGY_016').id}`);
    assert.equal(unchangedLp.risk.conversionReversalRisk, undefined);
    const riskRoundTrip = dtoToInput(original);
    riskRoundTrip.risk = {
      ...riskRoundTrip.risk,
      conversionReversalRisk: 'MEDIUM',
      conversionReversalExplanation: 'Local admin risk-field round-trip.',
    };
    const riskSaved = await api(`/api/strategies/${original.id}`, 'PUT', riskRoundTrip);
    assert.equal(riskSaved.risk.conversionReversalRisk, 'MEDIUM');
    assert.equal(riskSaved.risk.conversionReversalExplanation, 'Local admin risk-field round-trip.');
    await page.goto(origin + `/?view=admin&edit=${original.id}`);
    await page.getByLabel("Name", { exact: true }).fill(original.name + " local check");
    await save();
    assert.equal((await api(`/api/strategies/${original.id}`)).name, original.name + " local check");
    await page.getByRole("button", { name: /Beginner page/ }).click();
    await page.getByLabel("Structured beginner content (JSON)").fill("{");
    await page.getByRole("button", { name: "Apply validated content" }).click();
    assert.ok(await page.locator("p[role=alert]").isVisible());
    await page.getByLabel("Structured beginner content (JSON)").fill(JSON.stringify({ ...original.education, tradeOff: original.education.tradeOff + " Local editor check." }));
    await page.getByRole("button", { name: "Apply validated content" }).click();
    await save();
    assert.ok((await api(`/api/strategies/${original.id}`)).education.tradeOff.endsWith("Local editor check."));
    for (const tab of ['Instructions', 'Market Fit', 'Assets', 'Platforms', 'Risk', 'Requirements', 'References', 'Status', 'History']) {
      await page.getByRole('button', { name: new RegExp(tab + '$') }).click();
      await page.waitForLoadState('networkidle');
    }
    const input = dtoToInput(original, { name: 'Local admin workflow check', slug: 'local-admin-workflow-check', status: 'DRAFT', legacyAliases: [] });
    delete input.strategyId;
    created = await api('/api/strategies', 'POST', input);
    await page.goto(origin + `/?view=admin&edit=${created.id}`);
    assert.equal(await page.getByLabel('Name', { exact: true }).inputValue(), created.name);
    const publishing = page.waitForResponse(r => r.url().includes(`/api/strategies/${created.id}`) && r.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    assert.equal((await publishing).status(), 200);
    assert.equal((await api(`/api/strategies/${created.id}`)).status, 'PUBLISHED');
    await page.reload();
    await page.getByRole('button', { name: 'Save changes', exact: true }).waitFor();
    for (const section of ['assets', 'networks', 'protocols']) {
      await page.goto(origin + `/?view=admin&section=${section}`);
      await page.waitForLoadState('networkidle');
      assert.ok((await api(`/api/${section}`)).length > 0);
    }
    protocol = (await api('/api/protocols')).find(p => p.slug === 'aave');
    const edited = await api(`/api/protocols/${protocol.id}`, 'PUT', { ...protocol, description: protocol.description + ' Local check.' });
    assert.equal(JSON.parse(edited.reviewJson).status, 'reviewed');
    assert.ok(edited.description.endsWith('Local check.'));
    assert.deepEqual(errors, []);
    console.log('PASS: actual admin sign-in, strategy UI save, invalid/valid structured content, all editor panels, draft creation/publishing/reload, taxonomy registries and protocol review persistence.');
  } finally {
    if (original) await api(`/api/strategies/${original.id}`, 'PUT', dtoToInput(original));
    if (protocol) await api(`/api/protocols/${protocol.id}`, 'PUT', protocol);
    if (created) await api(`/api/strategies/${created.id}`, 'DELETE');
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
