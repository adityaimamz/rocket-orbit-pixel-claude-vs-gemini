// main.js — Preview player browser + export hook window.__ve untuk Playwright
import { W, H, DISPLAY_W, DISPLAY_H, FPS, DURATION, clamp } from './timeline.js';
import { drawFrame } from './film.js';

const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false, willReadFrequently: true });
cv.width = DISPLAY_W;
cv.height = DISPLAY_H;

// Offscreen canvas beresolusi internal 270x480 murni
const offCv = document.createElement('canvas');
offCv.width = W;
offCv.height = H;
const offCtx = offCv.getContext('2d', { alpha: false });

// Matikan anti-aliasing / smoothing untuk memastikan piksel tajam sempurna (nearest-neighbor)
ctx.imageSmoothingEnabled = false;
offCtx.imageSmoothingEnabled = false;

// Fungsi render frame: gambar ke 270x480 lalu blit ke 1080x1920
export function render(t) {
  drawFrame(offCtx, t);
  ctx.drawImage(offCv, 0, 0, DISPLAY_W, DISPLAY_H);
}

// Hook API untuk Playwright Headless Renderer
window.__ve = {
  ready: true,
  error: null,
  width: DISPLAY_W,
  height: DISPLAY_H,
  fps: FPS,
  duration: DURATION,
  still(t) {
    render(t);
    return 1;
  },
  async push(i, url) {
    render(i / FPS);
    const d = ctx.getImageData(0, 0, DISPLAY_W, DISPLAY_H).data;
    const r = await fetch(url, {
      method: 'POST',
      body: d,
      headers: {
        'content-type': 'application/octet-stream',
        'x-frame': String(i),
      },
    });
    if (!r.ok) throw new Error('frame sink rejected frame ' + i);
    return 1;
  },
  png() {
    return cv.toDataURL('image/png');
  },
};

// -------------------------------------------------------------
// Interactive Preview Player UI
// -------------------------------------------------------------
const Q = new URLSearchParams(location.search);
const isExport = Q.has('export');

if (!isExport) {
  document.body.classList.add('preview');
  const playBtn = document.getElementById('play');
  const bar = document.getElementById('bar');
  const timeDisplay = document.getElementById('time');
  const s1Btn = document.getElementById('btn-s1');
  const s2Btn = document.getElementById('btn-s2');
  const s3Btn = document.getElementById('btn-s3');

  let curT = parseFloat(Q.get('t') ?? '0');
  let isPlaying = false;
  let lastTime = 0;
  let audioCtx = null;
  let audioBuffer = null;
  let audioSource = null;
  let audioStartTime = 0;

  async function loadAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
      const resp = await fetch('/out/audio.wav');
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
      }
    } catch (e) {
      console.warn('Audio belum siap atau tidak ditemukan, preview visual tetap berjalan:', e);
    }
  }

  function startAudioAt(t) {
    if (!audioCtx || !audioBuffer) return;
    try {
      if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      audioSource = audioCtx.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(audioCtx.destination);
      audioSource.start(0, t);
      audioStartTime = audioCtx.currentTime - t;
    } catch (e) {
      console.warn('Audio start error:', e);
    }
  }

  function stopAudio() {
    if (audioSource) {
      try { audioSource.stop(); } catch {}
      audioSource.disconnect();
      audioSource = null;
    }
  }

  function setTime(t) {
    curT = clamp(t, 0, DURATION);
    render(curT);
    bar.value = String(curT);
    timeDisplay.textContent = `${curT.toFixed(2)}s / ${DURATION.toFixed(1)}s (f:${Math.round(curT * FPS)})`;
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'Pause (Space)' : 'Play (Space)';
    if (isPlaying) {
      lastTime = performance.now();
      startAudioAt(curT);
      requestAnimationFrame(loop);
    } else {
      stopAudio();
    }
  }

  function loop(now) {
    if (!isPlaying) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    curT += dt;
    if (curT >= DURATION) {
      curT = 0;
      stopAudio();
      startAudioAt(0);
    }
    setTime(curT);
    requestAnimationFrame(loop);
  }

  playBtn.addEventListener('click', togglePlay);
  bar.addEventListener('input', (e) => {
    setTime(parseFloat(e.target.value));
    if (isPlaying) startAudioAt(curT);
  });

  s1Btn?.addEventListener('click', () => { setTime(0.0); if (isPlaying) startAudioAt(0); });
  s2Btn?.addEventListener('click', () => { setTime(4.0); if (isPlaying) startAudioAt(4); });
  s3Btn?.addEventListener('click', () => { setTime(8.0); if (isPlaying) startAudioAt(8); });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowLeft') {
      setTime(curT - 0.5);
      if (isPlaying) startAudioAt(curT);
    } else if (e.code === 'ArrowRight') {
      setTime(curT + 0.5);
      if (isPlaying) startAudioAt(curT);
    } else if (e.key === ',') {
      setTime(curT - 1 / FPS);
    } else if (e.key === '.') {
      setTime(curT + 1 / FPS);
    }
  });

  loadAudio().then(() => setTime(curT));
} else {
  // Mode export: langsung render t=0
  render(0);
}
