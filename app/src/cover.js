// The cover engine: draws a multi-panel GTA-style poster cover onto a canvas
// at any size, from the editor state. Pure 2D canvas, no network, no libraries.

import { getLayout } from './layouts.js';
import { getGrade } from './grades.js';

let grainTile = null;

/** A small tile of random grey noise, reused as the grain pattern. */
function getGrainTile() {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 140;
  t.height = 140;
  const c = t.getContext('2d');
  const img = c.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 40);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  grainTile = t;
  return t;
}

/** Panel rectangles in pixels for a layout at cover size w x h. */
export function panelRects(w, h, layoutKey) {
  const layout = getLayout(layoutKey);
  const gap = Math.max(2, Math.round(w * 0.012));
  return layout.panels.map((p) => ({
    x: Math.round(p.x * w) + (p.x > 0 ? gap / 2 : 0),
    y: Math.round(p.y * h) + (p.y > 0 ? gap / 2 : 0),
    w: Math.round(p.w * w) - (p.x > 0 ? gap / 2 : 0) - (p.x + p.w < 1 ? gap / 2 : 0),
    h: Math.round(p.h * h) - (p.y > 0 ? gap / 2 : 0) - (p.y + p.h < 1 ? gap / 2 : 0),
    tilt: p.tilt ?? 0,
  }));
}

/** Which panel (if any) contains the point (fx, fy) in cover fractions. */
export function panelAt(state, fx, fy) {
  const rects = panelRects(1000, 1000, state.layout);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (fx * 1000 >= r.x && fx * 1000 <= r.x + r.w && fy * 1000 >= r.y && fy * 1000 <= r.y + r.h) return i;
  }
  return -1;
}

/** Draws one photo into a panel rect, cover-fit with zoom and pan offsets. */
function drawPhotoPanel(ctx, photo, rect, panelState, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!photo || !photo.img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3a2350');
    g.addColorStop(1, '#1c1026');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(14, Math.round(w * 0.045))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Add a photo', x + w / 2, y + h / 2);
  } else {
    const img = photo.img;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const zoom = panelState.zoom || 1;
    const base = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * base;
    const dh = ih * base;
    const dx = x + (w - dw) / 2 + (panelState.ox || 0) * w;
    const dy = y + (h - dh) / 2 + (panelState.oy || 0) * h;
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    for (const overlay of grade.overlays) {
      const og = ctx.createLinearGradient(x, y, x, y + h);
      for (const [stop, colour] of overlay.stops) og.addColorStop(stop, colour);
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = overlay.opacity;
      ctx.fillStyle = og;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.restore();
}

/** Draws the bottom title band: scrim, halftone edge, Anton title, Pacifico subtitle. */
function drawTitleBand(ctx, w, h, state) {
  const bandH = Math.round(h * 0.27);
  const bandY = h - bandH;
  const scrim = ctx.createLinearGradient(0, bandY - bandH * 0.55, 0, h);
  scrim.addColorStop(0, 'rgba(24,10,36,0)');
  scrim.addColorStop(0.45, 'rgba(24,10,36,0.55)');
  scrim.addColorStop(1, 'rgba(24,10,36,0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - bandH * 0.55, w, bandH * 1.55);

  // Halftone dots along the top edge of the band, kept inside the scrim so they
  // read as print texture rather than a divider across the photos.
  const dotR = Math.max(2, Math.round(w * 0.004));
  const step = dotR * 4;
  const colours = ['#ff5e3a', '#ff7ad9', '#12b5c9', '#ffb347'];
  for (let i = 0, cx = step; cx < w; i++, cx += step) {
    const r = dotR * (0.5 + 0.5 * Math.abs(Math.sin(i * 0.9)));
    ctx.fillStyle = colours[i % colours.length];
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(cx, bandY + bandH * 0.06, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = Math.round(h * 0.115);
    ctx.font = `${size}px Anton, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.02)}px`;
    while (ctx.measureText(title).width > w * 0.94 && size > 10) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    const baseline = bandY + bandH * 0.50;
    ctx.save();
    ctx.translate(w / 2, baseline);
    ctx.transform(1, 0, -0.05, 1, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,4,18,0.9)';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeText(title, 0, 0);
    if (state.titleGradient) {
      const tg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      tg.addColorStop(0, '#ffd166');
      tg.addColorStop(0.35, '#ff8c42');
      tg.addColorStop(0.7, '#ff5e8a');
      tg.addColorStop(1, '#c77dff');
      ctx.fillStyle = tg;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillText(title, 0, 0);
    ctx.restore();
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const size = Math.round(h * 0.038);
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff8fd6';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.25;
    ctx.fillText(subtitle, w / 2, bandY + bandH * 0.82);
    ctx.shadowBlur = 0;
  }
}

/** Draws the badge ribbon in the top corner. */
function drawBadge(ctx, w, h, state) {
  const text = (state.badge || '').trim().toUpperCase();
  if (!text) return;
  const size = Math.round(h * 0.026);
  ctx.font = `${size}px Anton, sans-serif`;
  const pad = Math.round(size * 0.9);
  const tw = ctx.measureText(text).width;
  const bw = tw + pad * 2;
  const bh = size * 1.9;
  const bx = w - bw - Math.round(w * 0.025);
  const by = Math.round(h * 0.022);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.round(h * 0.008);
  ctx.shadowOffsetY = Math.round(h * 0.004);
  const g = ctx.createLinearGradient(bx, by, bx + bw, by);
  g.addColorStop(0, '#ff5e3a');
  g.addColorStop(1, '#e0218a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + bw / 2, by + bh / 2 + size * 0.04);
}

/** Draws the whole cover onto `canvas` from the editor state. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = getGrade(state.grade);
  const layout = getLayout(state.layout);
  const rects = panelRects(w, h, state.layout);

  if (state.layout === 'snapshots') {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#ff9a3d');
    bg.addColorStop(0.5, '#ff5e3a');
    bg.addColorStop(1, '#7b2ff7');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }

  rects.forEach((rect, i) => {
    const panelState = state.panels[i] ?? { photo: null, zoom: 1, ox: 0, oy: 0 };
    const photo = panelState.photo == null ? null : state.photos[panelState.photo] ?? null;
    ctx.save();
    if (rect.tilt) {
      const frame = Math.round(w * 0.014);
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.tilt * Math.PI) / 180);
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = Math.round(w * 0.02);
      ctx.shadowOffsetY = Math.round(w * 0.008);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-rect.w / 2 - frame, -rect.h / 2 - frame, rect.w + frame * 2, rect.h + frame * 2);
      ctx.restore();
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.tilt * Math.PI) / 180);
      drawPhotoPanel(ctx, photo, { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h }, panelState, grade);
    } else {
      drawPhotoPanel(ctx, photo, rect, panelState, grade);
    }
    ctx.restore();
    if (rect.tilt) {
      // White frame edge highlight for the tilted print.
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.tilt * Math.PI) / 180);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(2, Math.round(w * 0.004));
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    }
  });

  drawTitleBand(ctx, w, h, state);
  drawBadge(ctx, w, h, state);

  // Grain + vignette finish.
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,18,0.30)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // Selected-panel outline (editor only, not on exports: exports call with state.selected = -1).
  if (typeof state.selected === 'number' && state.selected >= 0 && rects[state.selected]) {
    const r = rects[state.selected];
    ctx.save();
    ctx.strokeStyle = '#12b5c9';
    ctx.lineWidth = Math.max(3, Math.round(w * 0.006));
    ctx.setLineDash([Math.round(w * 0.02), Math.round(w * 0.01)]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.restore();
  }
}

/** Renders the cover at an export size and returns the canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, { ...state, selected: -1 });
  return canvas;
}
