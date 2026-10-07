// Satu sumber waktu untuk gambar (src/draw.js) dan suara (tools/audio.mjs).
// Semua angka detik ada di sini; scene tidak boleh menulis waktu sendiri.

export const W = 270;            // resolusi internal
export const H = 480;
export const SCALE = 4;          // tampil 1080x1920, nearest-neighbor
export const FPS = 30;
export const DURATION = 12;
export const FRAMES = FPS * DURATION; // 360
export const BPM = 120;          // 1 ketukan = 0,5 s; momen besar jatuh di ketukan

export const SCENES = [
  { id: 'S1', name: 'Landasan senja', start: 0, end: 4 },
  { id: 'S2', name: 'Lepas landas', start: 4, end: 8 },
  { id: 'S3', name: 'Orbit', start: 8, end: 12 },
];

export const T = {
  count: [0.5, 1.5, 2.5],        // angka 3, 2, 1 muncul (tiap ketukan ganjil)
  countEnd: 3.5,                 // angka 1 hilang = ignition
  vent: { start: 0, end: 3.5, step: 0.11 }, // kepulan asap kecil dari dasar roket
  arm: [3.0, 3.4],               // lengan menara ditarik
  ignition: 3.5,
  liftoff: 4.0,
  shake: [3.5, 5.0],
  cloud: { start: 3.5, end: 5.2, step: 0.025 }, // awan asap landasan
  trail: { end: 7.9, gap: 4 },   // jejak asap per 4 px ketinggian, sampai mesin mati
  lock: 1.6,                     // lama roket naik ke posisi kunci layar
  pitch: [7.2, 8.6],             // roket rebah ke horizontal
  meco: 7.9,                     // mesin mati
  orbit: 8.0,
  planet: [7.4, 9.0],            // bumi naik dari bawah frame
  coast: [7.8, 9.0],             // roket mulai meluncur ke kanan
  typeStart: 9.0,
  typeStep: 0.1,
  end: 12,
};

export const TEXT = { lines: ['MISSION', 'START'] };
export const TYPE_CHARS = TEXT.lines.join('').length; // 12 huruf (spasi = ganti baris)
export const TYPE_END = T.typeStart + (TYPE_CHARS - 1) * T.typeStep;

// Ketinggian roket (px dunia) sejak liftoff. Pure function dari t.
export function lift(t) {
  const u = t - T.liftoff;
  if (u <= 0) return 0;
  return 60 * u * u + 40 * u * u * u;
}
