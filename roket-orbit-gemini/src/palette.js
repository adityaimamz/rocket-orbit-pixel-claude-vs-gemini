// palette.js — Palet warna 16 warna retro ruang angkasa (DawnBringer/PICO-8 style)
// Konsisten di seluruh adegan. Tidak ada warna di luar 16 warna ini.

export const PALETTE = {
  VOID: '#05050d',      // 0: Hitam ruang angkasa pekat, garis tepi
  NIGHT: '#121528',     // 1: Biru malam atmosfer tinggi / bayangan orbit
  NAVY: '#1f2c4c',      // 2: Biru tua senja / shading roket
  SLATE: '#364f6b',     // 3: Biru baja atmosfer / rangka menara
  PURPLE: '#5b3b56',    // 4: Ungu senja / transisi cakrawala
  CRIMSON: '#94384a',   // 5: Merah tua senja / sirip merah roket
  RUST: '#d45c43',      // 6: Oranye karat / lidah api luar
  ORANGE: '#f39c38',    // 7: Oranye terang api pendorong / semburat senja
  YELLOW: '#f7d057',    // 8: Kuning inti api / lampu peringatan / bintang
  WHITE: '#fcfbe3',     // 9: Putih hangat badan roket / bintang / asap terang
  CAPSULE: '#9babb2',   // 10: Abu-abu logam terang / asap tengah
  STEEL: '#52606d',     // 11: Abu-abu baja gelap / menara peluncuran
  SILO: '#2c3540',      // 12: Abu-abu parit peluncur / siluet struktur
  GROUND: '#1b2024',    // 13: Aspal landasan / siluet bumi bawah
  TEAL: '#267b84',      // 14: Hijau toska samudera bumi / kaca kokpit
  CYAN: '#4cd3b2',      // 15: Sian pendar atmosfer bumi / HUD / percikan api
};

export const COLOR_LIST = Object.values(PALETTE);

// Pastikan tepat 16 warna
if (COLOR_LIST.length !== 16) {
  console.warn(`Peringatan: Palet harus 16 warna, ditemukan ${COLOR_LIST.length}`);
}
