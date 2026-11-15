// Contact sheet: node tools/sheet.mjs name "t1,t2,..." [WxH] [cols]
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
const [name, times, size = '1440x810', cols = '3'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number), ts = times.split(',').map(Number);
const dir = `shots/_${name}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.log('page error:', e.message));
p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) console.log('console:', m.text()); });
await p.goto(`http://localhost:8765/index.html?t=${ts[0]}`);
await p.waitForFunction('window.__ready === true', null, { timeout: 60000 });
await p.addStyleTag({ content: '#veil,#bar{display:none!important}' });
for (let i = 0; i < ts.length; i++) {
  await p.evaluate((t) => window.__renderAt(t), ts[i]);
  await p.screenshot({ path: `${dir}/${String(i).padStart(3, '0')}.png` });
}
await b.close();
const rows = Math.ceil(ts.length / +cols), sw = w > h ? 640 : 300;
const labels = ts.map((t, i) => `[${i}:v]scale=${sw}:-1,drawtext=text='${t}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.5[v${i}]`).join(';');
const args = ['-y', '-loglevel', 'error'];
ts.forEach((_, i) => args.push('-i', `${dir}/${String(i).padStart(3, '0')}.png`));
for (let i = ts.length; i < rows * +cols; i++) args.push('-f', 'lavfi', '-i', `color=black:s=${w}x${h}`);
const n = rows * +cols;
const extra = Array.from({ length: n - ts.length }, (_, k) => `[${ts.length + k}:v]scale=${sw}:-1[v${ts.length + k}]`).join(';');
args.push('-filter_complex', `${labels}${extra ? ';' + extra : ''};${Array.from({ length: n }, (_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${Array.from({ length: n }, (_, i) => { const c = i % +cols, r = Math.floor(i / +cols); return `${c ? Array.from({ length: c }, () => 'w0').join('+') : 0}_${r ? Array.from({ length: r }, () => 'h0').join('+') : 0}`; }).join('|')}`, `shots/sheet_${name}.jpg`);
execFileSync('ffmpeg', args);
console.log(`shots/sheet_${name}.jpg`);
