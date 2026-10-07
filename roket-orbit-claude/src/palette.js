// Palet tetap 16 warna untuk seluruh video. Framebuffer berisi indeks ke tabel ini,
// jadi tidak mungkin muncul warna di luar palet (tanpa anti-alias, tanpa alpha).

export const HEX = [
  '#000000', // 0  BLACK   angkasa
  '#F5F5F5', // 1  WHITE   badan roket, teks
  '#9CA3AF', // 2  GREY    asap, bayangan putih
  '#3A3F4B', // 3  STEEL   menara, landasan, garis
  '#0B1230', // 4  NIGHT   langit malam, sisi gelap bumi
  '#1D2B64', // 5  NAVY    langit biru tua, laut gelap
  '#3B82F6', // 6  BLUE    laut terang
  '#60A5FA', // 7  ICE     jendela, atmosfer, kursor
  '#F2763A', // 8  ORANGE  senja, api
  '#FFC94A', // 9  YELLOW  matahari, inti api
  '#D63C2F', // 10 RED     hidung & sirip roket, api luar
  '#6B3A6E', // 11 PURPLE  langit senja atas, bukit jauh
  '#E8907A', // 12 PINK    langit senja tengah, sorotan merah
  '#2A1E1A', // 13 DIRT    tanah
  '#3E8F6A', // 14 GREEN   daratan terang
  '#1F5C6B', // 15 TEAL    daratan gelap
];

export const P = {
  BLACK: 0, WHITE: 1, GREY: 2, STEEL: 3, NIGHT: 4, NAVY: 5, BLUE: 6, ICE: 7,
  ORANGE: 8, YELLOW: 9, RED: 10, PURPLE: 11, PINK: 12, DIRT: 13, GREEN: 14, TEAL: 15,
};

if (HEX.length > 16) throw new Error(`Palet ${HEX.length} warna, maksimal 16`);

// RGBA little-endian untuk Uint32Array di atas ImageData.
export const RGBA32 = HEX.map((h) => {
  const n = parseInt(h.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
});
