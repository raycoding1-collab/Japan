import { chromium } from 'playwright';
const [size = '1440x810', dpr = '1'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: +dpr });
p.on('pageerror', (e) => console.log('page error:', e.message));
await p.goto('http://localhost:8765/index.html?t=30');
await p.waitForFunction('window.__ready === true');
const r = await p.evaluate(() => {
  const s = window.__stage, acc = {};
  for (const m of ['ring', 'drawEntity', 'fire']) { const f = s[m].bind(s); s[m] = (...a) => { const t0 = performance.now(); const v = f(...a); acc[m] = (acc[m] || 0) + performance.now() - t0; return v; }; }
  // time canvas ops by kind on the main + world contexts
  for (const [nm, g] of [['g', s.g], ['wg', s.wg], ['mg', s.mg], ['lg', s.lg]]) for (const op of ['drawImage', 'fillRect', 'fill', 'stroke']) {
    const f = g[op].bind(g); g[op] = (...a) => { const t0 = performance.now(); const v = f(...a); const k = nm + '.' + op + (g.globalCompositeOperation !== 'source-over' ? ':' + g.globalCompositeOperation : ''); acc[k] = (acc[k] || 0) + performance.now() - t0; return v; };
  }
  const N = 10, t0 = performance.now(); for (let i = 0; i < N; i++) window.__renderAt(30 + i * 0.05);
  // force flush
  s.g.getImageData(0, 0, 1, 1);
  const total = (performance.now() - t0) / N; const out = { total: total.toFixed(1) };
  for (const k of Object.keys(acc).sort((a, b) => acc[b] - acc[a]).slice(0, 14)) out[k] = (acc[k] / N).toFixed(1);
  return out;
});
console.log(size, 'dpr', dpr, JSON.stringify(r, null, 0));
await b.close();
