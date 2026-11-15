// Close-up still: node tools/crop.mjs out.png t WxH dpr x,y,w,h (css px)
import { chromium } from 'playwright';
const [out, t, size, dpr, clip] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number), [x, y, cw, ch] = clip.split(',').map(Number);
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: +dpr });
p.on('pageerror', (e) => console.log('page error:', e.message));
await p.goto(`http://localhost:8765/index.html?t=${t}`);
await p.waitForFunction('window.__ready === true');
await p.addStyleTag({ content: '#veil,#bar{display:none!important}' });
await p.screenshot({ path: out, clip: { x, y, width: cw, height: ch } });
await b.close();
