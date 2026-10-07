// Contact sheet PNG dari still untuk pengecekan visual komparasi.
// `node tools/sheet.mjs [src] [dst]`
import { readdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const [src = 'out/stills', dst = 'out/sheet.png', every = '1'] = process.argv.slice(2);
if (!existsSync(src)) {
  console.error(`Folder sumber tidak ditemukan: ${src}`);
  process.exit(1);
}

const files = readdirSync(src).filter((f) => f.endsWith('.png')).sort().filter((_, i) => i % Number(every) === 0);
if (files.length === 0) {
  console.error(`Tidak ada file PNG di ${src}`);
  process.exit(1);
}

const cols = 4, rows = Math.ceil(files.length / cols);
const list = join(src, '_list.txt');
writeFileSync(list, files.map((f) => `file '${resolve(src, f).replace(/\\/g, '/')}'`).join('\n'));
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
  '-vf', `scale=270:480:flags=neighbor,tile=${cols}x${rows}:padding=4:color=white`,
  '-frames:v', '1', dst,
]);
rmSync(list);
console.log(`${files.length} gambar -> ${dst}`);
