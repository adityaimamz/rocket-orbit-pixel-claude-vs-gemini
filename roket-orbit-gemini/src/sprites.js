// sprites.js — Visual pixel art murni kode: Roket, Landasan, Api, Asap, Planet Bumi, dan Bintang
import { PALETTE } from './palette.js';
import { hash, hash2D, clamp } from './timeline.js';

// Gambar roket pixel art (lebar ~20px, tinggi ~56px)
export function drawRocket(ctx, cx, cy, {
  tilt = 0,             // Sudut rotasi (radian)
  flamePower = 0,        // 0..1 intensitas api pendorong
  solarDeploy = 0,       // 0..1 perkembangan panel surya
  rcsBurst = 0,          // 0..1 semprotan pendorong RCS
  t = 0
} = {}) {
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  if (tilt !== 0) ctx.rotate(tilt);

  // Api pendorong (jika aktif)
  if (flamePower > 0.05) {
    const fSeed = Math.floor(t * 30);
    const flicker1 = (hash(fSeed) - 0.5) * 4;
    const flicker2 = (hash(fSeed + 99) - 0.5) * 3;
    const len = Math.round(flamePower * (36 + Math.sin(t * 40) * 8 + flicker1));

    // Lidah api terluar (Crimson / Rust)
    ctx.fillStyle = PALETTE.CRIMSON;
    ctx.beginPath();
    ctx.moveTo(-6, 26);
    ctx.lineTo(6, 26);
    ctx.lineTo(flicker1 * 0.5, 26 + len);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.RUST;
    ctx.beginPath();
    ctx.moveTo(-5, 26);
    ctx.lineTo(5, 26);
    ctx.lineTo(flicker2 * 0.5, 26 + len * 0.85);
    ctx.closePath();
    ctx.fill();

    // Lidah api tengah (Orange)
    ctx.fillStyle = PALETTE.ORANGE;
    ctx.beginPath();
    ctx.moveTo(-4, 26);
    ctx.lineTo(4, 26);
    ctx.lineTo(0, 26 + len * 0.65);
    ctx.closePath();
    ctx.fill();

    // Inti api panas (Yellow)
    ctx.fillStyle = PALETTE.YELLOW;
    ctx.beginPath();
    ctx.moveTo(-3, 26);
    ctx.lineTo(3, 26);
    ctx.lineTo(0, 26 + len * 0.4);
    ctx.closePath();
    ctx.fill();

    // Shock diamond (White)
    ctx.fillStyle = PALETTE.WHITE;
    ctx.fillRect(-1, 27, 3, Math.max(3, Math.round(len * 0.18)));
    if (len > 25) {
      ctx.fillRect(-1, 26 + Math.round(len * 0.35), 3, 4);
    }

    // Percikan api / bara yang melayang ke bawah
    for (let i = 0; i < 6; i++) {
      const spSeed = fSeed * 7 + i;
      const spY = 28 + Math.round(hash(spSeed) * (len + 15));
      const spX = Math.round((hash(spSeed + 13) - 0.5) * (len * 0.35));
      ctx.fillStyle = (i % 2 === 0) ? PALETTE.YELLOW : PALETTE.CYAN;
      ctx.fillRect(spX, spY, 2, 2);
    }
  }

  // Panel Surya Orbit (Sayap samping yang membuka di luar angkasa)
  if (solarDeploy > 0.01) {
    const w = Math.round(solarDeploy * 16);
    // Sayap Kiri
    ctx.fillStyle = PALETTE.STEEL;
    ctx.fillRect(-9 - w, -4, w, 2);
    ctx.fillStyle = PALETTE.TEAL;
    ctx.fillRect(-8 - w, -8, w - 1, 10);
    // Kisi sel fotovoltaik (Cyan lines)
    ctx.fillStyle = PALETTE.CYAN;
    for (let sx = -7 - w; sx < -9; sx += 4) {
      ctx.fillRect(sx, -7, 2, 8);
    }

    // Sayap Kanan
    ctx.fillStyle = PALETTE.STEEL;
    ctx.fillRect(9, -4, w, 2);
    ctx.fillStyle = PALETTE.TEAL;
    ctx.fillRect(9, -8, w - 1, 10);
    ctx.fillStyle = PALETTE.CYAN;
    for (let sx = 10; sx < 9 + w - 2; sx += 4) {
      ctx.fillRect(sx, -7, 2, 8);
    }
  }

  // Semburan RCS (manuver gas dingin di orbit)
  if (rcsBurst > 0.1) {
    ctx.fillStyle = PALETTE.CYAN;
    ctx.fillRect(-12, -14, 4, 2);
    ctx.fillRect(8, -14, 4, 2);
    ctx.fillStyle = PALETTE.WHITE;
    ctx.fillRect(-10, -14, 2, 2);
    ctx.fillRect(8, -14, 2, 2);
  }

  // --- BADAN ROKET (PIXEL CRAFT) ---
  // Garis luar (Outline VOID)
  ctx.fillStyle = PALETTE.VOID;
  // Kubah ujung atas
  ctx.fillRect(-2, -28, 4, 2);
  ctx.fillRect(-4, -26, 8, 3);
  ctx.fillRect(-6, -23, 12, 5);
  // Silinder badan
  ctx.fillRect(-8, -18, 16, 42);
  // Sirip kiri & kanan
  ctx.fillRect(-13, 12, 5, 12);
  ctx.fillRect(8, 12, 5, 12);

  // Dasar badan roket (Putih hangat)
  ctx.fillStyle = PALETTE.WHITE;
  ctx.fillRect(-1, -27, 2, 2);
  ctx.fillRect(-3, -25, 6, 3);
  ctx.fillRect(-5, -22, 10, 4);
  ctx.fillRect(-7, -18, 13, 40);

  // Shading samping kanan (CAPSULE / Abu-abu terang)
  ctx.fillStyle = PALETTE.CAPSULE;
  ctx.fillRect(3, -22, 2, 4);
  ctx.fillRect(4, -18, 2, 40);

  // Shading bayangan samping paling kanan (STEEL / Abu-abu gelap)
  ctx.fillStyle = PALETTE.STEEL;
  ctx.fillRect(6, -18, 1, 40);

  // Jalur garis balap merah / Aksen kapsul (CRIMSON & RUST)
  ctx.fillStyle = PALETTE.CRIMSON;
  ctx.fillRect(-7, -4, 14, 3);
  ctx.fillRect(-7, 14, 14, 2);
  ctx.fillStyle = PALETTE.RUST;
  ctx.fillRect(-6, -3, 6, 2);

  // Kaca Jendela / Kokpit bundar
  ctx.fillStyle = PALETTE.VOID;
  ctx.fillRect(-4, -14, 8, 8);
  ctx.fillStyle = PALETTE.TEAL;
  ctx.fillRect(-3, -13, 6, 6);
  // Pantulan kilau kaca
  ctx.fillStyle = PALETTE.CYAN;
  ctx.fillRect(-2, -12, 2, 2);
  ctx.fillStyle = PALETTE.WHITE;
  ctx.fillRect(-2, -12, 1, 1);

  // Sirip roket (Delta fins)
  // Sirip kiri
  ctx.fillStyle = PALETTE.CRIMSON;
  ctx.fillRect(-12, 14, 4, 9);
  ctx.fillRect(-10, 11, 2, 4);
  ctx.fillStyle = PALETTE.RUST;
  ctx.fillRect(-11, 15, 2, 7);

  // Sirip kanan
  ctx.fillStyle = PALETTE.CRIMSON;
  ctx.fillRect(8, 14, 4, 9);
  ctx.fillRect(8, 11, 2, 4);
  ctx.fillStyle = PALETTE.NAVY;
  ctx.fillRect(10, 15, 2, 7);

  // Corong Nozel Roket (Engine bell)
  ctx.fillStyle = PALETTE.STEEL;
  ctx.fillRect(-5, 22, 10, 4);
  ctx.fillStyle = PALETTE.SILO;
  ctx.fillRect(-4, 24, 8, 3);
  ctx.fillStyle = PALETTE.VOID;
  ctx.fillRect(-3, 26, 6, 1);

  ctx.restore();
}

// Gambar Menara & Landasan Peluncuran (Scene 1 & awal Scene 2)
export function drawLaunchPad(ctx, padY, {
  armOpen = 0,         // 0..1 posisi lengan derek terbuka
  t = 0
} = {}) {
  const towerX = 72;
  const towerW = 26;
  const towerH = 150;
  const towerTop = padY - towerH;

  // Parit buang api bawah (Flame trench)
  ctx.fillStyle = PALETTE.GROUND;
  ctx.fillRect(0, padY + 16, 270, 480 - (padY + 16));
  ctx.fillStyle = PALETTE.SILO;
  ctx.fillRect(80, padY + 16, 110, 24);
  ctx.fillStyle = PALETTE.VOID;
  ctx.fillRect(115, padY + 16, 40, 20); // Lubang deflektor api tepat di bawah roket

  // Platform meja peluncur (Launch table)
  ctx.fillStyle = PALETTE.STEEL;
  ctx.fillRect(96, padY + 6, 78, 10);
  ctx.fillStyle = PALETTE.CAPSULE;
  ctx.fillRect(96, padY + 6, 78, 2); // Highlight bibir meja
  // Klem penahan kaki roket
  ctx.fillStyle = PALETTE.SILO;
  ctx.fillRect(118, padY, 7, 7);
  ctx.fillRect(145, padY, 7, 7);

  // Menara Derek / Service Gantry Tower (Kiri)
  // Tiang utama
  ctx.fillStyle = PALETTE.SILO;
  ctx.fillRect(towerX, towerTop, towerW, towerH + 6);
  ctx.fillStyle = PALETTE.STEEL;
  ctx.fillRect(towerX + 2, towerTop + 2, towerW - 4, towerH + 4);

  // Rangka X-truss kisi baja menara
  ctx.fillStyle = PALETTE.SLATE;
  for (let y = towerTop + 8; y < padY; y += 14) {
    ctx.fillRect(towerX + 2, y, towerW - 4, 2);
    // Batang silang
    ctx.fillRect(towerX + 4, y + 2, 2, 10);
    ctx.fillRect(towerX + towerW - 6, y + 2, 2, 10);
  }

  // Pipa elevator tengah
  ctx.fillStyle = PALETTE.CAPSULE;
  ctx.fillRect(towerX + 11, towerTop + 4, 4, towerH);

  // Lampu peringatan merah/kuning di pucuk menara (Blink)
  const blink = Math.floor(t * 4) % 2 === 0;
  ctx.fillStyle = blink ? PALETTE.YELLOW : PALETTE.CRIMSON;
  ctx.fillRect(towerX + 12, towerTop - 6, 3, 6);
  // Pendar lampu
  if (blink) {
    ctx.fillStyle = PALETTE.ORANGE;
    ctx.fillRect(towerX + 10, towerTop - 4, 7, 2);
  }

  // Lengan Layanan Umbilikal (Swing arm penyuplai bahan bakar)
  // Berputar membuka saat countdown mendekati 0
  const armPivotX = towerX + towerW;
  const armPivotY = padY - 78;
  const angle = armOpen * -0.65; // Ayun ke atas/mundur

  ctx.save();
  ctx.translate(armPivotX, armPivotY);
  ctx.rotate(angle);
  ctx.fillStyle = PALETTE.STEEL;
  ctx.fillRect(0, -3, 34, 6);
  ctx.fillStyle = PALETTE.CAPSULE;
  ctx.fillRect(0, -3, 34, 2);
  ctx.fillStyle = PALETTE.CRIMSON;
  ctx.fillRect(28, -2, 6, 4); // Sambungan ke roket
  ctx.restore();

  // Lampu sorot landasan (Floodlights)
  ctx.fillStyle = PALETTE.STEEL;
  ctx.fillRect(40, padY + 10, 8, 6);
  ctx.fillRect(222, padY + 10, 8, 6);
  ctx.fillStyle = PALETTE.YELLOW;
  ctx.fillRect(44, padY + 8, 4, 3);
  ctx.fillRect(222, padY + 8, 4, 3);
}

// Partikel Asap Piksel Tebal & Bergumpal (Volumetric pixel smoke)
export function drawSmokePuff(ctx, cx, cy, radius, type = 'white') {
  if (radius <= 0) return;
  const r = Math.round(radius);
  const x = Math.round(cx);
  const y = Math.round(cy);

  // Gambar lingkaran piksel berlapis
  // Lapisan terluar (Bayangan / outline)
  ctx.fillStyle = type === 'dark' ? PALETTE.VOID : PALETTE.SLATE;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  if (r > 3) {
    // Lapisan tengah
    ctx.fillStyle = type === 'dark' ? PALETTE.NAVY : PALETTE.CAPSULE;
    ctx.beginPath();
    ctx.arc(x - 1, y - 1, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }

  if (r > 6) {
    // Lapisan inti terang
    ctx.fillStyle = type === 'dark' ? PALETTE.SLATE : PALETTE.WHITE;
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Bintang Berkelip Ruang Angkasa (Deterministik)
export function drawStars(ctx, t, count = 70, alpha = 1.0) {
  if (alpha <= 0.01) return;

  for (let i = 0; i < count; i++) {
    const sx = Math.floor(hash(i * 17 + 3) * 270);
    const sy = Math.floor(hash(i * 31 + 7) * 480);
    const phase = hash(i * 43) * Math.PI * 2;
    const speed = 1.5 + hash(i * 59) * 3.5;
    const shine = Math.sin(t * speed + phase);

    // Kecerahan bintang
    if (shine > 0.6) {
      // Bintang berlian terang (4 piksel salib)
      ctx.fillStyle = PALETTE.WHITE;
      ctx.fillRect(sx, sy, 1, 1);
      ctx.fillRect(sx - 1, sy, 3, 1);
      ctx.fillRect(sx, sy - 1, 1, 3);
      if (shine > 0.9) {
        ctx.fillStyle = PALETTE.CYAN;
        ctx.fillRect(sx, sy, 1, 1);
      }
    } else if (shine > 0.0) {
      ctx.fillStyle = (i % 5 === 0) ? PALETTE.YELLOW : PALETTE.WHITE;
      ctx.fillRect(sx, sy, 1, 1);
    } else if (shine > -0.6) {
      ctx.fillStyle = PALETTE.CAPSULE;
      ctx.fillRect(sx, sy, 1, 1);
    } else {
      ctx.fillStyle = PALETTE.SLATE;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }
}

// Planet Bumi Besar Melengkung di Latar Belakang (Scene 3: Orbit)
export function drawEarthGlobe(ctx, t) {
  const planetCenterY = 560; // Pusat lingkaran di bawah layar
  const planetCenterX = 135;
  const radius = 230;

  // Pendar atmosfer atas (Glow ring cyan)
  ctx.strokeStyle = PALETTE.CYAN;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(planetCenterX, planetCenterY, radius + 2, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Lapisan atmosfer tipis terluar
  ctx.strokeStyle = PALETTE.TEAL;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(planetCenterX, planetCenterY, radius + 4, Math.PI * 1.18, Math.PI * 1.82);
  ctx.stroke();

  // Badan planet Bumi
  ctx.save();
  ctx.beginPath();
  ctx.arc(planetCenterX, planetCenterY, radius, 0, Math.PI * 2);
  ctx.clip();

  // Samudera biru dalam
  ctx.fillStyle = PALETTE.NAVY;
  ctx.fillRect(0, 300, 270, 180);
  ctx.fillStyle = PALETTE.TEAL;
  ctx.fillRect(0, 340, 270, 140);

  // Daratan benua (Bentuk pixel organik yang perlahan bergeser ke kanan karena rotasi)
  const rotOffset = (t * 2.5) % 120;
  ctx.fillStyle = PALETTE.SLATE;
  // Benua 1
  ctx.beginPath();
  ctx.ellipse(60 + rotOffset, 380, 50, 25, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Benua 2
  ctx.beginPath();
  ctx.ellipse(190 + rotOffset, 400, 65, 30, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Titik lampu kota di bagian malam (Kuning berpendar)
  for (let k = 0; k < 25; k++) {
    const lx = Math.floor(hash(k * 13 + 5) * 80) + 15 + Math.round(rotOffset * 0.7);
    const ly = Math.floor(hash(k * 29 + 11) * 35) + 365;
    if (lx > 10 && lx < 120) {
      ctx.fillStyle = (k % 2 === 0) ? PALETTE.YELLOW : PALETTE.ORANGE;
      ctx.fillRect(lx, ly, 1, 1);
    }
  }

  // Pusaran awan putih orbital
  ctx.fillStyle = PALETTE.WHITE;
  for (let c = 0; c < 6; c++) {
    const cloudX = (c * 50 + t * 4) % 320 - 30;
    const cloudY = 350 + (c % 3) * 22;
    ctx.fillRect(cloudX, cloudY, 35, 5);
    ctx.fillRect(cloudX + 6, cloudY - 3, 22, 10);
    ctx.fillRect(cloudX + 12, cloudY - 5, 14, 13);
  }

  // Shading malam di sisi kiri planet (Dither piksel VOID murni)
  ctx.fillStyle = PALETTE.VOID;
  for (let dy = 320; dy < 480; dy += 2) {
    for (let dx = 0; dx < 140; dx += 2) {
      if ((dx + dy) % 4 === 0 && dx < (140 - (dy - 320) * 0.4)) {
        ctx.fillRect(dx, dy, 2, 2);
      }
    }
  }

  ctx.restore();
}

// Bulan sabit kecil di kejauhan (Scene 3)
export function drawMoon(ctx, x, y) {
  ctx.fillStyle = PALETTE.WHITE;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();

  // Bayangan sabit (Potongan VOID)
  ctx.fillStyle = PALETTE.VOID;
  ctx.beginPath();
  ctx.arc(x - 4, y - 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Kawah kecil
  ctx.fillStyle = PALETTE.CAPSULE;
  ctx.fillRect(x + 2, y - 2, 2, 2);
  ctx.fillRect(x + 3, y + 2, 1, 1);
}
