// film.js — Inti renderer animasi deterministik: drawFrame(t)
// Resolusi internal: 270x480 piksel murni. f(t) tanpa akumulasi state.

import { PALETTE } from './palette.js';
import { W, H, DURATION, clamp, lerp, smoothstep, easeInQuad, easeOutQuad, easeInOutQuad, hash } from './timeline.js';
import { drawRocket, drawLaunchPad, drawSmokePuff, drawStars, drawEarthGlobe, drawMoon } from './sprites.js';
import { drawText, drawCenteredText, measureText } from './font.js';

// Gambar gradasi langit senja dengan dither piksel retro yang turun saat roket naik
function drawDuskSky(ctx, skyShift = 0) {
  // Seluruh layar dasar adalah VOID hitam antariksa
  ctx.fillStyle = PALETTE.VOID;
  ctx.fillRect(0, 0, W, H);

  // Posisi cakrawala senja bergerak turun saat roket naik
  // Pada t=0 (landasan), horizonY = 440 (dekat dasar layar).
  // Saat roket naik, horizonY bergeser ke bawah > 850 (semua warna senja keluar layar).
  const horizonY = Math.round(440 + skyShift);

  // Pita warna dihitung dari garis cakrawala ke atas
  const bands = [
    { c: PALETTE.YELLOW,  y1: horizonY + 80,  y0: horizonY - 20 },
    { c: PALETTE.ORANGE,  y1: horizonY - 20,  y0: horizonY - 55 },
    { c: PALETTE.RUST,    y1: horizonY - 55,  y0: horizonY - 100 },
    { c: PALETTE.CRIMSON, y1: horizonY - 100, y0: horizonY - 155 },
    { c: PALETTE.PURPLE,  y1: horizonY - 155, y0: horizonY - 220 },
    { c: PALETTE.SLATE,   y1: horizonY - 220, y0: horizonY - 300 },
    { c: PALETTE.NAVY,    y1: horizonY - 300, y0: horizonY - 390 },
    { c: PALETTE.NIGHT,   y1: horizonY - 390, y0: horizonY - 480 },
  ];

  for (let i = bands.length - 1; i >= 0; i--) {
    const b = bands[i];
    const top = Math.max(0, b.y0);
    const bottom = Math.min(H, b.y1);
    if (bottom <= 0 || top >= H || bottom <= top) continue;

    ctx.fillStyle = b.c;
    ctx.fillRect(0, top, W, bottom - top);

    // Dither 2x2 rapi di batas atas setiap pita
    if (b.y0 > 0 && b.y0 < H && i < bands.length - 1) {
      const prevColor = bands[i + 1].c;
      ctx.fillStyle = prevColor;
      for (let x = 0; x < W; x += 2) {
        if ((x + b.y0) % 4 === 0) {
          ctx.fillRect(x, b.y0 - 2, 2, 2);
          ctx.fillRect(x + 1, b.y0, 1, 1);
        }
      }
    }
  }
}

// Siluet bukit, pohon pinus & tiang antena di kejauhan daratan
function drawDistantLandscape(ctx, groundY) {
  if (groundY > H + 50) return;

  // Baris bukit jauh
  ctx.fillStyle = PALETTE.GROUND;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 40);
  for (let x = 0; x <= W; x += 15) {
    const by = groundY + Math.sin(x * 0.02) * 12 + Math.cos(x * 0.04) * 8;
    ctx.lineTo(x, by);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Tiang transmisi radio kecil di cakrawala kiri
  ctx.fillStyle = PALETTE.SILO;
  ctx.fillRect(28, groundY - 24, 2, 26);
  ctx.fillRect(24, groundY - 18, 10, 1);
  ctx.fillRect(26, groundY - 10, 6, 1);
  ctx.fillStyle = PALETTE.CRIMSON;
  ctx.fillRect(28, groundY - 26, 2, 2); // Lampu merah suar antena
}

// -------------------------------------------------------------
// FUNGSI UTAMA: drawFrame(t)
// -------------------------------------------------------------
export function drawFrame(ctx, t) {
  t = clamp(t, 0, DURATION);

  // Bersihkan layar
  ctx.fillStyle = PALETTE.VOID;
  ctx.fillRect(0, 0, W, H);

  // Getaran kamera (Screen shake)
  let shakeX = 0;
  let shakeY = 0;
  if (t >= 3.0 && t < 4.0) {
    // Getaran saat ignition mesin
    const intensity = (t - 3.0) * 1.5;
    const s = Math.floor(t * 60);
    shakeX = Math.round((hash(s * 11) - 0.5) * intensity * 2);
    shakeY = Math.round((hash(s * 19) - 0.5) * intensity * 2);
  } else if (t >= 4.0 && t < 6.0) {
    // Getaran kuat saat lepas landas menembus gravitasi awal
    const decay = 1 - (t - 4.0) / 2.0;
    const intensity = 2.5 * decay + 0.8;
    const s = Math.floor(t * 60);
    shakeX = Math.round((hash(s * 13) - 0.5) * intensity * 2.5);
    shakeY = Math.round((hash(s * 23) - 0.5) * intensity * 2.5);
  } else if (t >= 6.0 && t < 8.0) {
    // Getaran halus kecepatan tinggi atmosfer atas
    const intensity = 0.8 * (1 - (t - 6.0) / 2.0);
    const s = Math.floor(t * 60);
    shakeX = Math.round((hash(s * 17) - 0.5) * intensity);
    shakeY = Math.round((hash(s * 29) - 0.5) * intensity);
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // =========================================================
  // ADEGAN 1: (0.0s – 4.0s) Landasan Senja & Hitung Mundur
  // =========================================================
  if (t < 4.0) {
    const padY = 380;
    const rocketBaseY = padY - 26;

    // 1. Langit Senja
    drawDuskSky(ctx, 0, 0);

    // 2. Siluet Lanskap Kejauhan
    drawDistantLandscape(ctx, padY - 10);

    // 3. Menara & Landasan
    // Lengan ayun membuka mulai t=1.8s
    const armOpen = smoothstep(1.8, 3.0, t);
    drawLaunchPad(ctx, padY, { armOpen, t });

    // 4. Asap Kecil / Ventilasi Gas Dingin (LOX Venting)
    // Wisps asap putih keluar dari katup roket sebelum peluncuran
    if (t < 3.0) {
      for (let i = 0; i < 8; i++) {
        const pSeed = Math.floor((t * 12 + i * 2) % 40);
        const age = ((t * 2 + i * 0.3) % 1.5) / 1.5;
        const vx = 145 + age * 24 + (hash(pSeed) - 0.5) * 8;
        const vy = rocketBaseY - 14 - age * 8 + (hash(pSeed + 7) - 0.5) * 6;
        const r = 2 + age * 4.5;
        drawSmokePuff(ctx, vx, vy, r, 'white');
      }
    }

    // 5. Percikan Pre-Ignition (t = 2.4s – 3.0s)
    if (t >= 2.4 && t < 3.0) {
      const sparkSeed = Math.floor(t * 40);
      for (let s = 0; s < 10; s++) {
        const sx = 135 + (hash(sparkSeed + s) - 0.5) * 18;
        const sy = rocketBaseY + 2 + hash(sparkSeed + s * 3) * 14;
        ctx.fillStyle = (s % 2 === 0) ? PALETTE.YELLOW : PALETTE.WHITE;
        ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
      }
    }

    // 6. Gumpalan Asap Tebal Ignition (t = 3.0s – 4.0s)
    let flamePower = 0;
    if (t >= 3.0) {
      flamePower = smoothstep(3.0, 3.6, t) * 0.6; // Api awal di parit

      // Asap tebal bergulung ke kiri & kanan dari parit api
      const smokeAge = t - 3.0; // 0..1 detik
      const puffCount = 18;
      for (let p = 0; p < puffCount; p++) {
        const dir = (p % 2 === 0) ? -1 : 1;
        const speed = 25 + (p * 5) % 35;
        const sx = 135 + dir * (smokeAge * speed + (p % 4) * 6);
        const sy = padY + 12 - Math.sin((p % 5) * 0.6) * 16 - smokeAge * 10;
        const sr = 6 + smokeAge * 14 + (p % 3) * 3;
        drawSmokePuff(ctx, sx, sy, sr, p % 3 === 0 ? 'dark' : 'white');
      }
    }

    // 7. Roket Diam di Meja Peluncur
    drawRocket(ctx, 135, rocketBaseY, { flamePower, t });

    // 8. TEKS PIXEL HITUNG MUNDUR (3 - 2 - 1)
    // Teks besar tajam di bagian atas layar
    const textY = 95;
    if (t >= 0.0 && t < 1.0) {
      const scalePop = 5 + Math.round((1 - easeOutQuad(Math.min(1, t * 4))) * 2);
      drawCenteredText(ctx, '3', 135, textY, PALETTE.WHITE, scalePop, PALETTE.VOID);
    } else if (t >= 1.0 && t < 2.0) {
      const dt = t - 1.0;
      const scalePop = 5 + Math.round((1 - easeOutQuad(Math.min(1, dt * 4))) * 2);
      drawCenteredText(ctx, '2', 135, textY, PALETTE.YELLOW, scalePop, PALETTE.VOID);
    } else if (t >= 2.0 && t < 3.0) {
      const dt = t - 2.0;
      const scalePop = 5 + Math.round((1 - easeOutQuad(Math.min(1, dt * 4))) * 2);
      drawCenteredText(ctx, '1', 135, textY, PALETTE.ORANGE, scalePop, PALETTE.VOID);
    } else if (t >= 3.0 && t < 4.0) {
      // Kilatan "IGNITION"
      const blink = Math.floor((t - 3.0) * 8) % 2 === 0;
      if (blink) {
        drawCenteredText(ctx, 'IGNITION', 135, textY + 8, PALETTE.WHITE, 2, PALETTE.VOID);
      }
    }
  }

  // =========================================================
  // ADEGAN 2: (4.0s – 8.0s) Roket Lepas Landas & Menembus Atmosfer
  // =========================================================
  else if (t >= 4.0 && t < 8.0) {
    const tAscent = t - 4.0; // 0.0 .. 4.0 detik
    const progress = tAscent / 4.0; // 0.0 .. 1.0

    // Ketinggian roket bertambah secara eksponensial
    // Kamera mengikuti roket ke atas, sehingga daratan bergerak turun
    const altitude = Math.pow(tAscent, 2.2) * 120; // 0 .. ~2500 px
    const skyScroll = altitude * 0.45;
    const darkness = smoothstep(1.5, 3.8, tAscent); // 0 senja -> 1 angkasa gelap

    // 1. Langit Senja yang Berubah ke Biru Tua lalu Hitam
    drawDuskSky(ctx, skyScroll, darkness);

    // 2. Bintang Mulai Muncul saat Langit Menghitam (tAscent >= 2.0s / t >= 6.0s)
    const starAlpha = smoothstep(1.8, 3.2, tAscent);
    const starCount = Math.round(lerp(0, 60, starAlpha));
    drawStars(ctx, t, starCount, starAlpha);

    // 3. Lapisan Daratan & Menara Turun Keluar Layar
    const padY = 380 + altitude;
    if (padY < H + 120) {
      drawDistantLandscape(ctx, padY - 10);
      drawLaunchPad(ctx, padY, { armOpen: 1.0, t });
    }

    // 4. Lapisan Awan Melaju Cepat ke Bawah (tAscent 1.0s – 2.8s)
    if (tAscent >= 0.8 && tAscent <= 2.8) {
      for (let c = 0; c < 4; c++) {
        const cy = ((tAscent * 290 + c * 135) % 580) - 60;
        const cx = 30 + (c * 68) % 180;
        drawSmokePuff(ctx, cx, cy, 14, 'white');
        drawSmokePuff(ctx, cx + 16, cy - 4, 18, 'white');
        drawSmokePuff(ctx, cx + 32, cy, 13, 'white');
      }
    }

    // 5. Cincin Kondensasi Mach (Vapor Cone) di sekitar tAscent = 2.2s (t = 6.2s)
    if (tAscent >= 2.0 && tAscent <= 2.6) {
      const coneAge = (tAscent - 2.0) / 0.6;
      const coneW = Math.round(20 + coneAge * 45);
      ctx.strokeStyle = PALETTE.WHITE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(135, 275 + coneAge * 15, coneW, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6. Jejak Asap Roket Panjang yang Bergulir ke Bawah
    const trailLength = Math.min(20, Math.floor(tAscent * 10));
    for (let tr = 0; tr < trailLength; tr++) {
      const trAge = tr * 0.15;
      const ty = 280 + tr * 14 + (hash(tr * 7) - 0.5) * 6;
      if (ty < H + 30) {
        const tx = 135 + Math.sin(t * 8 + tr) * 4 + (hash(tr * 13) - 0.5) * (tr * 3);
        const trRadius = 4 + tr * 1.5;
        drawSmokePuff(ctx, tx, ty, trRadius, tr > 8 ? 'dark' : 'white');
      }
    }

    // 7. Lengkungan Atmosfer Bumi mulai terlihat di dasar saat mendekati orbit
    if (tAscent >= 2.8) {
      const earthRise = smoothstep(2.8, 4.0, tAscent);
      const curveY = lerp(H + 80, 420, earthRise);
      ctx.strokeStyle = PALETTE.CYAN;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(135, curveY + 280, 300, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
    }

    // 8. Posisi Roket (Kamera menjaga roket di tengah-bawah)
    const rocketScreenY = lerp(354, 255, smoothstep(0, 1.2, tAscent));
    const flamePower = 1.0;
    drawRocket(ctx, 135, rocketScreenY, { flamePower, t });

    // 9. Indikator Ketinggian di Pojok Layar (HUD Pixel Retro)
    const altKm = Math.round(lerp(1, 280, easeInQuad(progress)));
    drawText(ctx, `ALT: ${String(altKm).padStart(3, '0')} KM`, 12, 18, PALETTE.CYAN, 1, PALETTE.VOID);
    drawText(ctx, `VEL: MACH ${Math.min(18, Math.round(1 + progress * 17))}`, 12, 28, PALETTE.YELLOW, 1, PALETTE.VOID);
  }

  // =========================================================
  // ADEGAN 3: (8.0s – 12.0s) Roket Mencapai Orbit & Mission Start
  // =========================================================
  else {
    const tOrbit = t - 8.0; // 0.0 .. 4.0 detik

    // 1. Latar Belakang Luar Angkasa Murni (VOID pekat)
    ctx.fillStyle = PALETTE.VOID;
    ctx.fillRect(0, 0, W, H);

    // 2. Bintang-bintang Berkelip Kaya di Angkasa
    drawStars(ctx, t, 85, 1.0);

    // 3. Bulan Sabit di Kejauhan (Kanan Atas)
    drawMoon(ctx, 225, 60);

    // 4. Planet Bumi Besar Melengkung di Latar Belakang Bawah
    drawEarthGlobe(ctx, t);

    // 5. Roket di Orbit:
    // - Mesin utama padam (flamePower = 0)
    // - Kemiringan sedikit (~18 derajat) untuk injeksi orbit
    // - Melayang halus (sinus bobbing)
    // - Sayap panel surya mekar perlahan (tOrbit 0.3s .. 1.4s)
    const rocketTilt = lerp(0, 0.32, smoothstep(0, 1.2, tOrbit));
    const solarDeploy = smoothstep(0.4, 1.5, tOrbit);
    const floatBob = Math.sin(tOrbit * 2.5) * 2;
    const rcsBurst = (tOrbit > 0.1 && tOrbit < 0.6) ? 1.0 : 0.0;
    const rocketX = 135;
    const rocketY = 220 + floatBob;

    drawRocket(ctx, rocketX, rocketY, {
      tilt: rocketTilt,
      flamePower: 0,
      solarDeploy,
      rcsBurst,
      t
    });

    // 6. KOTAK HUD DIALOG & TEKS PIXEL "MISSION START"
    // Muncul di atas layar dengan efek ketik (Typewriter)
    const boxX = 35;
    const boxY = 90;
    const boxW = 200;
    const boxH = 46;

    if (tOrbit >= 0.8) {
      // Bingkai Kotak Retro HUD
      ctx.fillStyle = PALETTE.NIGHT;
      ctx.fillRect(boxX, boxY, boxW, boxH);

      // Garis tepi piksel CYAN
      ctx.strokeStyle = PALETTE.CYAN;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Sudut hiasan bracket HUD
      ctx.fillStyle = PALETTE.WHITE;
      ctx.fillRect(boxX - 2, boxY - 2, 4, 4);
      ctx.fillRect(boxX + boxW - 2, boxY - 2, 4, 4);
      ctx.fillRect(boxX - 2, boxY + boxH - 2, 4, 4);
      ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 4, 4);

      // Label Header Kecil HUD
      ctx.fillStyle = PALETTE.NAVY;
      ctx.fillRect(boxX + 8, boxY - 5, 52, 9);
      drawText(ctx, 'SYS:OK', boxX + 11, boxY - 4, PALETTE.CYAN, 1);

      // Efek Ketik "MISSION START"
      // String total: 13 karakter
      const fullText = 'MISSION START';
      const typeStartTime = 1.0;
      const typeDuration = 1.4; // Selesai di tOrbit = 2.4s (t = 10.4s)

      let charCount = 0;
      if (tOrbit >= typeStartTime) {
        const typeProgress = clamp((tOrbit - typeStartTime) / typeDuration, 0, 1);
        charCount = Math.floor(typeProgress * fullText.length);
      }

      let displayedText = fullText.slice(0, charCount);

      // Kursor berkedip █
      const cursorBlink = Math.floor(t * 5) % 2 === 0;
      if (cursorBlink && tOrbit < 3.8) {
        displayedText += '█';
      }

      // Gambar teks typewriter di tengah kotak
      drawCenteredText(ctx, displayedText, 135, boxY + 12, PALETTE.WHITE, 2, PALETTE.VOID);

      // Sub-status setelah teks selesai diketik (tOrbit >= 2.4s)
      if (tOrbit >= 2.4) {
        const subAlpha = smoothstep(2.4, 2.8, tOrbit);
        if (subAlpha > 0.1) {
          drawCenteredText(ctx, 'ORBIT ACHIEVED // 28,000 KM/H', 135, boxY + 30, PALETTE.YELLOW, 1, PALETTE.VOID);
        }
      }
    }

    // 7. Signature Credit Beyond Studio di bagian bawah (Piksel Halus)
    if (tOrbit >= 2.2) {
      drawCenteredText(ctx, 'BEYOND STUDIO', 135, 452, PALETTE.SLATE, 1);
    }
  }

  ctx.restore();
}
