// Pretend to be Instagram's in-app browser (iPhone, Android, iPhone sideways): strict "sound needs a tap" rule,
// touch input, a viewport shrunk by the app's bars. Tap Begin, tap for controls, leave and return, resume.
// usage: node tools/inapp.mjs [port=8766]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0 (iPhone14,7; iOS 17_5; en_US; en; scale=3.00; 1170x2532; 0)';
const UA_AND = 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0 Android';
const b = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
let failed = 0;
for (const [name, ua, w, h, dpr] of [['in-app iPhone', UA_IOS, 390, 664, 3], ['in-app Android', UA_AND, 412, 780, 2.625], ['in-app iPhone sideways', UA_IOS, 750, 340, 3], ['in-app small iPhone', UA_IOS, 375, 548, 2]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: ua });
  const p = await ctx.newPage(); const errs = [];
  await p.addInitScript(() => { const A = window.Audio; window.Audio = function (...a) { const el = new A(...a); window.__audio = el; return el; }; });
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`http://localhost:${port}/index.html`); await p.waitForTimeout(2000);
  await p.tap('#begin'); await p.waitForTimeout(3500);
  const a1 = await p.evaluate(() => ({ t: +window.__audio.currentTime.toFixed(1), playing: !window.__audio.paused }));
  await p.touchscreen.tap(w / 2, h / 3); await p.waitForTimeout(500);
  const bar = await p.evaluate(() => { const c = document.getElementById('caption').getBoundingClientRect(), b = document.getElementById('bar').getBoundingClientRect(); return { shown: document.getElementById('bar').classList.contains('show'), captionGap: Math.round(b.top - c.bottom) }; });
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(800);
  const away = await p.evaluate(() => !window.__audio.paused);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(600);
  const back = await p.evaluate(() => ({ playing: !window.__audio.paused, playButtonShown: document.getElementById('bar').classList.contains('show') }));
  await p.tap('#play'); await p.waitForTimeout(1200);
  const resumed = await p.evaluate(() => !window.__audio.paused);
  const ok = a1.playing && bar.shown && bar.captionGap >= 6 && !away && !back.playing && back.playButtonShown && resumed && !errs.length; if (!ok) failed++;
  console.log(`${name}: sound on first tap ${a1.playing} | controls ${bar.shown}, caption-to-controls gap ${bar.captionGap}px | paused when away ${!away} | Play shown on return ${back.playButtonShown} | resumes ${resumed} | errors ${errs.length ? errs.join(' | ') : 'none'} -> ${ok ? 'ok' : 'PROBLEM'}`);
  await ctx.close();
}
await b.close();
process.exit(failed ? 1 : 0);
