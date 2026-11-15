// Start-up trace on a slowed-down phone over slow 4G: long tasks and the first frames, timed inside the page.
// usage: node tools/starttrace.mjs [port=8766] [cpu slowdown=4]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766', rate = +(process.argv[3] || 4);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.5e6, uploadThroughput: 0.75e6 });
await p.addInitScript(() => {
  window.__log = []; const T = () => Math.round(performance.now());
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__log.push(`longtask @${Math.round(e.startTime)} ${Math.round(e.duration)}ms`); }).observe({ type: 'longtask', buffered: true });
  const raf = window.requestAnimationFrame; let n = 0; window.requestAnimationFrame = (f) => raf((ts) => { if (n++ < 3) window.__log.push(`frame ${n} @${T()}`); f(ts); });
  document.addEventListener('DOMContentLoaded', () => window.__log.push(`DOMContentLoaded @${T()}`));
  addEventListener('load', () => window.__log.push(`load @${T()}`));
});
p.on('requestfinished', async (r) => { const t = r.timing(); if (/\.js|font|css|mp3/.test(r.url())) console.log('  fetched', r.url().replace(/^.*\/\/[^/]+/, '').slice(0, 60), Math.round(t.responseEnd), 'ms'); });
await p.goto(`http://localhost:${port}/index.html`);
await p.waitForTimeout(14000);
console.log((await p.evaluate(() => window.__log)).join('\n'));
await b.close();
