// Penampil: kanvas internal 270x480 -> kanvas tampil 1080x1920 (nearest-neighbor).
// Preview memutar berdasarkan jam, tapi gambar tetap drawFrame(frame/FPS).

import { W, H, SCALE, FPS, FRAMES } from './timeline.js';
import { RGBA32 } from './palette.js';
import { drawFrame } from './draw.js';

const small = document.getElementById('fb');
const view = document.getElementById('view');
const sctx = small.getContext('2d');
const vctx = view.getContext('2d');
small.width = W; small.height = H;
view.width = W * SCALE; view.height = H * SCALE;
vctx.imageSmoothingEnabled = false;

const img = sctx.createImageData(W, H);
const u32 = new Uint32Array(img.data.buffer);

function paint(f) {
  const idx = drawFrame(f / FPS);
  for (let i = 0; i < idx.length; i++) u32[i] = RGBA32[idx[i]];
  sctx.putImageData(img, 0, 0);
  vctx.drawImage(small, 0, 0, view.width, view.height);
  return idx;
}

// --- API untuk tools/render.mjs dan tools/check.mjs
window.FRAMES = FRAMES;
window.renderFrame = (f) => { paint(f); return view.toDataURL('image/png'); };
window.frameDigest = (f) => {
  const idx = paint(f);
  let h = 2166136261;
  for (let i = 0; i < idx.length; i++) h = Math.imul(h ^ idx[i], 16777619);
  // warna yang benar-benar ada di kanvas tampil (bukan di buffer indeks)
  const data = new Uint32Array(vctx.getImageData(0, 0, view.width, view.height).data.buffer);
  const colors = new Set();
  for (let i = 0; i < data.length; i += 7) colors.add(data[i]);
  return { hash: h >>> 0, colors: [...colors] };
};

// --- kontrol preview
const ui = document.getElementById('ui');
if (ui) {
  const slider = document.getElementById('seek');
  const label = document.getElementById('label');
  const btn = document.getElementById('play');
  slider.max = FRAMES - 1;
  let frame = Number(new URLSearchParams(location.search).get('f') ?? 0);
  let playing = false, t0 = 0, f0 = 0;
  const show = (f) => {
    frame = Math.max(0, Math.min(FRAMES - 1, f));
    paint(frame);
    slider.value = frame;
    label.textContent = `f ${String(frame).padStart(3, '0')} / ${(frame / FPS).toFixed(2)} s`;
  };
  const tick = (now) => {
    if (!playing) return;
    const f = f0 + Math.floor(((now - t0) / 1000) * FPS);
    if (f >= FRAMES) { playing = false; btn.textContent = 'Play'; show(FRAMES - 1); return; }
    if (f !== frame) show(f);
    requestAnimationFrame(tick);
  };
  const toggle = () => {
    playing = !playing;
    btn.textContent = playing ? 'Pause' : 'Play';
    if (playing) {
      if (frame >= FRAMES - 1) frame = 0;
      f0 = frame; t0 = performance.now();
      requestAnimationFrame(tick);
    }
  };
  btn.onclick = toggle;
  slider.oninput = () => { playing = false; btn.textContent = 'Play'; show(Number(slider.value)); };
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.code === 'ArrowRight') show(frame + 1);
    if (e.code === 'ArrowLeft') show(frame - 1);
  });
  show(frame);
} else {
  paint(0);
}
