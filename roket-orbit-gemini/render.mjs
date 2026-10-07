#!/usr/bin/env node
// render.mjs — Offline renderer Playwright headless Chromium + ffmpeg
//   node render.mjs serve [--port 5173]               Live preview di browser
//   node render.mjs audio                             Sintesis musik & SFX (out/audio.wav)
//   node render.mjs stills                            Ekspor still per adegan ke out/stills/
//   node render.mjs check                             Cek determinisme f(t)
//   node render.mjs video [--out out/roket-orbit.mp4] Render MP4 30 fps 1080x1920

import http from 'node:http';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const mode = argv[0] ?? 'video';
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const hasFlag = (k) => argv.includes(`--${k}`);

const W = 1080, H = 1920, FPS = 30, DURATION = 12.0;
const TOTAL_FRAMES = 360;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.wav': 'audio/wav',
};

// ---------------------------------------------------------------- Server HTTP Mini
function startServer(port, onFrame) {
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'POST' && url.pathname === '/frame') {
      const chunks = [];
      for await (const ch of req) chunks.push(ch);
      try {
        await onFrame(Buffer.concat(chunks), +req.headers['x-frame']);
        res.writeHead(204).end();
      } catch (e) {
        res.writeHead(500).end(String(e));
      }
      return;
    }

    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, path.normalize(p));
    if (!fp.startsWith(ROOT)) return res.writeHead(403).end();

    try {
      const data = await readFile(fp);
      res.writeHead(200, {
        'content-type': MIME[path.extname(fp).toLowerCase()] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      }).end(data);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });

  return new Promise((ok) => srv.listen(port, '127.0.0.1', () => ok(srv)));
}

async function getChromium() {
  try {
    const m = await import('playwright');
    return m.chromium;
  } catch {
    // Fallback mencari playwright di proyek tetangga (vibe-engineer)
    const pPath = path.join(ROOT, '..', 'vibe-engineer', 'node_modules', 'playwright', 'index.mjs');
    const m = await import('file:///' + pPath.replace(/\\/g, '/'));
    return m.chromium;
  }
}

async function openPage(base) {
  const chromium = await getChromium();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: [
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--force-color-profile=srgb',
    ],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

  await page.goto(`${base}/index.html?export=1`);
  await page.waitForFunction(() => window.__ve?.ready || window.__ve?.error, null, { timeout: 30000 });
  const err = await page.evaluate(() => window.__ve.error);
  if (err) throw new Error(`App failed to boot: ${err}`);

  return { browser, page, logs };
}

// ---------------------------------------------------------------- Pembuatan Audio WAV
async function buildAudio(outFile) {
  const { generateAudio, toWav } = await import('./src/audio.js');
  const wavBuffer = toWav(generateAudio());
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, wavBuffer);
  return outFile;
}

// ---------------------------------------------------------------- MAIN
async function main() {
  const outDir = path.join(ROOT, 'out');
  await mkdir(outDir, { recursive: true });

  if (mode === 'serve') {
    const port = +opt('port', '5173');
    await startServer(port, async () => {});
    console.log(`\nPreview aktif: http://localhost:${port}/`);
    console.log(`Tekan Space untuk Play/Pause, gunakan slider untuk scrub timeline.`);
    return;
  }

  if (mode === 'audio') {
    const audioPath = path.resolve(opt('out', path.join(outDir, 'audio.wav')));
    console.log('Menyintesis audio (BGM chiptune + SFX roket)...');
    await buildAudio(audioPath);
    console.log(`Audio siap: ${audioPath}`);
    return;
  }

  // Siapkan audio default sebelum render still/video
  const defaultAudio = path.join(outDir, 'audio.wav');
  try {
    await readFile(defaultAudio);
  } catch {
    console.log('Audio belum ada, membuat out/audio.wav otomatis...');
    await buildAudio(defaultAudio);
  }

  let sink = async () => {};
  const srv = await startServer(0, (buf, i) => sink(buf, i));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const { browser, page, logs } = await openPage(base);

  try {
    if (mode === 'stills') {
      const stillsDir = path.resolve(opt('out', path.join(outDir, 'stills')));
      await mkdir(stillsDir, { recursive: true });

      const keyMoments = [
        { name: 'S1_01_countdown_3', t: 0.5 },
        { name: 'S1_02_countdown_1', t: 2.5 },
        { name: 'S1_03_ignition_smoke', t: 3.5 },
        { name: 'S2_01_liftoff', t: 4.5 },
        { name: 'S2_02_ascent_mach_cone', t: 6.2 },
        { name: 'S2_03_entering_space', t: 7.5 },
        { name: 'S3_01_orbit_insertion', t: 8.5 },
        { name: 'S3_02_mission_start_hud', t: 10.5 },
      ];

      console.log(`Mengekspor ${keyMoments.length} still visual ke ${stillsDir}...`);
      for (const m of keyMoments) {
        await page.evaluate((t) => window.__ve.still(t), m.t);
        const dataUrl = await page.evaluate(() => window.__ve.png());
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const targetFile = path.join(stillsDir, `${m.name}.png`);
        await writeFile(targetFile, Buffer.from(base64Data, 'base64'));
        console.log(`  ✓ ${m.name}.png (t = ${m.t.toFixed(1)}s)`);
      }
      console.log('Ekspor still selesai.');
      return;
    }

    if (mode === 'check') {
      console.log('Memeriksa determinisme render f(t)...');
      const testTimes = [0.5, 2.0, 3.8, 5.5, 7.2, 9.0, 11.0];
      let pass = true;

      for (const t of testTimes) {
        await page.evaluate((t) => window.__ve.still(t), t);
        const img1 = await page.evaluate(() => window.__ve.png());

        // Loncat ke waktu lain lalu kembali
        await page.evaluate(() => window.__ve.still(0.0));
        await page.evaluate((t) => window.__ve.still(t), t);
        const img2 = await page.evaluate(() => window.__ve.png());

        if (img1 !== img2) {
          console.error(`  ✗ Gagal determinisme pada t = ${t}s!`);
          pass = false;
        } else {
          console.log(`  ✓ t = ${t.toFixed(1)}s identik 100%`);
        }
      }

      if (pass) console.log('\nDeterminisme TERVERIFIKASI: Setiap frame murni fungsi matematika f(t).');
      return;
    }

    if (mode === 'video') {
      const outVideo = path.resolve(opt('out', path.join(outDir, 'roket-orbit.mp4')));
      console.log(`\nMemulai render video:`);
      console.log(`- Resolusi output: ${W}x${H}`);
      console.log(`- Framerate: ${FPS} fps (Total ${TOTAL_FRAMES} frame)`);
      console.log(`- Audio: ${defaultAudio}`);
      console.log(`- Target: ${outVideo}\n`);

      const ff = spawn('ffmpeg', [
        '-y',
        '-loglevel', 'error',
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        '-s', `${W}x${H}`,
        '-r', String(FPS),
        '-i', 'pipe:0',
        '-i', defaultAudio,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-tune', 'animation',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-movflags', '+faststart',
        outVideo,
      ], { stdio: ['pipe', 'inherit', 'inherit'] });

      const ffDone = new Promise((ok, bad) => {
        ff.on('close', (code) => (code === 0 ? ok() : bad(new Error(`ffmpeg exited with code ${code}`))));
      });

      let nextFrame = 0;
      sink = (buf, i) => new Promise((ok, bad) => {
        if (i !== nextFrame) return bad(new Error(`Frame out of order: expected ${nextFrame}, got ${i}`));
        if (buf.length !== W * H * 4) return bad(new Error(`Invalid frame buffer size: ${buf.length}`));
        nextFrame++;
        ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok);
      });

      const t0 = Date.now();
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        await page.evaluate(([i, u]) => window.__ve.push(i, u), [i, `${base}/frame`]);
        if ((i + 1) % 30 === 0 || i === TOTAL_FRAMES - 1) {
          const elapsed = (Date.now() - t0) / 1000;
          const fps = ((i + 1) / elapsed).toFixed(1);
          process.stdout.write(`\rRender frame: ${i + 1}/${TOTAL_FRAMES} (${fps} fps)`);
        }
      }

      ff.stdin.end();
      await ffDone;
      const totalElapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`\n\n✓ Render MP4 sukses! File: ${outVideo} (${totalElapsed} detik)`);
    }

    if (logs.length) console.warn('\nLog konsol browser:\n' + logs.join('\n'));
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch((err) => {
  console.error('\nError saat render:', err);
  process.exit(1);
});
