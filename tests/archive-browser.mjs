import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{channel:'chrome'})});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='http://localhost:3010';
const slugs=['stablecoin-yield-rotation','blue-chip-asset-lending','eth-liquid-staking','concentrated-liquidity-provision','accumulation-lp','distribution-lp','dual-asset-growth-lp','delta-neutral-lp-hedge'];
const routes=['','?view=all','?view=explore','?view=learn','?view=tools','?view=protocols','?view=compare&slugs=stablecoin-yield-rotation,accumulation-lp',...slugs.map(slug=>`?view=strategy&slug=${slug}`)];
try {
 for(const file of ['src/components/archive/archive-entrance.tsx','src/components/archive/browse-all.tsx','src/app/globals.css']) assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'}).replaceAll('\r\n','\n'),`Original design changed: ${file}`);
 for(const width of [320,375,390,430,1440]) {
  await page.setViewportSize({width,height:900});
  for(const route of routes){await page.goto(`${base}/${route}`);await page.waitForLoadState('networkidle');assert.ok(await page.locator('main h1, main h2').first().isVisible(),route);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${route} overflow`);assert.equal(await page.getByRole('link',{name:/OPEN MATRIX/i}).first().getAttribute('href'),'https://app.matrix.finance');}
  if(width===390||width===1440){await page.goto(base);await page.waitForLoadState('networkidle');await page.screenshot({path:`local-restored-home-${width}.png`,fullPage:true});await page.goto(`${base}/?view=protocols`);await page.waitForLoadState('networkidle');await page.screenshot({path:`local-restored-protocols-${width}.png`,fullPage:true});}
 }
 await page.goto(`${base}/?view=learn`);await page.waitForLoadState('networkidle');assert.equal(await page.locator('main a[href*="view=strategy"]').count(),0);assert.equal(await page.locator('main article').count(),14);assert.equal(await page.getByRole('navigation',{name:'Primary'}).first().getByRole('link',{name:/Assets|Networks/}).count(),0);await page.screenshot({path:'local-restored-learn.png',fullPage:true});
 await page.getByRole('button',{name:'STAKING',exact:true}).click();assert.equal(await page.getByRole('button',{name:'STAKING',exact:true}).getAttribute('aria-pressed'),'true');assert.ok(await page.getByText('Validators secure the network',{exact:true}).isVisible());assert.equal(await page.getByText('CHECK YOUR UNDERSTANDING',{exact:true}).count(),0);
 for(const width of [390,1440]){await page.setViewportSize({width,height:900});await page.screenshot({path:`local-learn-interactive-${width}.png`,fullPage:true});}
 await page.goto(`${base}/?view=explore&step=phase&market=bull`);await page.waitForLoadState('networkidle');assert.match(await page.getByRole('button',{name:/BTC-Led Expansion/}).innerText(),/1 RECORD/);assert.match(await page.getByRole('button',{name:/All Bull Phases/}).innerText(),/5 RECORDS/);
 await page.goto(`${base}/?view=results&market=bull&phase=btc-led-expansion`);await page.waitForLoadState('networkidle');assert.ok(await page.getByText('Crypto Lending',{exact:true}).isVisible());assert.equal(await page.getByText('Accumulation LP',{exact:true}).count(),0);
 await page.goto(`${base}/?view=tools`);await page.waitForLoadState('networkidle');assert.equal(await page.locator('main article').count(),4);assert.equal(await page.locator('main input').count(),0);
 for(const view of ['assets','networks']){await page.goto(`${base}/?view=${view}`);await page.waitForURL(/view=all/);}
 await page.goto(`${base}/?view=protocols`);await page.waitForLoadState('networkidle');await page.getByRole('button',{name:/Aave/}).click();assert.equal(await page.getByRole('button',{name:/Aave/}).getAttribute('aria-expanded'),'true');assert.ok(await page.getByRole('link',{name:'OFFICIAL WEBSITE'}).isVisible());
 await page.goto(`${base}/?view=strategy&slug=sol-liquid-staking`);await page.waitForURL(/slug=eth-liquid-staking/);await page.getByLabel('Asset, product and network').selectOption('1');assert.ok((await page.locator('#requirements').innerText()).includes('JitoSOL'));await page.getByText('WORKED EXAMPLE / ILLUSTRATIVE, NOT LIVE RATES',{exact:true}).click();assert.ok(await page.getByText('ETH rewards do not remove ETH price risk',{exact:true}).isVisible());
 await page.goto(base);await page.waitForLoadState('networkidle');await page.keyboard.press('/');assert.ok(await page.getByRole('dialog').isVisible());await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: production UI source parity; 75 desktop/mobile route checks; removed page redirects; general Learn without strategy links; tools, protocol expansion, implementation selector, legacy alias and search dialog.');

}finally{await browser.close();}
