# Roket Orbit: treatment

Video pixel art vertikal 12 s (360 frame @ 30 fps), sepenuhnya dari kode. Tanpa closing logo + CTA atas keputusan user (pengecualian dari aturan brand untuk video ini).

## 1. Ide
Roket kecil berangkat dari landasan saat senja dan naik ke orbit dalam satu tarikan kamera tanpa cut. Warna langit menjadi pengukur ketinggian: oranye senja, lalu ungu, biru tua, dan akhirnya hitam angkasa. Begitu mesin mati dan roket rebah, bumi tempat ia berangkat naik ke dalam frame. "MISSION START" diketik huruf demi huruf.

## 2. Tone & gaya
Pixel art 8-bit hangat, tenang lalu meledak lalu lega. Tidak ada gerak mengambang. Setiap perubahan punya pemicu: angka berganti di ketukan, asap dipicu venting atau ignition, langit berubah karena ketinggian, dan bumi muncul karena roket rebah. Tanpa grain, tanpa blur; piksel tajam ×4 nearest-neighbor.

## 3. Palet & tipografi
16 warna tetap (`src/palette.js`). Framebuffer berupa indeks palet, jadi warna di luar palet tidak mungkin muncul.

| # | Hex | Peran |
|---|---|---|
| 0 | `#000000` | angkasa |
| 1 | `#F5F5F5` | badan roket, teks |
| 2 | `#9CA3AF` | asap, bayangan putih |
| 3 | `#3A3F4B` | menara, landasan |
| 4 | `#0B1230` | langit malam, sisi malam bumi |
| 5 | `#1D2B64` | langit biru tua, laut gelap |
| 6 | `#3B82F6` | laut terang, atmosfer |
| 7 | `#60A5FA` | jendela roket, tepi bumi, kursor |
| 8 | `#F2763A` | senja, api, garis terminator |
| 9 | `#FFC94A` | matahari, inti api |
| 10 | `#D63C2F` | hidung & sirip roket, api luar |
| 11 | `#6B3A6E` | langit ungu, bukit jauh, sisi gelap merah |
| 12 | `#E8907A` | langit merah muda, sorotan merah |
| 13 | `#2A1E1A` | tanah |
| 14 | `#3E8F6A` | daratan terang |
| 15 | `#1F5C6B` | daratan gelap |

Tipografi: font bitmap 5×7 buatan sendiri (`src/font.js`). Angka hitung mundur memakai skala 8 (pop 2 frame di skala 9) dengan bayangan padat 2 px (bukan outline). "MISSION START" memakai skala 3 dalam dua baris.

Transisi warna langit memakai dither Bayer 4×4. Polanya menempel pada koordinat dunia, jadi tidak berkilau saat kamera naik.

## 4. Motif
Pita warna langit sebagai altimeter. Ditambah kesinambungan: senja di landasan muncul lagi sebagai garis terminator oranye di bumi dari orbit.

## 5. Storyboard (kanvas 270×480; ×4 = 1080×1920)
Area aman: teks berada di x 46–202 (tidak masuk 37 px kanan) dan y > 63, di atas 87 px terbawah.

### S1: Landasan senja (0–4 s)
- **Teks:** angka `3` (0,5 s), `2` (1,5 s), `1` (2,5 s), hilang di 3,5 s. Putih, skala 8, pusat x 124, y ±116.
- **Frame kunci:** langit berpita (oranye di cakrawala, merah muda, ungu, biru tua di atas). Matahari setengah tenggelam di kiri bawah dengan garis potong retro. Dua lapis bukit (ungu, tanah). Menara rangka di x 98–111 dengan lampu suar merah. Roket putih-merah 20×50 px berdiri di landasan, pusat x 135.
- **Gerak:** kepulan asap kecil keluar dari dasar roket kiri-kanan, makin sering menjelang 3,5 s. Lengan servis ditarik masuk (3,0–3,4 s). Lampu suar berkedip 1 Hz.
- **Transisi:** ignition 3,5 s (api kecil + awan asap landasan + guncang 1 px).
- **SFX:** detik jam tiap ketukan, bip B5 di angka 3 dan 2, bip E6 yang lebih panjang di angka 1, desis venting, kretek ignition.

### S2: Lepas landas (4–8 s)
- **Frame kunci:** roket naik ke posisi kunci (pusat y 260) dalam 1,6 s, lalu kamera ikut. Landasan, menara, dan awan asap turun keluar frame. Langit bergeser oranye → biru tua → hitam.
- **Gerak:** ketinggian `60u² + 40u³` px (u = t − 4). Bintang muncul bertahap mulai sekitar 5,5 s menurut ketinggian, mengalir turun dengan parallax 12 % dan memanjang jadi garis saat kencang. Jejak asap tertinggal di dunia dan menipis di ketinggian. Guncangan kamera 3,5–5,0 s.
- **Transisi:** roket mulai rebah ke kanan di 7,2 s, mesin mati di 7,9 s, bintang melambat sampai diam di 8,0 s.
- **SFX:** gemuruh peluncuran (noise low-pass + sub 40 Hz) yang meredup dan makin gelap seiring ketinggian, dentum mesin mati di 7,9 s.

### S3: Orbit (8–12 s)
- **Teks:** "MISSION" / "START" diketik mulai 9,0 s, satu huruf per 0,1 s (selesai 10,1 s), dengan kursor balok biru es. Kursor menyala saat mengetik dan berkedip 1 Hz setelah selesai. Posisinya y 96–147.
- **Frame kunci:** langit hitam berbintang yang berkelip terkunci frame. Bumi besar (R 300 px) naik dari bawah (7,4–9,0 s) sampai cakrawalanya di y ±340: laut, daratan, awan berpita, sisi malam di kanan dengan garis senja oranye, dan tepi atmosfer biru. Roket horizontal meluncur pelan ke kanan (x 135 → ±170) di y ±252.
- **Gerak:** roket meluncur karena momentum (tanpa api). Bumi berotasi sangat pelan.
- **Transisi:** tidak ada. Frame terakhir ditahan sampai 12 s.
- **SFX:** klik ketik per huruf (pan mengikuti posisi huruf), lonceng C6 + G6 setelah huruf terakhir.

## 6. Audio
- **Mode:** musik + SFX sintetis (`tools/audio.mjs`), tanpa VO dan tanpa sampel.
- **Sumber waktu:** `src/timeline.js`, file yang sama dengan gambar.
- **Musik 120 BPM:** S1 pad Am redup + bass A1 + detik jam. S2 F → G, bass pulse 8-an, arpeggio 16-an yang naik oktaf di bar terakhir, kick + snare. S3 pad Cmaj9 terbuka + bass C2 + lonceng arpeggio, fade 11,2–12 s. Musik di-duck sampai −45 % di bawah gemuruh.
- **Stem:** `out/music.wav` dan `out/sfx.wav` disimpan terpisah. Mix di `out/audio.wav` di-soft-limit ke ±−14 LUFS, true peak ≤ −1 dBFS setelah AAC.

## 7. Engine
Canvas2D murni, satu `index.html` + modul ES di `src/`. `drawFrame(t)` menulis ulang framebuffer indeks 270×480 secara penuh setiap kali dipanggil (tanpa state antar frame; acak lewat `hash(i, seed)`). Framebuffer diubah ke ImageData lalu diperbesar ×4 dengan `imageSmoothingEnabled = false` ke kanvas tampil 1080×1920. Render: Playwright (Chromium headless) mengambil 360 PNG, lalu ffmpeg menggabungkannya dengan audio menjadi H.264 + AAC.

Alasannya: brief meminta Canvas2D tanpa library dan aset. Framebuffer indeks menjamin batas 16 warna dan piksel tajam tanpa bergantung pada anti-alias browser.

## 8. Closing + CTA
Tidak ada (keputusan user, 2026-10-07). Video berakhir pada "MISSION START" yang ditahan ±1,9 s.
