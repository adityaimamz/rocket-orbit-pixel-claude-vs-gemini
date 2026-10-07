// Musik + SFX sintetis dari kode, tanpa sampel. Waktu dibaca dari src/timeline.js.
// Hasil: out/music.wav, out/sfx.wav (stem terpisah), out/audio.wav (mix, 48 kHz stereo 16-bit).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, DURATION, BPM, TEXT, TYPE_CHARS, TYPE_END } from '../src/timeline.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SR = 48000;
const N = Math.round(SR * DURATION);
const BEAT = 60 / BPM;

const stem = () => [new Float32Array(N), new Float32Array(N)];
const music = stem();
const sfx = stem();

// noise deterministik (LCG) — tiap pemanggil punya seed sendiri
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

function put(buf, i, v, pan = 0) {
  if (i < 0 || i >= N) return;
  buf[0][i] += v * Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2;
  buf[1][i] += v * Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
}

// nada: osilator + AR envelope + low-pass satu kutub
function tone(buf, start, dur, freq, o = {}) {
  const { wave = 'tri', vol = 0.1, a = 0.005, r = 0.08, pan = 0, duty = 0.5, lp = 6000, glide = 0, vib = 0 } = o;
  const i0 = Math.round(start * SR), len = Math.round((dur + r) * SR);
  const k = 1 - Math.exp((-2 * Math.PI * lp) / SR);
  let ph = 0, y = 0;
  for (let n = 0; n < len; n++) {
    const tt = n / SR;
    const f = freq * (1 + glide * clamp(tt / dur)) * (1 + vib * Math.sin(2 * Math.PI * 5.5 * tt));
    ph = (ph + f / SR) % 1;
    let s;
    if (wave === 'sine') s = Math.sin(2 * Math.PI * ph);
    else if (wave === 'square') s = ph < duty ? 1 : -1;
    else if (wave === 'bell') s = Math.sin(2 * Math.PI * ph) + 0.35 * Math.sin(2 * Math.PI * ph * 2.76) * Math.exp(-tt * 6);
    else s = 1 - 4 * Math.abs(ph - 0.5);
    y += k * (s - y);
    const env = tt < a ? tt / a : tt < dur ? 1 : Math.exp(-(tt - dur) / (r / 4));
    put(buf, i0 + n, y * vol * env, pan);
  }
}

// noise berfilter dengan envelope fungsi waktu
function noise(buf, start, dur, envFn, o = {}) {
  const { lp = 4000, hp = 0, seed = 1, width = 0.6 } = o;
  const i0 = Math.round(start * SR), len = Math.round(dur * SR);
  const rl = rng(seed), rr = rng(seed + 77);
  let yl = 0, yr = 0, hl = 0, hr = 0;
  for (let n = 0; n < len; n++) {
    const tt = n / SR;
    const cut = typeof lp === 'function' ? lp(start + tt) : lp;
    const k = 1 - Math.exp((-2 * Math.PI * cut) / SR);
    const m = rl(), side = rr();
    const l = m + width * (side - m), r = m - width * (side - m);
    yl += k * (l - yl); yr += k * (r - yr);
    let ol = yl, or = yr;
    if (hp > 0) {
      const kh = 1 - Math.exp((-2 * Math.PI * hp) / SR);
      hl += kh * (yl - hl); hr += kh * (yr - hr);
      ol = yl - hl; or = yr - hr;
    }
    const e = envFn(start + tt, tt);
    const i = i0 + n;
    if (i >= 0 && i < N) { buf[0][i] += ol * e; buf[1][i] += or * e; }
  }
}

function kick(buf, at, vol = 0.5) {
  const i0 = Math.round(at * SR);
  let ph = 0;
  for (let n = 0; n < SR * 0.22; n++) {
    const tt = n / SR;
    ph += (45 + 110 * Math.exp(-tt * 28)) / SR;
    put(buf, i0 + n, Math.sin(2 * Math.PI * ph) * vol * Math.exp(-tt * 14));
  }
}

// ------------------------------------------------------------------ MUSIK (120 BPM)
// S1 Am redup (menunggu) -> S2 F, G naik (dorongan) -> S3 Cmaj9 terbuka (lega).
const roarEnv = (t) => (t < T.ignition ? 0
  : t < T.liftoff ? 0.35 * smooth(T.ignition, T.liftoff, t)
  : t < T.meco ? (0.35 + 0.65 * smooth(T.liftoff, T.liftoff + 0.15, t)) * (1 - 0.75 * smooth(T.liftoff + 0.6, T.meco, t))
  : Math.max(0, 0.25 * (1 - (t - T.meco) / 0.06)));

// pad
const pad = (s, d, notes, vol) => notes.forEach((m, j) =>
  tone(music, s, d, mtof(m), { wave: 'square', duty: 0.5, vol, a: 0.6, r: 0.8, lp: 900, pan: (j - 1.5) * 0.25, vib: 0.002 }));
pad(0, 4, [57, 60, 64], 0.035);                 // Am
pad(4, 2, [53, 57, 60, 65], 0.03);              // F
pad(6, 2, [55, 59, 62, 67], 0.03);              // G
pad(8, 4, [48, 60, 64, 67, 71, 74], 0.03);      // Cmaj9

// bass
tone(music, 0, 4, mtof(33), { wave: 'tri', vol: 0.16, a: 0.8, r: 0.3, lp: 400 });
for (let b = 0; b < 16; b++) {
  const at = 4 + b * BEAT / 2;
  tone(music, at, BEAT / 2 - 0.04, mtof(b < 8 ? 29 : 31), { wave: 'square', duty: 0.25, vol: 0.09, lp: 500, r: 0.03 });
}
tone(music, 8, 3.6, mtof(36), { wave: 'sine', vol: 0.2, a: 0.02, r: 0.6 });

// detik jam di S1 (tiap ketukan) — menegangkan hitung mundur
for (let b = 0; b < 7; b++) {
  const at = b * BEAT;
  noise(music, at, 0.04, (_, tt) => 0.05 * Math.exp(-tt * 90), { lp: 9000, hp: 5000, seed: 300 + b, width: 0 });
}

// arpeggio 16-an di S2, naik satu oktaf di bar terakhir
const ARP_F = [65, 69, 72, 77], ARP_G = [67, 71, 74, 79];
for (let s = 0; s < 32; s++) {
  const at = 4 + s * BEAT / 4;
  const set = s < 16 ? ARP_F : ARP_G;
  const m = set[s % 4] + (s >= 24 ? 12 : 0);
  tone(music, at, BEAT / 4 - 0.02, mtof(m), {
    wave: 'square', duty: 0.25, vol: 0.035 + 0.02 * (s / 32), lp: 1500 + 3000 * (s / 32), r: 0.04, pan: (s % 4 - 1.5) * 0.3,
  });
}
// kick & snare S2
for (let b = 0; b < 8; b++) {
  kick(music, 4 + b * BEAT, 0.42);
  if (b % 2 === 1) noise(music, 4 + b * BEAT, 0.16, (_, tt) => 0.09 * Math.exp(-tt * 22), { lp: 6000, hp: 900, seed: 400 + b });
}
// S3: lonceng arpeggio 8-an, pelan
const BELL = [72, 76, 79, 83, 86, 83, 79, 76];
for (let s = 0; s < 7; s++) {
  tone(music, 8 + s * BEAT, 0.05, mtof(BELL[s]), { wave: 'bell', vol: 0.06, a: 0.002, r: 0.9, lp: 7000, pan: (s % 2 ? 0.3 : -0.3) });
}

// duck musik di bawah gemuruh + fade akhir
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = (1 - 0.45 * roarEnv(t)) * (1 - smooth(11.2, 12, t));
  music[0][i] *= g; music[1][i] *= g;
}

// ------------------------------------------------------------------ SFX
// bip hitung mundur: 3, 2 = B5; 1 = E6 lebih panjang
T.count.forEach((at, i) => {
  const last = i === T.count.length - 1;
  tone(sfx, at, last ? 0.28 : 0.12, mtof(last ? 88 : 83), { wave: 'square', duty: 0.5, vol: 0.12, a: 0.002, r: 0.05, lp: 4000 });
});

// desis venting, kepulan makin sering menjelang ignition (jadwal sama dengan gambar)
noise(sfx, 0, T.ignition + 0.2, (t) => 0.025 + 0.035 * smooth(0, T.ignition, t) * (0.6 + 0.4 * Math.sin(t * 23)) - 0.06 * smooth(T.ignition, T.ignition + 0.2, t),
  { lp: 5000, hp: 1800, seed: 7 });

// ignition: kretek + gemuruh naik, lalu raungan liftoff yang meredup seiring ketinggian
noise(sfx, T.ignition, 0.55, (t, tt) => {
  const dens = 0.3 + tt * 1.2;
  return (Math.sin(tt * 917) * Math.sin(tt * 2311) > 1 - dens * 0.4 ? 0.35 : 0) * Math.exp(-tt * 1.5);
}, { lp: 7000, hp: 1200, seed: 11 });
noise(sfx, T.ignition, T.meco - T.ignition + 0.2, (t) => 0.9 * roarEnv(t),
  { lp: (t) => (t < T.liftoff ? 300 + 600 * smooth(T.ignition, T.liftoff, t) : 900 * Math.exp(-(t - T.liftoff) * 0.55) + 160), seed: 12, width: 0.8 });
// sub-bass gemuruh
{
  const i0 = Math.round(T.ignition * SR), len = Math.round((T.meco - T.ignition + 0.1) * SR);
  let ph = 0;
  for (let n = 0; n < len; n++) {
    const t = T.ignition + n / SR;
    ph += (40 + 4 * Math.sin(t * 7)) / SR;
    put(sfx, i0 + n, Math.sin(2 * Math.PI * ph) * 0.3 * roarEnv(t));
  }
}
// mesin mati: dentum logam pendek
tone(sfx, T.meco, 0.08, 140, { wave: 'sine', vol: 0.32, a: 0.001, r: 0.25, glide: -0.6 });
noise(sfx, T.meco, 0.06, (_, tt) => 0.2 * Math.exp(-tt * 70), { lp: 3000, hp: 400, seed: 13 });

// ketikan: satu klik per huruf, bergeser kiri -> kanan mengikuti posisi huruf
for (let i = 0; i < TYPE_CHARS; i++) {
  const at = T.typeStart + i * T.typeStep;
  let col = i, len = TEXT.lines[0].length;
  if (i >= len) { col = i - len; len = TEXT.lines[1].length; }
  const pan = ((col + 0.5) / len - 0.5) * 0.6;
  noise(sfx, at, 0.03, (_, tt) => 0.22 * Math.exp(-tt * 160), { lp: 9000, hp: 2500, seed: 500 + i, width: 0 });
  tone(sfx, at, 0.015, 2200 + (i % 3) * 180, { wave: 'square', vol: 0.05, a: 0.001, r: 0.02, lp: 5000, pan });
}
// bunyi selesai
tone(sfx, TYPE_END + 0.15, 0.05, mtof(84), { wave: 'bell', vol: 0.13, a: 0.002, r: 1.4, pan: -0.15 });
tone(sfx, TYPE_END + 0.27, 0.05, mtof(91), { wave: 'bell', vol: 0.11, a: 0.002, r: 1.4, pan: 0.15 });

// ------------------------------------------------------------------ mix & tulis
function peak(bufs) { let p = 0; for (const b of bufs) for (const ch of b) for (const v of ch) p = Math.max(p, Math.abs(v)); return p; }
const mix = stem();
for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) mix[c][i] = music[c][i] + sfx[c][i];
// normalisasi; stem memakai gain yang sama agar sejajar
const gain = 10 ** (-1.5 / 20) / peak([mix]);
for (const b of [music, sfx, mix]) for (const ch of b) for (let i = 0; i < N; i++) ch[i] *= gain;
// mix master: +4 dB lalu soft-limit lutut lembut (target kira-kira -14 LUFS, puncak < -1 dBFS)
const PUSH = 10 ** (4 / 20), KNEE = 0.55, CEIL = 10 ** (-1.8 / 20);
for (const ch of mix) for (let i = 0; i < N; i++) {
  const x = ch[i] * PUSH, a = Math.abs(x);
  ch[i] = a <= KNEE ? x : Math.sign(x) * (KNEE + (CEIL - KNEE) * Math.tanh((a - KNEE) / (CEIL - KNEE)));
}
// fade 5 ms di ujung agar tidak klik
for (const b of [music, sfx, mix]) for (const ch of b) for (let i = 0; i < 240; i++) { ch[i] *= i / 240; ch[N - 1 - i] *= i / 240; }

function wav(path, [L, R]) {
  const buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    buf.writeInt16LE(Math.round(clamp(L[i], -1, 1) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(clamp(R[i], -1, 1) * 32767), 46 + i * 4);
  }
  writeFileSync(path, buf);
}
mkdirSync(join(ROOT, 'out'), { recursive: true });
wav(join(ROOT, 'out', 'music.wav'), music);
wav(join(ROOT, 'out', 'sfx.wav'), sfx);
wav(join(ROOT, 'out', 'audio.wav'), mix);
console.log(`audio ${DURATION} s @ ${SR} Hz -> out/audio.wav (+ music.wav, sfx.wav), gain ${(20 * Math.log10(gain)).toFixed(1)} dB`);
