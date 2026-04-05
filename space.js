const canvas = document.getElementById("space-background");
const ctx = canvas.getContext("2d", { alpha: false });

let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

let starsFar = [];
let starsMid = [];
let starsNear = [];
let dustMotes = [];
let comets = [];
let nebulaFields = [];
let glowClouds = [];

let frame = 0;
let cometClock = 0;

const CONFIG = {
  starCounts: {
    far: 160,
    mid: 90,
    near: 45
  },
  dustCount: 110,
  nebulaCount: 3,
  cometChanceFrames: 900,
  maxComets: 1
};

// ===== Utilities =====
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// ===== Resize =====
function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createScene();
}

window.addEventListener("resize", resizeCanvas);

// ===== Background Composition =====
function createScene() {
  createStars();
  createNebula();
  comets = [];
}

// ===== Stars =====
function makeStar(depth) {
  let radius;
  let alphaMin;
  let alphaMax;
  let drift;
  let twinkleSpeed;

  if (depth === "far") {
    radius = rand(0.35, 0.95);
    alphaMin = 0.18;
    alphaMax = 0.55;
    drift = rand(0.002, 0.01);
    twinkleSpeed = rand(0.006, 0.02);
  } else if (depth === "mid") {
    radius = rand(0.6, 1.4);
    alphaMin = 0.28;
    alphaMax = 0.75;
    drift = rand(0.004, 0.018);
    twinkleSpeed = rand(0.01, 0.03);
  } else {
    radius = rand(0.9, 1.9);
    alphaMin = 0.45;
    alphaMax = 0.95;
    drift = rand(0.008, 0.03);
    twinkleSpeed = rand(0.015, 0.04);
  }

  return {
    x: Math.random() * w,
    y: Math.random() * h,
    baseRadius: radius,
    radius,
    alphaMin,
    alphaMax,
    alpha: rand(alphaMin, alphaMax),
    twinklePhase: rand(0, Math.PI * 2),
    twinkleSpeed,
    driftX: rand(-drift, drift),
    driftY: rand(-drift, drift),
    hue: rand(205, 225),
    tempShift: Math.random() < 0.14 ? rand(-12, 10) : 0
  };
}

function createStars() {
  starsFar = Array.from({ length: CONFIG.starCounts.far }, () => makeStar("far"));
  starsMid = Array.from({ length: CONFIG.starCounts.mid }, () => makeStar("mid"));
  starsNear = Array.from({ length: CONFIG.starCounts.near }, () => makeStar("near"));
}

function updateStar(star, layerSpeed) {
  star.x += star.driftX * layerSpeed;
  star.y += star.driftY * layerSpeed;

  if (star.x < -4) star.x = w + 4;
  if (star.x > w + 4) star.x = -4;
  if (star.y < -4) star.y = h + 4;
  if (star.y > h + 4) star.y = -4;

  const t = (Math.sin(frame * star.twinkleSpeed + star.twinklePhase) + 1) * 0.5;
  star.alpha = lerp(star.alphaMin, star.alphaMax, t);
  star.radius = star.baseRadius * (0.92 + t * 0.16);
}

function drawStar(star, glowFactor = 1) {
  const hue = star.hue + star.tempShift;
  
  if (star.radius > 1.2) {
    const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 6);
    glow.addColorStop(0, `hsla(${hue}, 85%, 88%, ${star.alpha * 0.14 * glowFactor})`);
    glow.addColorStop(0.35, `hsla(${hue}, 70%, 78%, ${star.alpha * 0.05 * glowFactor})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.fillStyle = glow;
    ctx.arc(star.x, star.y, star.radius * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue}, 70%, 92%, ${star.alpha})`;
  ctx.fill();
}

// ===== Dust / Tiny particulate field =====
function createDust() {
  dustMotes = [];

  for (let i = 0; i < CONFIG.dustCount; i++) {
    dustMotes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(8, 26),
      alpha: rand(0.008, 0.026),
      vx: rand(-0.01, 0.01),
      vy: rand(-0.008, 0.008)
    });
  }
}

function updateDust() {
  for (const d of dustMotes) {
    d.x += d.vx;
    d.y += d.vy;

    if (d.x < -40) d.x = w + 40;
    if (d.x > w + 40) d.x = -40;
    if (d.y < -40) d.y = h + 40;
    if (d.y > h + 40) d.y = -40;
  }
}

function drawDust() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const d of dustMotes) {
    const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
    g.addColorStop(0, `rgba(210,225,255,${d.alpha})`);
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ===== Nebula / Galactic Structure =====
function createNebula() {
  nebulaFields = [];
  glowClouds = [];

  const bandAngle = rand(-0.38, -0.15);
  const centerX = w * rand(0.35, 0.65);
  const centerY = h * rand(0.3, 0.7);

  // broad galactic band pieces
  for (let i = 0; i < CONFIG.nebulaCount; i++) {
    const t = i / Math.max(CONFIG.nebulaCount - 1, 1);
    const spread = rand(180, 320);

    nebulaFields.push({
      x: centerX + Math.cos(bandAngle) * lerp(-w * 0.22, w * 0.22, t) + rand(-60, 60),
      y: centerY + Math.sin(bandAngle) * lerp(-w * 0.22, w * 0.22, t) + rand(-50, 50),
      rx: rand(w * 0.22, w * 0.36),
      ry: rand(h * 0.12, h * 0.2),
      angle: bandAngle + rand(-0.08, 0.08),
      hueA: rand(214, 228),
      hueB: rand(245, 265),
      alphaA: rand(0.02, 0.04),
      alphaB: rand(0.012, 0.028),
      driftX: rand(-0.003, 0.003),
      driftY: rand(-0.003, 0.003),
      texture: Array.from({ length: 18 }, () => ({
        ox: rand(-spread, spread),
        oy: rand(-spread * 0.45, spread * 0.45),
        r: rand(80, 220),
        alpha: rand(0.004, 0.018),
        hue: Math.random() < 0.6 ? rand(215, 230) : rand(245, 265)
      }))
    });
  }

  // subtle color clouds
  const accentCount = 5;
  for (let i = 0; i < accentCount; i++) {
    glowClouds.push({
      x: rand(w * 0.12, w * 0.88),
      y: rand(h * 0.12, h * 0.88),
      r: rand(180, 340),
      hue: Math.random() < 0.65 ? rand(220, 235) : rand(252, 270),
      alpha: rand(0.006, 0.016),
      driftX: rand(-0.004, 0.004),
      driftY: rand(-0.003, 0.003)
    });
  }
}

function updateNebula() {
  for (const n of nebulaFields) {
    n.x += n.driftX;
    n.y += n.driftY;

    if (n.x < -n.rx * 1.5) n.x = w + n.rx * 1.5;
    if (n.x > w + n.rx * 1.5) n.x = -n.rx * 1.5;
    if (n.y < -n.ry * 1.5) n.y = h + n.ry * 1.5;
    if (n.y > h + n.ry * 1.5) n.y = -n.ry * 1.5;
  }

  for (const g of glowClouds) {
    g.x += g.driftX;
    g.y += g.driftY;

    if (g.x < -g.r) g.x = w + g.r;
    if (g.x > w + g.r) g.x = -g.r;
    if (g.y < -g.r) g.y = h + g.r;
    if (g.y > h + g.r) g.y = -g.r;
  }
}

function drawSoftEllipse(x, y, rx, ry, angle, colorStops) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(rx, ry);

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const stop of colorStops) {
    g.addColorStop(stop.offset, stop.color);
  }

  ctx.beginPath();
  ctx.fillStyle = g;
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNebula() {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // broad galactic band
  for (const n of nebulaFields) {
    drawSoftEllipse(n.x, n.y, n.rx, n.ry, n.angle, [
      { offset: 0, color: `hsla(${n.hueA}, 55%, 68%, ${n.alphaA})` },
      { offset: 0.5, color: `hsla(${n.hueB}, 38%, 54%, ${n.alphaB})` },
      { offset: 1, color: "rgba(0,0,0,0)" }
    ]);

    drawSoftEllipse(
      n.x + Math.cos(n.angle) * n.rx * 0.15,
      n.y + Math.sin(n.angle) * n.rx * 0.15,
      n.rx * 0.7,
      n.ry * 0.55,
      n.angle + 0.04,
      [
        { offset: 0, color: `hsla(${n.hueB}, 42%, 56%, ${n.alphaB * 0.85})` },
        { offset: 0.6, color: `hsla(${n.hueA}, 28%, 44%, ${n.alphaA * 0.35})` },
        { offset: 1, color: "rgba(0,0,0,0)" }
      ]
    );

    for (const p of n.texture) {
      const px = n.x + p.ox * Math.cos(n.angle) - p.oy * Math.sin(n.angle);
      const py = n.y + p.ox * Math.sin(n.angle) + p.oy * Math.cos(n.angle);

      const g = ctx.createRadialGradient(px, py, 0, px, py, p.r);
      g.addColorStop(0, `hsla(${p.hue}, 40%, 62%, ${p.alpha})`);
      g.addColorStop(0.55, `hsla(${p.hue}, 25%, 45%, ${p.alpha * 0.55})`);
      g.addColorStop(1, "rgba(0,0,0,0)");

      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // restrained accent glows
  for (const gCloud of glowClouds) {
    const g = ctx.createRadialGradient(gCloud.x, gCloud.y, 0, gCloud.x, gCloud.y, gCloud.r);
    g.addColorStop(0, `hsla(${gCloud.hue}, 55%, 62%, ${gCloud.alpha})`);
    g.addColorStop(0.55, `hsla(${gCloud.hue}, 38%, 46%, ${gCloud.alpha * 0.45})`);
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(gCloud.x, gCloud.y, gCloud.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ===== Comets =====
function spawnComet() {
  const mode = Math.floor(Math.random() * 3);

  let x, y, angle;

  if (mode === 0) {
    x = -160;
    y = rand(h * 0.06, h * 0.74);
    angle = rand(-0.08, 0.08);
  } else if (mode === 1) {
    x = rand(w * 0.14, w * 0.72);
    y = -160;
    angle = rand(Math.PI * 0.34, Math.PI * 0.42);
  } else {
    x = -160;
    y = rand(-40, h * 0.28);
    angle = rand(0.2, 0.3);
  }

  const speed = rand(2.0, 2.8);

  comets.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    headRadius: rand(1.15, 1.8),
    coreRadius: rand(0.4, 0.7),
    pulsePhase: rand(0, Math.PI * 2),
    pulseSpeed: rand(0.025, 0.05),
    trail: []
  });
}

function updateComets() {
  cometClock++;

  if (
    comets.length < CONFIG.maxComets &&
    cometClock % CONFIG.cometChanceFrames === 0 &&
    Math.random() < 0.72
  ) {
    spawnComet();
  }

  for (let i = comets.length - 1; i >= 0; i--) {
    const c = comets[i];

    // nearly straight motion, tiny natural drift
    const mag = Math.hypot(c.vx, c.vy);
    const px = -c.vy / mag;
    const py = c.vx / mag;
    const drift = (Math.random() - 0.5) * 0.0012;

    c.vx += px * drift;
    c.vy += py * drift;

    const newMag = Math.hypot(c.vx, c.vy);
    c.vx = (c.vx / newMag) * c.speed;
    c.vy = (c.vy / newMag) * c.speed;

    c.x += c.vx;
    c.y += c.vy;

    c.trail.push({
      x: c.x,
      y: c.y,
      alpha: 1,
      spread: rand(-1, 1)
    });

    for (let j = c.trail.length - 1; j >= 0; j--) {
      c.trail[j].alpha *= 0.973;
      if (c.trail[j].alpha < 0.014) {
        c.trail.splice(j, 1);
      }
    }

    const offscreen =
      c.x > w + 220 ||
      c.y > h + 220 ||
      c.x < -220 ||
      c.y < -220;

    if (offscreen && c.trail.length < 3) {
      comets.splice(i, 1);
    }
  }
}

function drawComet(c) {
  if (c.trail.length < 2) return;

  const mag = Math.hypot(c.vx, c.vy);
  const dx = c.vx / mag;
  const dy = c.vy / mag;
  const px = -dy;
  const py = dx;

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // soft tail haze
  for (let i = 1; i < c.trail.length; i++) {
    const p1 = c.trail[i - 1];
    const p2 = c.trail[i];
    const t = i / c.trail.length;
    const spread1 = (1 - t) * 2.4 * p1.spread;
    const spread2 = (1 - t) * 2.4 * p2.spread;

    ctx.beginPath();
    ctx.moveTo(p1.x + px * spread1, p1.y + py * spread1);
    ctx.lineTo(p2.x + px * spread2, p2.y + py * spread2);
    ctx.strokeStyle = `rgba(255,255,255,${p2.alpha * (0.005 + t * 0.022)})`;
    ctx.lineWidth = p2.alpha * lerp(4.2, 0.3, t);
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // main tail
  for (let i = 1; i < c.trail.length; i++) {
    const p1 = c.trail[i - 1];
    const p2 = c.trail[i];
    const t = i / c.trail.length;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = `rgba(255,255,255,${p2.alpha * (0.012 + t * 0.06)})`;
    ctx.lineWidth = p2.alpha * lerp(1.8, 0.14, t);
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // inner filament
  for (let i = 1; i < c.trail.length; i++) {
    const p1 = c.trail[i - 1];
    const p2 = c.trail[i];
    const t = i / c.trail.length;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = `rgba(255,255,255,${p2.alpha * (0.014 + t * 0.08)})`;
    ctx.lineWidth = p2.alpha * lerp(0.8, 0.05, t);
    ctx.lineCap = "round";
    ctx.stroke();
  }

  ctx.translate(c.x, c.y);
  ctx.rotate(Math.atan2(c.vy, c.vx));

  const pulse = 0.985 + Math.sin(frame * c.pulseSpeed + c.pulsePhase) * 0.018;

  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, c.headRadius * 4.4);
  glow.addColorStop(0, "rgba(255,255,255,0.075)");
  glow.addColorStop(0.5, "rgba(255,255,255,0.022)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();
  ctx.scale(1.3, 0.95);
  ctx.beginPath();
  ctx.fillStyle = glow;
  ctx.arc(0, 0, c.headRadius * 4.4 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const head = ctx.createRadialGradient(c.headRadius * 0.2, 0, 0, 0, 0, c.headRadius * 1.65);
  head.addColorStop(0, "rgba(255,255,255,0.96)");
  head.addColorStop(0.52, "rgba(255,255,255,0.38)");
  head.addColorStop(1, "rgba(255,255,255,0)");

  ctx.beginPath();
  ctx.fillStyle = head;
  ctx.arc(0, 0, c.headRadius * 1.65 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.arc(0, 0, c.coreRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ===== Base Background =====
function drawBaseBackground() {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "rgb(5, 8, 16)");
  bg.addColorStop(0.45, "rgb(3, 5, 11)");
  bg.addColorStop(1, "rgb(1, 2, 6)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // very subtle corner vignettes
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.12, w * 0.5, h * 0.45, Math.max(w, h) * 0.82);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // faint center lift
  const lift = ctx.createRadialGradient(w * 0.52, h * 0.46, 0, w * 0.52, h * 0.46, Math.max(w, h) * 0.72);
  lift.addColorStop(0, "rgba(25,35,65,0.085)");
  lift.addColorStop(0.45, "rgba(10,16,30,0.03)");
  lift.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = lift;
  ctx.fillRect(0, 0, w, h);
}

// ===== Animation =====
function animate() {
  frame++;

  drawBaseBackground();

  updateNebula();
  drawNebula();

  updateDust();
  drawDust();

  for (const s of starsFar) updateStar(s, 0.65);
  for (const s of starsMid) updateStar(s, 1);
  for (const s of starsNear) updateStar(s, 1.35);

  for (const s of starsFar) drawStar(s, 0.8);
  for (const s of starsMid) drawStar(s, 1);
  for (const s of starsNear) drawStar(s, 1.15);

  updateComets();
  for (const c of comets) drawComet(c);

  requestAnimationFrame(animate);
}

// ===== Init =====
resizeCanvas();
animate();