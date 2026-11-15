// Render every 1.5 s of the whole film at desktop and phone size and report any errors.
// usage: node tools/scan.mjs [port=8765]
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const b = await chromium.launch();
let bad = 0;
for (const [w, h] of [[1440, 810], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text()); });
  await p.goto(`http://localhost:${port}/index.html?t=0`);
  await p.waitForFunction('window.__ready === true', null, { timeout: 120000 });
  const r = await p.evaluate(() => { const out = [], dur = window.__stage.film.duration; let n = 0; for (let t = 0; t <= dur; t += 1.5, n++) { try { window.__renderAt(t); } catch (e) { out.push(t + ': ' + e.message); } } return { n, out }; });
  bad += r.out.length + errs.length;
  console.log(`${w}x${h} frames ${r.n}, errors ${r.out.length}`, r.out.slice(0, 5).join(' | '), errs.slice(0, 3).join(' | '));
  await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
