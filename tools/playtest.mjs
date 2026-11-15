// Real playback: press Begin, jump between chapters, pause and resume; reports audio time and captions.
// usage: node tools/playtest.mjs [port=8766]   (8766 = tools/rangeserver.py, which behaves like real hosting)
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
let failed = 0;
for (const [w, h] of [[1440, 810], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  await p.addInitScript(() => { const A = window.Audio; window.Audio = function (...a) { const el = new A(...a); window.__audio = el; return el; }; });
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await p.goto(`http://localhost:${port}/index.html`);
  await p.waitForTimeout(2500);
  await p.click('#begin');
  await p.waitForTimeout(4000);
  const st = () => p.evaluate(() => { const a = window.__audio; return { t: +a.currentTime.toFixed(1), playing: !a.paused, cap: document.getElementById('caption').textContent.slice(0, 44) }; });
  const s0 = await st(); if (!s0.playing || s0.t < 1) failed++;
  console.log(`${w}x${h} after Begin:`, JSON.stringify(s0));
  const n = await p.locator('#chapters button').count();
  for (const i of [...new Set([Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1])]) {
    await p.mouse.move(w / 2, h - 30); await p.waitForTimeout(300);
    await p.click('#chap'); await p.waitForTimeout(300);
    const want = await p.locator('#chapters button').nth(i).locator('em').textContent();
    await p.locator('#chapters button').nth(i).click();
    await p.waitForTimeout(3500);
    const s = await st(); const [m, sec] = want.split(':').map(Number);
    const ok = s.playing && s.t >= m * 60 + sec - 0.5 && s.t < m * 60 + sec + 6; if (!ok) failed++;
    console.log(`  chapter ${i + 1}/${n} (${want}):`, JSON.stringify(s), ok ? 'ok' : 'WRONG');
  }
  await p.mouse.move(w / 2, h - 30); await p.waitForTimeout(300); await p.click('#play'); await p.waitForTimeout(600);
  const a1 = await st(); await p.waitForTimeout(1000); const a2 = await st();
  await p.click('#play'); await p.waitForTimeout(1500); const a3 = await st();
  const pr = !a1.playing && a1.t === a2.t && a3.playing; if (!pr) failed++;
  console.log('  pause holds and play resumes:', pr, '| errors:', errs.length ? errs.slice(0, 5).join(' | ') : 'none');
  failed += errs.length;
  await p.close();
}
await b.close();
process.exit(failed ? 1 : 0);
