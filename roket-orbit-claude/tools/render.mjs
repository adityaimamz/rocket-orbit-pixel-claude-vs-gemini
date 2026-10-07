// Render frame demi frame -> out/frames/f0000.png ... f0359.png (1080x1920).
// `node tools/render.mjs`            semua frame
// `node tools/render.mjs 0 90 300`   hanya frame tertentu (ke out/stills/)
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPage } from './browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const picks = process.argv.slice(2).map(Number);
const dir = join(ROOT, 'out', picks.length ? 'stills' : 'frames');
if (!picks.length) await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });

const { page, errors, close } = await openPage();
const total = await page.evaluate(() => window.FRAMES);
const list = picks.length ? picks : [...Array(total).keys()];
const t0 = Date.now();
for (const f of list) {
  const url = await page.evaluate((n) => window.renderFrame(n), f);
  await writeFile(join(dir, `f${String(f).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  if (!picks.length && f % 30 === 29) process.stdout.write(`\r${f + 1}/${total} frame`);
}
await close();
console.log(`\n${list.length} frame -> ${dir} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
if (errors.length) { console.error('Error di halaman:\n' + errors.join('\n')); process.exit(1); }
