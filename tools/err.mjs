import { chromium } from 'playwright';
const t = process.argv[2] || '9.6';
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 810 } });
p.on('pageerror', (e) => console.log('page error:', e.stack));
p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.goto(`http://localhost:8765/index.html?t=${t}`);
await p.waitForTimeout(6000);
await b.close();
