# roket-orbit — Animasi Pixel Art Peluncuran Roket ke Orbit

Video vertikal 9:16 berdurasi 12 detik, sepenuhnya dirender dari kode Canvas 2D murni tanpa aset gambar eksternal maupun library pihak ketiga.

## Spesifikasi Teknis
- **Resolusi**: 270x480 internal (Canvas 2D), ditampilkan tajam pada 1080x1920 (nearest-neighbor 4x).
- **Framerate & Durasi**: 30 fps, 360 frame total (12.0 detik).
- **Palet Warna**: Terbatas tepat 16 warna retro ruang angkasa konsisten di seluruh adegan.
- **Audio**: Musik latar (BGM chiptune 120 BPM) dan efek suara peluncuran (beeps, gemuruh roket, typewriter teletype) 100% disintesis dari kode ke format WAV 48 kHz stereo 16-bit.
- **Pipa Render**: Playwright headless Chromium merender frame per frame deterministik `f(t)` lalu dialirkan langsung ke `ffmpeg`.

## Struktur Adegan
1. **(0.0s – 4.0s) Landasan Peluncuran Saat Senja**:
   - Menara servis, meja peluncur, dan roket di waktu senja.
   - Hitung mundur piksel "3", "2", "1" dengan efek pop skala.
   - Penebalan uap ventilasi gas dingin (LOX venting).
   - Pengapian (Ignition) pada 3.0s dengan semburan api dan asap tebal bergulung dari parit peluncur.
2. **(4.0s – 8.0s) Roket Lepas Landas**:
   - Kamera mengikuti roket ke atas secara vertikal.
   - Api pendorong berkobar dengan shock diamonds dan jejak asap bergulir ke bawah.
   - Menembus lapisan awan dan cincin kondensasi Mach (kecepatan suara).
   - Langit bertransisi dinamis dari oranye senja &rarr; biru tua &rarr; hitam pekat antariksa.
   - Bintang-bintang mulai muncul dan berkelip di angkasa.
3. **(8.0s – 12.0s) Mencapai Orbit**:
   - Mesin roket padam (MECO), semburan RCS menstabilkan posisi, sayap panel surya mekar.
   - Roket melayang anggun di gravitasi nol dengan latar lengkungan raksasa planet Bumi (samudera, benua berputar, awan, lampu kota malam) dan bulan sabit di kejauhan.
   - Kotak HUD retro memuat teks piksel "MISSION START" yang muncul dengan efek ketik (typewriter) dan kursor berkedip `█`.

---

## Cara Menjalankan

Masuk ke direktori:
```bash
cd roket-orbit
```

### 1. Live Preview di Browser
Jalankan server preview interaktif:
```bash
npm run preview
# atau: node render.mjs serve --port 5173
```
Buka `http://localhost:5173/` di browser. Kontrol:
- **Spasi**: Play / Pause
- **Slider**: Scrub waktu timeline (0.0s – 12.0s)
- **Tombol S1 / S2 / S3**: Loncat langsung antar adegan
- **Panah Kiri / Kanan**: Geser &plusmn;0.5 detik
- **Koma (,) / Titik (.)**: Geser 1 frame maju / mundur

### 2. Sintesis File Audio
Membuat file musik latar dan SFX ke `out/audio.wav`:
```bash
npm run audio
# atau: node render.mjs audio
```

### 3. Ekspor Tangkapan Still Frame
Mengekspor 8 frame still kunci beresolusi penuh (1080x1920) ke `out/stills/`:
```bash
npm run stills
# atau: node render.mjs stills
```

### 4. Uji Determinisme Animasi
Memastikan animasi `f(t)` menghasilkan piksel 100% identik di setiap detik pengujian:
```bash
npm run check
# atau: node render.mjs check
```

### 5. Render Video Akhir (MP4)
Merender 360 frame secara headless dan menggabungkannya bersama audio menjadi MP4:
```bash
npm run render
# atau: node render.mjs video --out out/roket-orbit.mp4
```
Hasil file akhir akan disimpan di `out/roket-orbit.mp4`.

---

## Struktur File
```
roket-orbit/
├── TREATMENT.md      # Dokumen treatment, palet, storyboard lengkap
├── README.md         # Petunjuk penggunaan & spesifikasi teknis
├── package.json      # Konfigurasi npm script
├── index.html        # Kanvas 1080x1920 & UI preview interaktif
├── render.mjs        # Script renderer Playwright + ffmpeg
├── src/
│   ├── palette.js    # Definisi 16 warna retro ruang angkasa
│   ├── font.js       # Mesin font piksel 5x7 murni kode
│   ├── sprites.js    # Gambar roket, landasan, api, asap, planet Bumi, bintang
│   ├── timeline.js   # Sumber waktu, konstanta, fungsi matematika PRNG
│   ├── film.js       # Inti renderer animasi deterministik drawFrame(t)
│   ├── audio.js      # Sintesis audio prosedural (BGM + SFX) & WAV encoder
│   └── main.js       # Browser preview player & hook window.__ve
└── out/
    ├── audio.wav     # Output audio sintetis 48 kHz stereo 16-bit
    ├── stills/       # Still frame per adegan untuk audit visual
    └── roket-orbit.mp4 # Video MP4 akhir 1080x1920 30 fps
```
