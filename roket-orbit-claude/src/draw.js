// drawFrame(t): fungsi murni. t dikunci ke frame, buffer ditulis ulang penuh tiap panggilan,
// tidak ada state yang terbawa antar frame -> seek ke detik mana pun hasilnya identik.

import { W, H, FPS, T } from './timeline.js';
import {
  cam, rocketPose, flameLength, shake,
  drawSky, drawStars, drawPlanet, drawSun, drawHills, drawGround, drawPad,
  drawVent, drawCloud, drawTrail, drawRocket, drawCountdown, drawMission,
} from './scenes.js';

const fb = new Uint8Array(W * H);

export function drawFrame(t) {
  const f = Math.round(t * FPS);
  t = f / FPS;
  const c = cam(t);
  const sh = shake(t, f);

  drawSky(fb, c);
  drawStars(fb, t, f, c);
  drawPlanet(fb, t);

  // dunia landasan; dilewati kalau sudah jauh di bawah layar
  if (c < H + 40) {
    drawSun(fb, c, sh);
    drawHills(fb, c, sh);
    drawGround(fb, c, sh);
    drawPad(fb, t, f, c, sh);
  }
  if (t >= T.liftoff) drawTrail(fb, t, c, sh);
  drawRocket(fb, rocketPose(t), flameLength(t, f), f, sh);
  if (c < H + 40) {
    drawCloud(fb, t, c, sh);
    drawVent(fb, t, c, sh);
  }

  drawCountdown(fb, t, f);
  drawMission(fb, t, f);
  return fb;
}
