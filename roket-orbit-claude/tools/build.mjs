// Pipeline lengkap: frame (Playwright) -> audio -> ffmpeg -> out/roket-orbit-claude.mp4
// `node tools/build.mjs`          render ulang semua
// `node tools/build.mjs --mux`    hanya gabung ulang frame + audio yang sudah ada
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, DURATION, FRAMES } from '../src/timeline.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
const OUT = 'out/roket-orbit-claude.mp4';

if (!process.argv.includes('--mux')) {
  run('node', ['tools/render.mjs']);
  run('node', ['tools/audio.mjs']);
}

run('ffmpeg', [
  '-y', '-loglevel', 'error', '-stats',
  '-framerate', String(FPS), '-i', 'out/frames/f%04d.png',
  '-i', 'out/audio.wav',
  // frame sudah 1080x1920 (diperbesar nearest-neighbor di kanvas); scale di sini hanya pengaman
  '-vf', 'scale=1080:1920:flags=neighbor,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-tune', 'animation',
  '-r', String(FPS), '-frames:v', String(FRAMES),
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
  '-t', String(DURATION), '-movflags', '+faststart',
  OUT,
]);

// laporan singkat
const probe = execFileSync('ffprobe', [
  '-v', 'error', '-count_frames', '-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,sample_rate,channels:format=duration',
  '-of', 'compact', OUT,
], { cwd: ROOT }).toString();
console.log(probe.trim());
console.log(`-> ${OUT}`);
