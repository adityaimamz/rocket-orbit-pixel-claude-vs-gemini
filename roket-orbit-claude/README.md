# Roket Orbit (Claude)

Video pixel art vertikal 12 s: roket kecil dari landasan senja ke orbit. Seluruhnya dibuat dari kode (Canvas2D, tanpa library gambar, tanpa aset), dengan musik dan SFX sintetis. Rancangan lengkap ada di [TREATMENT.md](TREATMENT.md).

- Resolusi internal 270×480, tampil 1080×1920 (nearest-neighbor)
- 30 fps, 360 frame, palet 16 warna
- `drawFrame(t)` deterministik: seek ke frame mana pun hasilnya identik

## Prasyarat
- Node.js 18+ (diuji di 24)
- ffmpeg + ffprobe di PATH
- Chromium untuk Playwright: `npx playwright install chromium` (sekali saja, kalau belum ada)

```bash
cd roket-orbit-claude
npm install
```

## Perintah
| Perintah | Fungsi | Output |
|---|---|---|
| `npm run preview` | Server lokal, buka http://localhost:5199. Space = play/pause, ←/→ = per frame, `?f=120` = lompat ke frame | — |
| `npm run stills` | Render 11 still pengecekan (per adegan) | `out/stills/` |
| `node tools/sheet.mjs out/stills out/sheet.png` | Contact sheet dari still | `out/sheet.png` |
| `npm run frames` | Render semua 360 frame lewat Playwright | `out/frames/f0000–f0359.png` |
| `npm run audio` | Sintesis musik + SFX | `out/audio.wav`, `out/music.wav`, `out/sfx.wav` |
| `npm run check` | Cek palet ≤ 16 warna di semua frame, determinisme (seek acak), error console | laporan di terminal |
| **`npm run build`** | **Render final lengkap**: frames → audio → ffmpeg | **`out/roket-orbit-claude.mp4`** |
| `node tools/build.mjs --mux` | Gabung ulang frame + audio yang sudah ada (misalnya setelah hanya mengubah audio) | sama |

Render penuh sekitar 30 detik di mesin pengembangan (15 s frame, ±10 s encode).

## Struktur
```
index.html          kanvas internal (tersembunyi) + kanvas tampil 1080x1920 + kontrol preview
src/timeline.js     satu sumber waktu untuk gambar & suara (detik, BPM, kurva ketinggian)
src/palette.js      16 warna
src/font.js         font bitmap 5x7
src/util.js         hash deterministik, easing, dither Bayer, value noise
src/scenes.js       langit, bintang, landasan, roket, asap, bumi, teks
src/draw.js         drawFrame(t)
src/main.js         framebuffer -> kanvas, API render untuk Playwright
tools/              serve, render, audio, check, build, sheet
```

## File yang perlu kamu siapkan
Tidak ada. Semua gambar dan suara dibuat dari kode.
