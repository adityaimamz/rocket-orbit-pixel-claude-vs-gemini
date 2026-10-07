// Semua elemen visual. Framebuffer = Uint8Array indeks palet (W*H).
// Koordinat "dunia" = posisi layar saat kamera di landasan (cam = 0);
// layar = dunia + cam (kamera naik -> dunia turun).

import { W, H, FPS, T, TEXT, lift } from './timeline.js';
import { P } from './palette.js';
import { glyph, GLYPH_H, ADVANCE, textWidth } from './font.js';
import {
  hash, clamp, lerp, smoothstep, easeInOut, easeOut, progress, integrate, bayer, vnoise,
} from './util.js';

export const GROUND = 410;   // y layar ketinggian 0 saat cam = 0
const PAD_TOP = 404;         // permukaan landasan
const ROCKET_X = 135;        // sumbu roket di landasan
const ROCKET_REST_Y = PAD_TOP - 25; // pusat sprite saat berdiri (sprite 20x50)
const LOCK_RISE = 119;       // roket naik 119 px di layar sebelum kamera mengunci
const SAFE_CX = 124;         // pusat horizontal area aman (kanan 150 px/1080 dipotong)

// ---------------------------------------------------------------- gerak
const camRaw = (t) => {
  const u = t - T.liftoff;
  if (u <= 0) return 0;
  return Math.max(0, lift(t) - LOCK_RISE * easeInOut(clamp(u / T.lock)));
};
// Kamera berhenti naik di orbit; dunia di bawahnya sudah habis.
export const cam = (t) => Math.round(camRaw(Math.min(t, T.orbit)));

const camVel = (t) => (camRaw(t + 1 / 480) - camRaw(t - 1 / 480)) * 240;
// Bintang bergeser 12 % kecepatan kamera, melambat saat roket rebah.
const starSpeed = (t) =>
  t < T.liftoff ? 0 : 0.12 * camVel(Math.min(t, T.orbit)) * (1 - smoothstep(T.pitch[0], T.orbit, t));
export const starOffset = (t) => integrate(starSpeed, T.liftoff, Math.min(t, T.orbit));
export { starSpeed };

export function rocketPose(t) {
  const u = t - T.liftoff;
  const riseY = ROCKET_REST_Y - LOCK_RISE * easeInOut(clamp(u / T.lock));
  const y = u <= 0 ? ROCKET_REST_Y : riseY - 8 * smoothstep(T.orbit, 10, t);
  const x = ROCKET_X + integrate((s) => 10 * smoothstep(T.coast[0], T.coast[1], s), T.coast[0], t);
  const ang = (Math.PI / 2) * easeInOut(progress(t, T.pitch[0], T.pitch[1]));
  return { x, y, ang };
}

export function flameLength(t, f) {
  if (t < T.ignition || t >= T.meco + 0.12) return 0;
  const jitter = (hash(f, 7) - 0.5) * 4;
  if (t < T.liftoff) return 5 + 9 * progress(t, T.ignition, T.liftoff) + jitter * 0.5;
  if (t < T.meco) return 26 + jitter;
  return (26 + jitter) * (1 - progress(t, T.meco, T.meco + 0.12));
}

export function shake(t, f) {
  if (t < T.shake[0] || t >= T.shake[1]) return { x: 0, y: 0 };
  const amp = t < T.liftoff + 0.6 ? 1 : 0.6;
  return {
    x: Math.round((hash(f, 3) - 0.5) * 2.6 * amp),
    y: Math.round((hash(f, 4) - 0.5) * 2.6 * amp),
  };
}

// ---------------------------------------------------------------- raster
export function px(fb, x, y, c) {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  fb[y * W + x] = c;
}

export function rect(fb, x, y, w, h, c) {
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.floor(x + w)), y1 = Math.min(H, Math.floor(y + h));
  for (let yy = y0; yy < y1; yy++) fb.fill(c, yy * W + x0, yy * W + Math.max(x0, x1));
}

export function disc(fb, cx, cy, r, c) {
  const r2 = r * r;
  const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
  const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
  for (let y = y0; y <= y1; y++) {
    if (y < 0 || y >= H) continue;
    const dy = y + 0.5 - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      if (dx * dx + dy * dy <= r2) px(fb, x, y, c);
    }
  }
}

function line(fb, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) px(fb, Math.round(lerp(x0, x1, i / n)), Math.round(lerp(y0, y1, i / n)), c);
}

// ---------------------------------------------------------------- langit
// Ketinggian -> warna. Tiap pita padat, lalu pindah ke pita berikut lewat dither Bayer.
const SKY = [
  [0, P.ORANGE], [120, P.PINK], [200, P.PURPLE], [310, P.NAVY], [700, P.NIGHT], [1450, P.BLACK],
];

function skyIndex(a, x, ay) {
  if (a <= SKY[0][0]) return SKY[0][1];
  for (let i = 0; i < SKY.length - 1; i++) {
    const [a0, c0] = SKY[i], [a1, c1] = SKY[i + 1];
    if (a < a1) {
      const g = clamp(((a - a0) / (a1 - a0) - 0.55) / 0.45);
      return g > bayer(x, ay) ? c1 : c0;
    }
  }
  return P.BLACK;
}

export function drawSky(fb, c) {
  for (let y = 0; y < H; y++) {
    const ay = GROUND - y + c; // pola dither ikut dunia, tidak berkilau saat kamera naik
    const row = y * W;
    for (let x = 0; x < W; x++) fb[row + x] = skyIndex(ay, x, ay);
  }
}

// ---------------------------------------------------------------- bintang
const STARS = Array.from({ length: 150 }, (_, i) => {
  const r = hash(i, 11);
  return {
    x: Math.floor(hash(i, 12) * W),
    y: hash(i, 13) * H,
    color: r < 0.55 ? P.WHITE : r < 0.8 ? P.GREY : P.ICE,
    big: hash(i, 14) > 0.93,
    reveal: 600 + hash(i, 15) * 900,       // ketinggian tempat bintang mulai terlihat
    period: 8 + Math.floor(hash(i, 16) * 16), // frame per fase kelip
    phase: Math.floor(hash(i, 17) * 24),
  };
});

export function drawStars(fb, t, f, c) {
  const off = starOffset(t);
  const streak = clamp(Math.round(starSpeed(t) / 90), 1, 5);
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    const sy = Math.floor((((s.y + off) % H) + H) % H);
    if (GROUND - sy + c < s.reveal) continue;
    if (fb[sy * W + s.x] !== P.BLACK && fb[sy * W + s.x] !== P.NIGHT) continue;
    // kelip dikunci ke frame
    const k = Math.floor((f + s.phase) / s.period);
    const on = hash(i * 31 + k, 9) > 0.3;
    const col = on ? s.color : s.color === P.WHITE ? P.GREY : P.STEEL;
    for (let j = 0; j < streak; j++) px(fb, s.x, sy - j, j === 0 ? col : P.STEEL);
    if (s.big && on && streak === 1) {
      px(fb, s.x - 1, sy, P.GREY); px(fb, s.x + 1, sy, P.GREY);
      px(fb, s.x, sy - 1, P.GREY); px(fb, s.x, sy + 1, P.GREY);
    }
  }
}

// ---------------------------------------------------------------- landasan (dunia)
export function drawSun(fb, c, sh) {
  const cx = 58 + sh.x, cy = GROUND - 3 + c + sh.y;
  disc(fb, cx, cy, 22, P.YELLOW);
  // garis potong ala poster retro, makin rapat ke bawah
  for (const [dy, h] of [[-9, 1], [-5, 2], [-1, 2]]) {
    for (let x = cx - 23; x <= cx + 23; x++) for (let k = 0; k < h; k++) {
      const y = Math.floor(cy + dy + k);
      if (y >= 0 && y < H && x >= 0 && x < W && fb[y * W + Math.floor(x)] === P.YELLOW) px(fb, x, y, P.ORANGE);
    }
  }
}

export function drawHills(fb, c, sh) {
  for (let x = 0; x < W; x++) {
    const wx = x - sh.x;
    const far = 20 + 8 * Math.sin(wx * 0.034 + 1.2) + 5 * Math.sin(wx * 0.091 + 0.3);
    const near = 9 + 5 * Math.sin(wx * 0.052 + 2.1) + 3 * Math.sin(wx * 0.13 + 1.0);
    for (let y = Math.floor(GROUND - far); y < GROUND; y++) px(fb, x, y + c + sh.y, P.PURPLE);
    for (let y = Math.floor(GROUND - near); y < GROUND; y++) px(fb, x, y + c + sh.y, P.DIRT);
  }
}

export function drawGround(fb, c, sh) {
  const top = GROUND + c + sh.y;
  rect(fb, 0, top, W, H - top + 4, P.DIRT);
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(hash(i, 21) * W), y = top + 2 + Math.floor(hash(i, 22) * 66);
    px(fb, x + sh.x, y, hash(i, 23) > 0.5 ? P.STEEL : P.PURPLE);
  }
}

export function drawPad(fb, t, f, c, sh) {
  const ox = sh.x, oy = c + sh.y;
  // landasan beton
  rect(fb, 106 + ox, PAD_TOP + oy, 58, 6, P.STEEL);
  rect(fb, 106 + ox, PAD_TOP + oy, 58, 1, P.GREY);
  rect(fb, 128 + ox, PAD_TOP + 1 + oy, 14, 5, P.BLACK); // parit api
  // menara rangka
  const top = 296;
  for (const x of [98, 109]) rect(fb, x + ox, top + oy, 2, PAD_TOP - top, P.STEEL);
  for (let y = top; y < PAD_TOP - 1; y += 9) {
    line(fb, 100 + ox, y + oy, 108 + ox, y + 9 + oy, P.STEEL);
    line(fb, 108 + ox, y + oy, 100 + ox, y + 9 + oy, P.STEEL);
  }
  rect(fb, 96 + ox, top - 2 + oy, 16, 2, P.STEEL);
  // lampu suar di puncak, kedip 1 Hz terkunci frame
  if (Math.floor(f / (FPS / 2)) % 2 === 0) rect(fb, 103 + ox, top - 5 + oy, 2, 3, P.RED);
  // dua lengan servis, ditarik masuk ke menara
  const len = Math.round(19 * (1 - easeInOut(progress(t, T.arm[0], T.arm[1]))));
  for (const y of [338, 372]) {
    if (len > 0) {
      rect(fb, 111 + ox, y + oy, len, 2, P.GREY);
      rect(fb, 111 + ox, y + 2 + oy, len, 1, P.STEEL);
    }
  }
}

// ---------------------------------------------------------------- roket
// Sprite prosedural 20x50, hidung ke atas, pusat (10,25). Cahaya dari kiri (matahari).
function rocketPixel(ix, iy) {
  if (ix < 0 || ix > 19 || iy < 0) return -1;
  const xc = ix + 0.5;
  if (iy <= 13) { // hidung
    const hw = 5 * Math.sqrt((iy + 1) / 14);
    const l = 10 - hw, r = 10 + hw;
    if (xc < l || xc > r) return -1;
    if (xc > r - 1.8) return P.PURPLE;
    if (xc < l + 1.2) return P.PINK;
    return P.RED;
  }
  if (iy <= 43 && ix >= 5 && ix <= 14) { // badan
    const dx = xc - 10, dy = iy + 0.5 - 21;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d <= 3.1) {
      if (d > 2.2) return P.STEEL;
      if (dx < -0.4 && dy < -0.4) return P.WHITE;
      return dx + dy > 0.8 ? P.BLUE : P.ICE;
    }
    if (iy === 14 || iy === 43) return P.STEEL;
    if (iy >= 30 && iy <= 32) return ix >= 13 ? P.PURPLE : ix === 5 ? P.PINK : P.RED;
    if (ix === 14) return P.STEEL;
    if (ix === 13) return P.GREY;
    return P.WHITE;
  }
  if (iy >= 32 && iy <= 47) { // sirip
    const k = Math.min(5, Math.floor(((iy - 32) / 15) * 5) + 1);
    if (ix < 5 && ix >= 5 - k) return ix === 5 - k ? P.PINK : P.RED;
    if (ix > 14 && ix <= 14 + k) return P.PURPLE;
  }
  if (iy >= 44 && iy <= 49) { // nozel
    const hw = iy < 46 ? 3 : 4;
    if (ix >= 10 - hw && ix < 10 + hw) return ix >= 10 + hw - 2 ? P.STEEL : iy >= 48 ? P.STEEL : P.GREY;
  }
  return -1;
}

function flamePixel(ix, iy, len, f) {
  const d = iy - 50;
  if (len <= 0 || d < 0 || d > len) return -1;
  const q = d / len;
  const hw = 3.8 * Math.pow(1 - q, 0.7) + (hash(iy, f * 7 + 1) - 0.5) * 1.2;
  const u = Math.abs(ix + 0.5 - 10);
  if (u > hw) return -1;
  const r = u / Math.max(hw, 0.5);
  if (q < 0.15 && r < 0.45) return P.WHITE;
  if (q < 0.6 && r < 0.6) return P.YELLOW;
  if (q < 0.85 && r < 0.9) return P.ORANGE;
  return P.RED;
}

export function drawRocket(fb, pose, len, f, sh) {
  const cx = Math.round(pose.x) + sh.x, cy = Math.round(pose.y) + sh.y;
  const cs = Math.cos(pose.ang), sn = Math.sin(pose.ang);
  const R = 27 + Math.ceil(len) + 2;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const lx = cs * (dx + 0.5) + sn * (dy + 0.5);
      const ly = -sn * (dx + 0.5) + cs * (dy + 0.5);
      const ix = Math.floor(lx + 10), iy = Math.floor(ly + 25);
      let c = rocketPixel(ix, iy);
      if (c < 0) c = flamePixel(ix, iy, len, f);
      if (c >= 0) px(fb, cx + dx, cy + dy, c);
    }
  }
}

// ---------------------------------------------------------------- asap
function puff(fb, x, y, r) {
  if (r < 1.2) { px(fb, x, y, P.GREY); return; }
  disc(fb, x + r * 0.2, y + r * 0.25, r * 0.95, P.STEEL);
  disc(fb, x, y, r, P.GREY);
  disc(fb, x - r * 0.28, y - r * 0.3, r * 0.6, P.WHITE);
}

// Kepulan kecil dari dasar roket sebelum ignition, makin sering menjelang hitungan habis.
export function drawVent(fb, t, c, sh) {
  const { start, end, step } = T.vent;
  for (let k = 0; ; k++) {
    const tb = start + k * step + hash(k, 31) * 0.05;
    if (tb > end || tb > t) break;
    const intensity = (tb - start) / (end - start);
    if (hash(k, 32) > 0.45 + intensity * 0.55) continue;
    const age = t - tb, life = 0.9 + hash(k, 33) * 0.5;
    if (age >= life) continue;
    const p = age / life;
    const side = k % 2 ? 1 : -1;
    const x = ROCKET_X + side * (5 + (10 + hash(k, 34) * 14) * age);
    const y = PAD_TOP - 3 - (4 + hash(k, 35) * 6) * age;
    puff(fb, x + sh.x, y + c + sh.y, 1 + (2.5 + intensity * 2) * Math.pow(p, 0.6));
  }
}

// Awan landasan saat ignition/liftoff, menyebar ke samping lalu melambat.
export function drawCloud(fb, t, c, sh) {
  const { start, end, step } = T.cloud;
  for (let k = 0; ; k++) {
    const tb = start + k * step;
    if (tb > end || tb > t) break;
    const age = t - tb;
    const side = hash(k, 41) > 0.5 ? 1 : -1;
    const v = 25 + hash(k, 42) * 75;
    const x = ROCKET_X + side * (2 + (v * (1 - Math.exp(-1.6 * age))) / 1.6);
    const y = PAD_TOP - 2 - (3 + hash(k, 43) * 9) * age;
    const r = 2 + 9 * (1 - Math.exp(-1.3 * age)) * (0.6 + 0.7 * hash(k, 44));
    const sy = y + c + sh.y;
    if (sy - r > H) continue;
    puff(fb, x + sh.x, sy, r);
  }
}

// Jejak asap: satu kepulan tiap T.trail.gap px ketinggian, diam di dunia.
const TRAIL = (() => {
  const out = [];
  const top = lift(T.trail.end);
  for (let a = 20; a < top; a += T.trail.gap) {
    let lo = T.liftoff, hi = T.trail.end; // waktu roket lewat ketinggian a (bisection)
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (lift(m) < a) lo = m; else hi = m; }
    out.push({ a, tb: hi });
  }
  return out;
})();

export function drawTrail(fb, t, c, sh) {
  for (let k = 0; k < TRAIL.length; k++) {
    const { a, tb } = TRAIL[k];
    if (tb > t) break;
    const age = t - tb;
    const life = 2.4 - Math.min(1.7, a / 1400);
    if (age >= life) continue;
    const drift = (hash(k, 52) - 0.5) * 10 * age; // asap melebar pelan ke samping
    const x = ROCKET_X + (hash(k, 51) - 0.5) * 4 + drift;
    const y = PAD_TOP - a + c; // dasar nozel saat lewat
    const r = (2.5 + 6 * (1 - Math.exp(-age * 1.4))) * (1 - Math.pow(age / life, 3));
    if (y + r < 0 || y - r > H) continue;
    puff(fb, x + sh.x, y + sh.y, r);
  }
}

// ---------------------------------------------------------------- bumi dari orbit
const PLANET_R = 300;
const LIGHT = (() => { const v = [-0.8, -0.45, 0.42]; const n = Math.hypot(...v); return v.map((k) => k / n); })();

export function drawPlanet(fb, t) {
  const k = easeOut(progress(t, T.planet[0], T.planet[1]));
  if (k <= 0) return;
  const cx = 150, cy = lerp(800, 640, k);
  const R = PLANET_R;
  const spin = t * 0.004; // rotasi bumi, sangat pelan
  for (let y = Math.max(0, Math.floor(cy - R - 3)); y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R + 2) continue;
      if (d > R) { // atmosfer tipis di sisi terang
        if (dx < 40 && bayer(x, y) < 0.5) fb[y * W + x] = P.BLUE;
        continue;
      }
      const nx = dx / R, ny = dy / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const lam = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
      const lon = Math.atan2(nx, nz) + spin, lat = Math.asin(ny);
      const land = vnoise(lon * 2.6 + 3, lat * 3.4, 61) * 0.8 + vnoise(lon * 8, lat * 9, 62) * 0.2 > 0.55;
      const cloud = vnoise(lon * 2.2 + 9, lat * 16, 63) * 0.75 + vnoise(lon * 9, lat * 30, 64) * 0.25 > 0.66;
      const th = bayer(x, y) * 0.16;
      let c;
      if (lam + th < 0.06) c = P.NIGHT; // sisi malam
      else if (lam + th < 0.14) c = P.ORANGE; // garis senja di terminator
      else if (cloud) c = lam + th > 0.32 ? P.WHITE : P.GREY;
      else if (land) c = lam + th > 0.34 ? P.GREEN : P.TEAL;
      else c = lam + th > 0.38 ? P.BLUE : P.NAVY;
      if (d > R - 1.5 && lam > 0.2) c = P.ICE; // tepi terang
      fb[y * W + x] = c;
    }
  }
}

// ---------------------------------------------------------------- teks
export function drawText(fb, str, x, y, scale, c) {
  for (let i = 0; i < str.length; i++) {
    const g = glyph(str[i]);
    for (let gy = 0; gy < GLYPH_H; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (g[gy][gx] === '#') rect(fb, x + (i * ADVANCE + gx) * scale, y + gy * scale, scale, scale, c);
      }
    }
  }
}

export function drawCountdown(fb, t, f) {
  for (let i = 0; i < T.count.length; i++) {
    const a = T.count[i], b = T.count[i + 1] ?? T.countEnd;
    if (t < a || t >= b) continue;
    const pop = f - Math.round(a * FPS) < 2; // pop 2 frame
    const s = pop ? 9 : 8;
    const str = String(3 - i);
    const w = textWidth(str, s), h = GLYPH_H * s;
    const x = Math.round(SAFE_CX - w / 2), y = Math.round(116 - h / 2);
    drawText(fb, str, x + 2, y + 2, s, P.NIGHT); // bayangan padat, bukan outline
    drawText(fb, str, x, y, s, P.WHITE);
  }
}

export function drawMission(fb, t, f) {
  if (t < T.typeStart) return;
  const n = Math.min(Math.floor((t - T.typeStart) / T.typeStep + 1e-6) + 1, TEXT.lines.join('').length);
  const s = 3, lh = GLYPH_H * s + 9, y0 = 96;
  let left = n, cur = null;
  TEXT.lines.forEach((line, li) => {
    const shown = line.slice(0, Math.max(0, Math.min(line.length, left)));
    const x = Math.round(SAFE_CX - textWidth(line, s) / 2), y = y0 + li * lh;
    drawText(fb, shown, x, y, s, P.WHITE);
    if (left > 0 && left <= line.length) cur = { x: x + shown.length * ADVANCE * s, y };
    left -= line.length;
  });
  if (!cur) return;
  const done = n >= TEXT.lines.join('').length;
  const blinkOn = !done || Math.floor((f - Math.round(T.typeStart * FPS)) / (FPS / 2)) % 2 === 0;
  if (blinkOn) rect(fb, cur.x, cur.y, 5 * s, GLYPH_H * s, P.ICE);
}
