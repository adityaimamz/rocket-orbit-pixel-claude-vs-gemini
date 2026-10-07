// timeline.js — Sumber waktu tunggal, konstanta, dan fungsi matematika deterministik

export const W = 270;
export const H = 480;
export const DISPLAY_W = 1080;
export const DISPLAY_H = 1920;
export const FPS = 30;
export const DURATION = 12.0;
export const TOTAL_FRAMES = 360;

export const SCENES = {
  S1_PAD: { start: 0.0, end: 4.0, dur: 4.0, name: 'Landasan Senja & Hitung Mundur' },
  S2_ASCENT: { start: 4.0, end: 8.0, dur: 4.0, name: 'Lepas Landas & Menembus Atmosfer' },
  S3_ORBIT: { start: 8.0, end: 12.0, dur: 4.0, name: 'Mencapai Orbit & Mission Start' },
};

export const CUES = {
  COUNT_3: 0.0,
  COUNT_2: 1.0,
  COUNT_1: 2.0,
  IGNITION: 3.0,
  LIFTOFF: 4.0,
  CLOUD_BREAK: 5.5,
  SPACE_ENTRY: 6.8,
  ORBIT_REACHED: 8.0,
  SOLAR_DEPLOY: 8.5,
  TYPEWRITER_START: 9.0,
  TYPEWRITER_END: 10.5,
};

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function easeInQuad(t) {
  const c = clamp(t, 0, 1);
  return c * c;
}

export function easeOutQuad(t) {
  const c = clamp(t, 0, 1);
  return 1 - (1 - c) * (1 - c);
}

export function easeInOutQuad(t) {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

// PRNG deterministik f(seed) murni, tanpa efek samping
export function hash(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = n + (n << 3);
  n = n ^ (n >>> 4);
  n = Math.imul(n, 0x27d4eb2d);
  n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}

export function hash2D(x, y, seed = 0) {
  const n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1013904223)) >>> 0;
  return hash(n);
}
