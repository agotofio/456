// node render.mjs preview 3.8 30 ...   -> кадры в out/preview
// node render.mjs scenes 0 10          -> сцены с индексами 0..10 в out/scene_XX.mp4
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, 'out'); fs.mkdirSync(path.join(out, 'preview'), { recursive: true });
const [mode, ...args] = process.argv.slice(2);

const browser = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.evaluate(() => document.fonts.load('900 40px Inter').then(() => document.fonts.ready));
const scenes = await page.evaluate(() => window.SCENES), FPS = 30;

if (mode === 'preview') {
  for (const t of args.map(Number)) {
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: path.join(out, 'preview', `t${String(t).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 80 });
  }
} else {
  const [from, to] = args.map(Number);
  for (let i = from; i <= to; i++) {
    const sc = scenes[i], n = Math.round((sc.b - sc.a) * FPS), name = `scene_${String(i).padStart(2, '0')}`;
    const tmp = path.join(out, name + '.tmp.mp4'), fin = path.join(out, name + '.mp4');
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('exit', r));
    const t0 = Date.now();
    for (let f = 0; f < n; f++) {
      await page.evaluate(t => window.render(t), sc.a + f / FPS + 1e-4);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    const code = await done;
    if (code === 0) fs.renameSync(tmp, fin);
    console.log(name, n, 'frames', ((Date.now() - t0) / 1000).toFixed(1) + 's', 'exit', code);
  }
}
await browser.close();
