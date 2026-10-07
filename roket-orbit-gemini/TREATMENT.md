# Treatment — Peluncuran Roket Kecil ke Orbit (roket-orbit)

## 1. Ide dalam Satu Paragraf
Animasi vertikal pixel art retro 12 detik yang menggambarkan perjalanan epik sebuah roket antariksa mungil: bersiap di landasan senja saat hitung mundur 3-2-1, menyemburkan api dan asap tebal saat lepas landas menembus gradasi langit senja hingga tiba di kehampaan luar angkasa berhias bintang dan planet Bumi melengkung yang megah, diakhiri dengan transmisi komputer piksel retro "MISSION START".

## 2. Tone & Gaya Isi Konten
- **Visual**: Pixel art murni Canvas 2D resolusi internal 270x480 yang diskalakan tajam ke 1080x1920 (nearest-neighbor 4x, tanpa blur / anti-alias).
- **Nuansa**: Nostalgia game luar angkasa retro 16-bit era 90-an (DawnBringer / Solar Jetman / PICO-8).
- **Pergerakan**: Deterministik per frame sebagai fungsi waktu `f(t)`. Tanpa penumpukan state, getaran kamera terkontrol, partikel asap bergumpal tebal, dan dinamika api pendorong berkecepatan tinggi.

## 3. Palet & Tipografi Isi Konten
Palet warna dibatasi tepat 16 warna konsisten di seluruh adegan:
1. `#05050d` (VOID) — Hitam pekat antariksa & garis batas
2. `#121528` (NIGHT) — Biru gelap langit malam & bayangan orbit
3. `#1f2c4c` (NAVY) — Biru tua senja & shading roket
4. `#364f6b` (SLATE) — Biru baja atmosfer & struktur menara
5. `#5b3b56` (PURPLE) — Ungu senja transisi cakrawala
6. `#94384a` (CRIMSON) — Merah tua pendar senja & sirip roket
7. `#d45c43` (RUST) — Oranye karat lidah api luar & cakrawala
8. `#f39c38` (ORANGE) — Oranye terang semburat pendorong
9. `#f7d057` (YELLOW) — Kuning panas inti api & lampu peringatan
10. `#fcfbe3` (WHITE) — Putih hangat badan roket, bintang & asap terang
11. `#9babb2` (CAPSULE) — Abu-abu logam terang & asap tengah
12. `#52606d` (STEEL) — Abu-abu baja gelap menara peluncur
13. `#2c3540` (SILO) — Abu-abu parit deflektor & siluet tanah
14. `#1b2024` (GROUND) — Aspal landasan & siluet perbukitan
15. `#267b84` (TEAL) — Samudera bumi & kaca kokpit
16. `#4cd3b2` (CYAN) — Pendar atmosfer bumi, HUD & semburan RCS

**Tipografi**:
- Font bitmap 5x7 murni kode Javascript (`src/font.js`) tanpa ketergantungan file font eksternal.

## 4. Motif & Benang Merah Visual
- **Vertikalitas**: Perjalanan dari bawah (tanah/landasan) ke atas (orbit).
- **Transisi Suasana**: Dari kehangatan senja di bumi menuju kedalaman gelap dan tenangnya ruang angkasa.
- **Kerapian Piksel**: Semua sprite (roket, menara, planet, asap) digambar dengan proporsi piksel utuh tanpa sub-pixel interpolation.

## 5. Storyboard

### Scene 1: Landasan Senja & Hitung Mundur (0.0s – 4.0s)
- **ID & Jendela Waktu**: `S1_PAD` [0.0s – 4.0s]
- **Teks di Layar**: Hitung mundur angka piksel "3", "2", "1" dengan efek pop skala di detik 0, 1, 2; teks "IGNITION" berkedip di 3.0s–4.0s.
- **Komposisi 9:16**:
  - Atas: Langit gradasi senja (oranye ke ungu-biru), teks hitung mundur besar di y: 95.
  - Tengah-Bawah: Roket putih bergaris merah di x: 135, y: 354, menara derek kisi baja di sisi kiri (x: 72–98).
  - Bawah: Meja peluncuran beton, parit buang api, siluet perbukitan dan antena radio.
- **Gerak / Animasi**:
  - t = 0.0–2.0s: Penebalan uap putih (LOX venting) melayang dari katup roket.
  - t = 1.8–3.0s: Lengan derek berputar membuka menjauhi roket.
  - t = 2.4–3.0s: Hujan percikan api pre-ignition di bawah corong roket.
  - t = 3.0–4.0s: Pengapian utama (Ignition)! Lidah api menyala, asap tebal bergulung ke kiri & kanan dari parit api, layar mulai bergetar.
- **SFX**: Beep 440 Hz (detik 0, 1, 2), double beep 880 Hz (detik 3), desis gas dan awal gemuruh mesin roket.

### Scene 2: Lepas Landas & Menembus Atmosfer (4.0s – 8.0s)
- **ID & Jendela Waktu**: `S2_ASCENT` [4.0s – 8.0s]
- **Teks di Layar**: HUD piksel telemetri di pojok atas: `ALT: xxx KM` dan `VEL: MACH xx`.
- **Komposisi 9:16**:
  - Kamera melacak roket ke atas, menjaga posisi roket di tengah-bawah layar.
  - Ekor api pendorong besar berpanjang 40–60 px dengan shock diamonds putih-kuning.
  - Jejak asap silindris bergulung ke bawah.
- **Gerak / Animasi**:
  - t = 4.0–5.2s: Landasan dan daratan meluncur cepat ke bawah keluar layar.
  - t = 5.2–6.5s: Menembus lapisan awan senja keunguan. Langit bertransisi dari oranye ke biru tua lalu hitam pekat.
  - t = 6.2s: Cincin kondensasi Mach (vapor cone) membesar saat menembus kecepatan suara.
  - t = 6.8–8.0s: Bintang-bintang mulai muncul dan berkelip di latar langit hitam. Lengkungan cakrawala atmosfer mulai tampak di bawah.
- **SFX**: Gemuruh bass menggelegar (sub 52 Hz + filtered noise) memuncak saat lepas landas, melodi synth chiptune penuh energi dengan drum kick-snare.

### Scene 3: Mencapai Orbit & Mission Start (8.0s – 12.0s)
- **ID & Jendela Waktu**: `S3_ORBIT` [8.0s – 12.0s]
- **Teks di Layar**: Kotak dialog HUD retro memuat teks typewriter "MISSION START" (t = 9.0s–10.4s) dengan kursor berkedip `█`, diikuti teks status `ORBIT ACHIEVED // 28,000 KM/H`. Signature credit "BEYOND STUDIO" di bagian bawah.
- **Komposisi 9:16**:
  - Atas: Langit antariksa hitam pekat penuh taburan bintang berlian berkelip dan bulan sabit di kejauhan. Kotak HUD "MISSION START" di y: 90.
  - Tengah: Roket melayang anggun dalam gravitasi nol, miring ~18 derajat dengan sayap panel surya sian yang mekar.
  - Bawah: Lengkungan raksasa planet Bumi berlatar samudera toska, daratan benua berputar perlahan, pusaran awan, dan kilau lampu kota malam.
- **Gerak / Animasi**:
  - t = 8.0s: Mesin roket padam (MECO), semburan gas dingin RCS cyan menyala singkat menstabilkan posisi roket.
  - t = 8.4–9.2s: Sayap panel surya mekar ke samping kiri dan kanan.
  - t = 9.0–10.4s: Efek ketik huruf per huruf "MISSION START" dalam kotak HUD.
- **SFX**: Gemuruh padam seketika, suasana antariksa hening dengan arpeggio lonceng kristal angkasa, bleep teletype pada tiap karakter ketikan, dan melodi penutup chiptune yang tenang dan agung.

## 6. Audio
- **Mode**: Sintesis audio prosedural murni Javascript / Node.js (`src/audio.js`), diekspor langsung ke 48 kHz stereo WAV 16-bit tanpa file audio eksternal.
- **BGM**: Chiptune 120 BPM (24 ketukan dalam 12 detik), progresi akor C - G - Am - F ke C - Em - F - C.
- **SFX Terpadu**:
  - Countdown beeps (440 Hz / 880 Hz)
  - Engine ignition & heavy thruster rumble
  - High-speed atmospheric whoosh & Mach pop
  - Teletype terminal typing bleeps
  - Crystal space chimes & sub drone

## 7. Engine & Alasan
- **HTML Canvas 2D murni**: Tidak memakai framework berat (Three.js/Pixi/dll.) demi kejernihan piksel murni, determinisme mutlak, waktu pemuatan nol, dan rendering offline frame-by-frame yang cepat.
- **Rendering**: Playwright Headless Chromium membaca kanvas per frame dan mengalirkan data mentah RGBA langsung ke `ffmpeg`.

## 8. Closing
- Teks penutup orbital "MISSION START" dengan konfirmasi "ORBIT ACHIEVED // 28,000 KM/H", didampingi kredit piksel "BEYOND STUDIO" di area bawah kanvas.
