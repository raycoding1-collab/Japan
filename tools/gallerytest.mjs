// The gallery (gallery/index.html, published at /Japan/films/) on a PC, a phone and a phone on its side, with
// Instagram's strict "sound needs a tap" rule: previews play, a card opens its film full screen, Begin inside the
// film starts the sound, the close button and the Back gesture both return to the gallery and silence the film.
// usage: node tools/gallerytest.mjs [url=https://raycoding1-collab.github.io/Japan/films/] [shots=shots/gallery]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const url = process.argv[2] || 'https://raycoding1-collab.github.io/Japan/films/', dir = process.argv[3] || 'shots/gallery';
mkdirSync(dir, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0 (iPhone14,7; iOS 17_5; en_US; en; scale=3.00; 1170x2532; 0)';
const b = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
let failed = 0;
for (const [name, w, h, mobile, pick] of [['pc', 1440, 900, false, 2], ['phone', 390, 844, true, 2], ['phone-sideways', 844, 390, true, 1]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, userAgent: mobile ? UA : undefined });
  const p = await ctx.newPage(), errs = [];
  await p.addInitScript(() => { const A = window.Audio; window.Audio = function (...a) { const el = new A(...a); window.__audio = el; return el; }; });
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(3500);
  await p.screenshot({ path: `${dir}/${name}-1-gallery.png` });
  const playing = await p.evaluate(() => [...document.querySelectorAll('.film video')].filter((v) => !v.paused && v.currentTime > 0).length);
  const card = p.locator('.film').nth(pick);
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  if (mobile) await card.locator('.media').tap(); else await card.locator('.media').click();
  await p.waitForTimeout(420); await p.screenshot({ path: `${dir}/${name}-2-growing.png` });
  const inT0 = Date.now();
  await p.waitForSelector('#theater iframe.in', { timeout: 30000 }).catch(() => {});
  const openMs = Date.now() - inT0 + 420;
  await p.waitForTimeout(1300); await p.screenshot({ path: `${dir}/${name}-3-film.png` });
  const fr = p.frames().find((f) => f !== p.mainFrame());
  let sound = false;
  if (fr) {
    if (mobile) await fr.tap('#begin').catch((e) => errs.push('tap begin: ' + e.message)); else await fr.click('#begin').catch((e) => errs.push('click begin: ' + e.message));
    await p.waitForTimeout(4000);
    sound = await fr.evaluate(() => !!window.__audio && !window.__audio.paused && window.__audio.currentTime > 0.5).catch(() => false);
    await p.screenshot({ path: `${dir}/${name}-4-playing.png` });
  }
  const hash = await p.evaluate(() => location.hash);
  // close with the button
  if (mobile) await p.tap('#close'); else await p.click('#close');
  await p.waitForTimeout(450); await p.screenshot({ path: `${dir}/${name}-5-closing.png` });
  await p.waitForTimeout(1400);
  const back1 = await p.evaluate(() => ({ frames: document.querySelectorAll('#theater iframe').length, open: document.getElementById('theater').classList.contains('open'), hash: location.hash, playing: [...document.querySelectorAll('.film video')].filter((v) => !v.paused).length }));
  await p.screenshot({ path: `${dir}/${name}-6-back.png` });
  // open again, and leave with the Back gesture
  if (mobile) await card.locator('.media').tap(); else await card.locator('.media').click();
  await p.waitForSelector('#theater iframe', { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(2500); await p.goBack(); await p.waitForTimeout(1800);
  const back2 = await p.evaluate(() => ({ frames: document.querySelectorAll('#theater iframe').length, open: document.getElementById('theater').classList.contains('open'), url: location.href }));
  const ok = playing >= 1 && !!fr && sound && hash.length > 1 && back1.frames === 0 && !back1.open && back1.hash === '' && back1.playing >= 1 && back2.frames === 0 && !back2.open && back2.url.split('#')[0] === url.split('#')[0] && !errs.length;
  if (!ok) failed++;
  console.log(`${name}: previews playing ${playing} | film open in ${openMs} ms, url ${hash} | sound on Begin ${sound} | close: film gone ${back1.frames === 0 && !back1.open}, previews resume ${back1.playing} | Back gesture closes ${back2.frames === 0 && !back2.open} and stays on the gallery ${back2.url.split('#')[0] === url.split('#')[0]} | errors ${errs.length ? errs.join(' | ') : 'none'} -> ${ok ? 'ok' : 'FAIL'}`);
  await ctx.close();
}
await b.close();
process.exit(failed ? 1 : 0);
