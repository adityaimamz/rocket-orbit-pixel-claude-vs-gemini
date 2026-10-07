// Buka index.html di Chromium headless lewat Playwright; dipakai render & check.
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

export async function openPage(port = 5199) {
  const server = await serve(port);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html?render`);
  await page.waitForFunction(() => typeof window.renderFrame === 'function');
  const close = async () => { await browser.close(); server.close(); };
  return { page, errors, close };
}
