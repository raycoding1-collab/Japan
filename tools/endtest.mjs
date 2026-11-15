// Jump to the last chapter, play to the end: the end title shows, the controls return, and Play replays.
// usage: node tools/endtest.mjs [port=8766]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.addInitScript(() => { const A = window.Audio; window.Audio = function (...a) { const el = new A(...a); window.__audio = el; return el; }; });
await p.goto(`http://localhost:${port}/index.html`); await p.waitForTimeout(2000);
await p.click('#begin'); await p.waitForTimeout(2000);
await p.mouse.move(200, 800); await p.click('#chap'); await p.waitForTimeout(300);
const n = await p.locator('#chapters button').count(); await p.locator('#chapters button').nth(n - 1).click();
let title = false;
for (let i = 0; i < 240 && !(await p.evaluate(() => window.__audio.ended)); i++) { await p.waitForTimeout(500); title = title || (await p.evaluate(() => document.getElementById('end').classList.contains('on'))); }
const fin = await p.evaluate(() => ({ ended: window.__audio.ended, controls: document.getElementById('bar').classList.contains('show'), label: document.getElementById('play').getAttribute('aria-label') }));
await p.click('#play'); await p.waitForTimeout(2500);
const re = await p.evaluate(() => ({ t: +window.__audio.currentTime.toFixed(1), playing: !window.__audio.paused }));
const ok = title && fin.ended && fin.controls && re.playing && re.t < 10 && !errs.length;
console.log('end title shown:', title, '| at end:', JSON.stringify(fin), '| replay:', JSON.stringify(re), '| errors:', errs.length ? errs.join(' | ') : 'none', ok ? '-> ok' : '-> PROBLEM');
await b.close(); process.exit(ok ? 0 : 1);
