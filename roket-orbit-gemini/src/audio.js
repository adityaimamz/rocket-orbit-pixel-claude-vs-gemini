// audio.js — Sintesis audio prosedural murni kode (BGM Chiptune + SFX Peluncuran)
// Menghasilkan file audio WAV stereo 48 kHz / 16-bit tanpa file aset eksternal.

const SAMPLE_RATE = 48000;
const DURATION = 12.0;
const NUM_SAMPLES = Math.round(SAMPLE_RATE * DURATION);

// Konversi frekuensi not nada musik (A4 = 440 Hz)
const MIDI_NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, E6: 1318.51, G6: 1567.98, A6: 1760.00, C7: 2093.00,
};

// Generator noise putih deterministik
function noise(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

// Bentuk gelombang dasar
function squareWave(phase) {
  return (phase % 1.0) < 0.5 ? 0.7 : -0.7;
}

function triangleWave(phase) {
  const p = phase % 1.0;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}

function sineWave(phase) {
  return Math.sin(phase * Math.PI * 2);
}

// Sintesis seluruh track suara (BGM + SFX)
export function generateAudio() {
  const left = new Float32Array(NUM_SAMPLES);
  const right = new Float32Array(NUM_SAMPLES);

  // -------------------------------------------------------------
  // 1. SOUND EFFECTS (SFX)
  // -------------------------------------------------------------
  // Countdown Beeps: 0.0s (3), 1.0s (2), 2.0s (1), 3.0s (IGNITION)
  const beeps = [
    { t: 0.0, freq: 440, dur: 0.12, vol: 0.35 },
    { t: 1.0, freq: 440, dur: 0.12, vol: 0.35 },
    { t: 2.0, freq: 440, dur: 0.12, vol: 0.35 },
    { t: 3.0, freq: 880, dur: 0.18, vol: 0.45 },
  ];

  for (const b of beeps) {
    const startIdx = Math.round(b.t * SAMPLE_RATE);
    const len = Math.round(b.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= NUM_SAMPLES) break;
      const sT = i / SAMPLE_RATE;
      const env = Math.exp(-sT * 22); // Fast decay
      const val = squareWave(sT * b.freq) * b.vol * env;
      left[idx] += val;
      right[idx] += val;
    }
  }

  // Typewriter Bleeps saat "MISSION START" diketik (9.0s – 10.4s)
  // 13 karakter diketik
  for (let c = 0; c < 13; c++) {
    const typeT = 9.0 + (c / 13) * 1.4;
    const startIdx = Math.round(typeT * SAMPLE_RATE);
    const len = Math.round(0.04 * SAMPLE_RATE);
    const freq = 1200 + (c % 4) * 150;
    for (let i = 0; i < len; i++) {
      const idx = startIdx + i;
      if (idx >= NUM_SAMPLES) break;
      const sT = i / SAMPLE_RATE;
      const env = Math.exp(-sT * 80);
      const click = (triangleWave(sT * freq) * 0.7 + noise(idx) * 0.3) * 0.22 * env;
      left[idx] += click;
      right[idx] += click;
    }
  }

  // Gemuruh Roket & Deru Pendorong (3.0s – 8.2s)
  // Dimulai saat ignition (3.0s), memuncak saat lepas landas (4.0s-6.5s), padam di 8.0s
  let lowpassL = 0;
  let lowpassR = 0;
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    if (t >= 3.0 && t <= 8.2) {
      let amp = 0;
      if (t < 4.0) {
        amp = (t - 3.0) * 0.4; // Bangkit saat ignition
      } else if (t < 7.5) {
        amp = 0.45 + Math.sin((t - 4.0) * 0.5) * 0.1; // Deru penuh
      } else {
        amp = 0.55 * (1 - (t - 7.5) / 0.7); // Fade out saat MECO
      }

      // Derau pendorong difilter frekuensi rendah (Heavy bass rumble)
      const rawNoise = noise(i * 1.7);
      const sub = Math.sin(t * 52 * Math.PI * 2) * 0.4; // 52 Hz sub rumble
      const target = (rawNoise * 0.7 + sub) * amp;

      // Filter satu kutub sederhana
      lowpassL += (target - lowpassL) * 0.12;
      lowpassR += (target - lowpassR) * 0.12;

      left[i] += lowpassL;
      right[i] += lowpassR;
    }
  }

  // -------------------------------------------------------------
  // 2. MUSIK LATAR (BGM CHIPTUNE RETRO)
  // 120 BPM -> 1 beat = 0.5s. 12 detik = 24 beat total.
  // -------------------------------------------------------------
  const BEAT_DUR = 0.5;

  // Chord progression:
  // Bagian 1 (0-4s): C - G - Am - F (Atmospheric pulse arpeggio)
  // Bagian 2 (4-8s): C - G - Am - F (Driving theme melody + drums)
  // Bagian 3 (8-12s): C - Em - F - C (Triumphant space resolve)
  const BASS_LINE = [
    // 0.0 - 4.0s (S1: Pad countdown)
    MIDI_NOTES.C3, MIDI_NOTES.C3, MIDI_NOTES.G3, MIDI_NOTES.G3,
    MIDI_NOTES.A3, MIDI_NOTES.A3, MIDI_NOTES.F3, MIDI_NOTES.G3,
    // 4.0 - 8.0s (S2: Liftoff & Ascent)
    MIDI_NOTES.C3, MIDI_NOTES.E3, MIDI_NOTES.G3, MIDI_NOTES.G3,
    MIDI_NOTES.A3, MIDI_NOTES.C4, MIDI_NOTES.F3, MIDI_NOTES.G3,
    // 8.0 - 12.0s (S3: Orbit)
    MIDI_NOTES.C3, MIDI_NOTES.G3, MIDI_NOTES.A3, MIDI_NOTES.E3,
    MIDI_NOTES.F3, MIDI_NOTES.G3, MIDI_NOTES.C4, MIDI_NOTES.C4,
  ];

  // Rendisi Bassline
  for (let b = 0; b < BASS_LINE.length; b++) {
    const freq = BASS_LINE[b];
    const startIdx = Math.round(b * BEAT_DUR * SAMPLE_RATE);
    const beatLen = Math.round(BEAT_DUR * SAMPLE_RATE);
    for (let i = 0; i < beatLen; i++) {
      const idx = startIdx + i;
      if (idx >= NUM_SAMPLES) break;
      const tInBeat = i / SAMPLE_RATE;
      const env = Math.exp(-tInBeat * 3.5);
      const bass = triangleWave(tInBeat * freq) * 0.22 * env;
      left[idx] += bass;
      right[idx] += bass;
    }
  }

  // Melodi & Arpeggio (16th notes = 0.125 detik per nada)
  const STEP_DUR = 0.125;
  const TOTAL_STEPS = Math.round(DURATION / STEP_DUR); // 96 langkah

  // Melodi lead chiptune
  const MELODY_NOTES = [
    // 0-4s: Pulse arpeggio lembut
    MIDI_NOTES.C4, MIDI_NOTES.E4, MIDI_NOTES.G4, MIDI_NOTES.C5,
    MIDI_NOTES.G4, MIDI_NOTES.B4, MIDI_NOTES.D5, MIDI_NOTES.G5,
    MIDI_NOTES.A4, MIDI_NOTES.C5, MIDI_NOTES.E5, MIDI_NOTES.A5,
    MIDI_NOTES.F4, MIDI_NOTES.A4, MIDI_NOTES.C5, MIDI_NOTES.F5,
    MIDI_NOTES.C4, MIDI_NOTES.E4, MIDI_NOTES.G4, MIDI_NOTES.C5,
    MIDI_NOTES.G4, MIDI_NOTES.B4, MIDI_NOTES.D5, MIDI_NOTES.G5,
    MIDI_NOTES.A4, MIDI_NOTES.C5, MIDI_NOTES.E5, MIDI_NOTES.A5,
    MIDI_NOTES.F4, MIDI_NOTES.G4, MIDI_NOTES.A4, MIDI_NOTES.B4,

    // 4-8s: Melodi Lepas Landas Dinamis (Naik penuh energi)
    MIDI_NOTES.C5, MIDI_NOTES.C5, MIDI_NOTES.E5, MIDI_NOTES.G5,
    MIDI_NOTES.G5, MIDI_NOTES.F5, MIDI_NOTES.E5, MIDI_NOTES.D5,
    MIDI_NOTES.E5, MIDI_NOTES.G5, MIDI_NOTES.C6, MIDI_NOTES.G5,
    MIDI_NOTES.A5, MIDI_NOTES.G5, MIDI_NOTES.F5, MIDI_NOTES.G5,
    MIDI_NOTES.C5, MIDI_NOTES.E5, MIDI_NOTES.G5, MIDI_NOTES.C6,
    MIDI_NOTES.D6, MIDI_NOTES.C6, MIDI_NOTES.B5, MIDI_NOTES.A5,
    MIDI_NOTES.G5, MIDI_NOTES.A5, MIDI_NOTES.B5, MIDI_NOTES.C6,
    MIDI_NOTES.D6, MIDI_NOTES.E6, MIDI_NOTES.D6, MIDI_NOTES.C6,

    // 8-12s: Tema Luar Angkasa Agung & Tenang (Space Lullaby / Fanfare)
    MIDI_NOTES.C6, null, MIDI_NOTES.G5, null,
    MIDI_NOTES.E5, null, MIDI_NOTES.G5, null,
    MIDI_NOTES.A5, null, MIDI_NOTES.E5, null,
    MIDI_NOTES.C6, null, MIDI_NOTES.A5, null,
    MIDI_NOTES.F5, null, MIDI_NOTES.G5, null,
    MIDI_NOTES.A5, null, MIDI_NOTES.B5, null,
    MIDI_NOTES.C6, null, null, null,
    null, null, null, null,
  ];

  for (let s = 0; s < TOTAL_STEPS; s++) {
    const note = MELODY_NOTES[s];
    if (!note) continue;
    const startIdx = Math.round(s * STEP_DUR * SAMPLE_RATE);
    const stepLen = Math.round(STEP_DUR * SAMPLE_RATE);
    const isLeadSection = s >= 32; // Mulai detik 4.0

    for (let i = 0; i < stepLen * 2; i++) {
      const idx = startIdx + i;
      if (idx >= NUM_SAMPLES) break;
      const tInStep = i / SAMPLE_RATE;
      const env = Math.exp(-tInStep * (isLeadSection ? 5.0 : 8.0));
      const pulse = squareWave(tInStep * note) * (isLeadSection ? 0.16 : 0.10) * env;

      // Stereo spread lembut
      left[idx] += pulse * 0.9;
      right[idx] += pulse * 1.1;

      // Echo / delay 0.18s
      const delayIdx = idx + Math.round(0.18 * SAMPLE_RATE);
      if (delayIdx < NUM_SAMPLES) {
        left[delayIdx] += pulse * 0.28;
        right[delayIdx] += pulse * 0.22;
      }
    }
  }

  // Drum Chiptune (Kick & Snare sederhana)
  // Kick di setiap beat 1 & 3; Snare di beat 2 & 4 selama adegan lepas landas (4s – 8s)
  for (let b = 8; b < 16; b++) {
    const beatTime = b * BEAT_DUR;
    const startIdx = Math.round(beatTime * SAMPLE_RATE);

    if (b % 2 === 0) {
      // Kick drum (pitch drop sine)
      const len = Math.round(0.15 * SAMPLE_RATE);
      for (let i = 0; i < len; i++) {
        const idx = startIdx + i;
        if (idx >= NUM_SAMPLES) break;
        const sT = i / SAMPLE_RATE;
        const freq = 140 * Math.exp(-sT * 35);
        const env = Math.exp(-sT * 20);
        const kick = Math.sin(sT * freq * Math.PI * 2) * 0.35 * env;
        left[idx] += kick;
        right[idx] += kick;
      }
    } else {
      // Snare drum (noise burst)
      const len = Math.round(0.12 * SAMPLE_RATE);
      for (let i = 0; i < len; i++) {
        const idx = startIdx + i;
        if (idx >= NUM_SAMPLES) break;
        const sT = i / SAMPLE_RATE;
        const env = Math.exp(-sT * 25);
        const snare = noise(idx) * 0.22 * env;
        left[idx] += snare;
        right[idx] += snare;
      }
    }
  }

  // Soft Limiter / Clamping untuk mencegah distorsi kliping
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] = Math.tanh(left[i] * 0.9);
    right[i] = Math.tanh(right[i] * 0.9);
  }

  return { left, right, sampleRate: SAMPLE_RATE, duration: DURATION };
}

// Konversi ke format biner WAV PCM 16-bit
export function toWav({ left, right, sampleRate = 48000 }) {
  const numSamples = left.length;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // Subchunk 1: "fmt "
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);             // Subchunk1Size (16 untuk PCM)
  buffer.writeUInt16LE(1, 20);              // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);    // NumChannels (2)
  buffer.writeUInt32LE(sampleRate, 24);     // SampleRate (48000)
  buffer.writeUInt32LE(byteRate, 28);       // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);     // BlockAlign
  buffer.writeUInt16LE(16, 34);             // BitsPerSample

  // Subchunk 2: "data"
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Tulis sampel PCM 16-bit
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Left
    let sL = Math.max(-1, Math.min(1, left[i]));
    const intL = sL < 0 ? Math.round(sL * 32768) : Math.round(sL * 32767);
    buffer.writeInt16LE(intL, offset);
    offset += 2;

    // Right
    let sR = Math.max(-1, Math.min(1, right[i]));
    const intR = sR < 0 ? Math.round(sR * 32768) : Math.round(sR * 32767);
    buffer.writeInt16LE(intR, offset);
    offset += 2;
  }

  return buffer;
}
