// Acak deterministik, easing, dither. Tidak ada Math.random / Date.now di proyek ini.

export function hash(i, seed = 0) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul((seed | 0) + 0x9e37, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const smoothstep = (a, b, x) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const progress = (t, a, b) => clamp((t - a) / (b - a));

// Integral numerik f(s) ds dari a ke b (langkah tetap -> hasil identik tiap kali).
export function integrate(f, a, b, dt = 1 / 240) {
  if (b <= a) return 0;
  const n = Math.ceil((b - a) / dt);
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += f(a + (i + 0.5) * h);
  return sum * h;
}

// Matriks Bayer 4x4 -> ambang 0..1 untuk dither berpola.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function bayer(x, y) {
  return (BAYER[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)] + 0.5) / 16;
}

// Value noise 2D halus (dari hash kisi).
export function vnoise(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (a, b) => hash(Math.imul(a, 73856093) ^ Math.imul(b, 19349663), seed);
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
