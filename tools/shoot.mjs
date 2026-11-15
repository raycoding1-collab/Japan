// Render still frames of the film at given times, for looking at critically.
// usage: node tools/shoot.mjs out_dir "t1,t2,..." [WxH] [dpr]
import { chromium } from 'playwright';
const [out, times, size = '1440x810', dpr = '1'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: +dpr });
page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text()); });
page.on('pageerror', (e) => console.log('page error:', e.message));
const ts = times.split(',').map(Number);
await page.goto(`http://localhost:8765/index.html?t=${ts[0]}`);
await page.waitForFunction('window.__ready === true', null, { timeout: 20000 });
await page.addStyleTag({ content: '#veil,#bar{display:none!important}' });
for (const t of ts) {
  await page.evaluate((t) => window.__renderAt(t), t);
  await page.screenshot({ path: `${out}/f_${size}_${String(t).padStart(5, '0')}.png` });
}
await browser.close();
