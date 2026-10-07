// Cek: (1) tiap frame hanya memakai warna palet (<= 16 warna, dari kanvas tampil),
// (2) deterministik: render ulang dalam urutan acak harus menghasilkan hash identik,
// (3) tidak ada error di console.
import { openPage } from './browser.mjs';
import { HEX } from '../src/palette.js';
import { hash } from '../src/util.js';

const allowed = new Set(HEX.map((h) => {
  const n = parseInt(h.slice(1), 16);
  return (((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0);
}));

const { page, errors, close } = await openPage();
const total = await page.evaluate(() => window.FRAMES);
const first = [];
const used = new Set();
let bad = 0;
for (let f = 0; f < total; f++) {
  const d = await page.evaluate((n) => window.frameDigest(n), f);
  first[f] = d.hash;
  for (const c of d.colors) {
    used.add(c);
    if (!allowed.has(c >>> 0)) { bad++; console.error(`frame ${f}: warna di luar palet ${c.toString(16)}`); break; }
  }
}
// urutan acak deterministik, mundur, dan lompat
const order = [...Array(total).keys()].sort((a, b) => hash(a, 99) - hash(b, 99));
let mismatch = 0;
for (const f of order) {
  const d = await page.evaluate((n) => window.frameDigest(n), f);
  if (d.hash !== first[f]) { mismatch++; console.error(`frame ${f}: hash beda saat di-seek acak`); }
}
await close();

console.log(`Frame: ${total}`);
console.log(`Warna terpakai: ${used.size} (palet ${HEX.length}) ${bad ? 'GAGAL' : 'OK'}`);
console.log(`Determinisme (seek acak, ${total} frame): ${mismatch ? `GAGAL ${mismatch}` : 'OK'}`);
console.log(`Error console: ${errors.length ? errors.join('\n') : 'tidak ada'}`);
process.exit(bad || mismatch || errors.length ? 1 : 0);
