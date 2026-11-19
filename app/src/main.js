// Wires the editor: state, photo tray, layout/grade pickers, panel dragging,
// undo/redo, and PNG export in the three post sizes. Photos stay in memory;
// nothing is uploaded anywhere.

import { drawCover, panelAt, panelRects, renderCover } from './cover.js';
import { LAYOUTS, getLayout } from './layouts.js';
import { GRADES, getGrade } from './grades.js';
import { runShot } from './shots.js';

export const SIZES = {
  square: { name: 'Square', label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { name: 'Portrait', label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { name: 'Wide', label: '1920 x 1080', w: 1920, h: 1080 },
};

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const panelHint = document.getElementById('panel-hint');
const trayEl = document.getElementById('tray');

const state = {
  layout: 'hero3',
  grade: 'sunset',
  title: 'VICE COAST',
  subtitle: 'one last ride',
  badge: 'LEONIDA',
  titleGradient: true,
  size: 'square',
  photos: [], // { img, url, name }
  panels: [], // { photo: tray index | null, zoom, ox, oy } — one per layout panel
  selected: 0,
};

let pickedTray = -1;
const undoStack = [];
const redoStack = [];

function panelsFor(layoutKey) {
  return getLayout(layoutKey).panels.map(() => ({ photo: null, zoom: 1, ox: 0, oy: 0 }));
}

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, badge: state.badge, titleGradient: state.titleGradient,
    panels: state.panels, selected: state.selected,
  });
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  syncControls();
  redraw();
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
  syncUndoButtons();
}

function syncUndoButtons() {
  document.getElementById('undo').disabled = undoStack.length === 0;
  document.getElementById('redo').disabled = redoStack.length === 0;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function redraw() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  canvas.classList.toggle('tall', size.h > size.w);
  canvas.classList.toggle('wide', size.w > size.h);
  drawCover(canvas, state);
  const count = getLayout(state.layout).panels.length;
  panelHint.textContent = `Panel ${state.selected + 1} of ${count} selected — drag to move the photo, scroll to zoom`;
  const zoom = document.getElementById('zoom');
  zoom.value = String(state.panels[state.selected]?.zoom ?? 1);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  const idx = state.photos.length;
  state.photos.push({ img, url, name: file.name });
  renderTray();
  return idx;
}

function renderTray() {
  trayEl.innerHTML = '';
  if (state.photos.length === 0) {
    const span = document.createElement('span');
    span.className = 'empty';
    span.textContent = 'No photos yet — add one, or try the samples.';
    trayEl.appendChild(span);
    return;
  }
  state.photos.forEach((p, i) => {
    const thumb = document.createElement('img');
    thumb.src = p.url;
    thumb.alt = p.name;
    thumb.title = p.name;
    if (i === pickedTray) thumb.classList.add('picked');
    thumb.addEventListener('click', () => {
      pickedTray = i;
      renderTray();
      setStatus(`Photo ${i + 1} picked — click a panel to place it.`);
    });
    trayEl.appendChild(thumb);
  });
}

function assignPhotoToPanel(trayIndex, panelIndex) {
  pushUndo();
  state.panels[panelIndex].photo = trayIndex;
  state.panels[panelIndex].zoom = 1;
  state.panels[panelIndex].ox = 0;
  state.panels[panelIndex].oy = 0;
  state.selected = panelIndex;
  redraw();
}

function buildPickers() {
  const layoutsEl = document.getElementById('layouts');
  for (const [key, layout] of Object.entries(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('role', 'radio');
    btn.dataset.layout = key;
    const cols = Math.max(...layout.panels.map((p) => p.x + p.w)) > 0.99 && layout.panels.length > 2 ? 3 : 2;
    btn.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,#ffb347,#e0218a)"><span class="mini" style="grid-template-columns:repeat(${layout.panels.length > 4 ? 3 : 2},1fr)">${layout.panels.map(() => '<i></i>').join('')}</span></span><span>${layout.name}</span><small>${layout.blurb}</small>`;
    btn.addEventListener('click', () => {
      if (state.layout === key) return;
      pushUndo();
      const oldPhotos = state.panels.map((p) => p.photo);
      state.layout = key;
      state.panels = panelsFor(key);
      state.panels.forEach((p, i) => { p.photo = oldPhotos[i] ?? oldPhotos[0] ?? null; });
      state.selected = 0;
      syncControls();
      redraw();
    });
    layoutsEl.appendChild(btn);
  }

  const gradesEl = document.getElementById('grades');
  for (const [key, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('role', 'radio');
    btn.dataset.grade = key;
    btn.innerHTML = `<span class="swatch" style="background:${grade.swatch}"></span><span>${grade.name}</span><small>${grade.blurb}</small>`;
    btn.addEventListener('click', () => {
      if (state.grade === key) return;
      pushUndo();
      state.grade = key;
      syncControls();
      redraw();
    });
    gradesEl.appendChild(btn);
  }

  const sizesEl = document.getElementById('sizes');
  for (const [key, size] of Object.entries(SIZES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('role', 'radio');
    btn.dataset.size = key;
    btn.innerHTML = `<span>${size.name}</span><small>${size.label}</small>`;
    btn.addEventListener('click', () => {
      state.size = key;
      syncControls();
      redraw();
    });
    sizesEl.appendChild(btn);
  }
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.layout === state.layout)));
  document.querySelectorAll('[data-grade]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.grade === state.grade)));
  document.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.size === state.size)));
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('title-gradient').checked = state.titleGradient;
}

function downloadCanvas(c, filename) {
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportSize(key) {
  const size = SIZES[key];
  const out = renderCover(state, size.w, size.h);
  const name = `vice-coast-cover-${size.w}x${size.h}.png`;
  await downloadCanvas(out, name);
  setStatus(`Saved ${name} (${size.w} x ${size.h}).`);
  return out;
}

// Exposed for automated testing: renders and returns a PNG data URL at a size.
window.__exportCover = async (key) => {
  const size = SIZES[key] ?? SIZES.square;
  const out = renderCover(state, size.w, size.h);
  return { w: size.w, h: size.h, dataUrl: out.toDataURL('image/png') };
};
window.__state = state;

function wireEvents() {
  document.getElementById('photos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    for (const file of files) await addPhotoFile(file);
    pickedTray = state.photos.length - 1;
    renderTray();
    if (state.panels.every((p) => p.photo == null)) {
      state.panels.forEach((p, i) => { p.photo = Math.min(i, state.photos.length - 1); });
    }
    redraw();
    setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded. Click a photo, then a panel, to place it.`);
    e.target.value = '';
  });

  document.getElementById('sample-photos').addEventListener('click', async () => {
    pushUndo();
    for (const name of ['pier.jpg', 'boulevard.jpg']) {
      if (state.photos.some((p) => p.name === name)) continue;
      const img = await loadImage(`samples/${name}`);
      state.photos.push({ img, url: `samples/${name}`, name });
    }
    state.panels.forEach((p, i) => { p.photo = i % state.photos.length; });
    pickedTray = 0;
    renderTray();
    redraw();
    setStatus('Sample photos loaded into the panels.');
  });

  document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  document.getElementById('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
  document.getElementById('title-gradient').addEventListener('change', (e) => { state.titleGradient = e.target.checked; redraw(); });

  document.getElementById('zoom').addEventListener('input', (e) => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('fit').addEventListener('click', () => {
    pushUndo();
    const panel = state.panels[state.selected];
    panel.zoom = 1; panel.ox = 0; panel.oy = 0;
    redraw();
  });

  document.getElementById('export').addEventListener('click', () => exportSize(state.size));
  document.getElementById('export-all').addEventListener('click', async () => {
    for (const key of Object.keys(SIZES)) await exportSize(key);
    setStatus('Saved all three sizes: 1080 x 1080, 1080 x 1350, 1920 x 1080.');
  });

  document.getElementById('undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    syncUndoButtons();
  });
  document.getElementById('redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    syncUndoButtons();
  });
  document.getElementById('shuffle').addEventListener('click', () => {
    pushUndo();
    const layoutKeys = Object.keys(LAYOUTS);
    const gradeKeys = Object.keys(GRADES);
    const oldPhotos = state.panels.map((p) => p.photo);
    state.layout = layoutKeys[Math.floor(Math.random() * layoutKeys.length)];
    state.grade = gradeKeys[Math.floor(Math.random() * gradeKeys.length)];
    state.panels = panelsFor(state.layout);
    state.panels.forEach((p, i) => { p.photo = oldPhotos[i % oldPhotos.length] ?? null; });
    state.selected = 0;
    syncControls();
    redraw();
    setStatus(`Surprise: ${getLayout(state.layout).name} layout with the ${getGrade(state.grade).name} grade.`);
  });
  document.getElementById('reset').addEventListener('click', () => {
    pushUndo();
    state.layout = 'hero3';
    state.grade = 'sunset';
    state.title = 'VICE COAST';
    state.subtitle = 'one last ride';
    state.badge = 'LEONIDA';
    state.titleGradient = true;
    state.panels = panelsFor('hero3');
    state.panels.forEach((p, i) => { p.photo = i % Math.max(1, state.photos.length); });
    state.selected = 0;
    syncControls();
    redraw();
  });

  // Panel picking, dragging and zooming on the preview canvas.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const idx = panelAt(state, fx, fy);
    if (idx < 0) return;
    canvas.setPointerCapture(e.pointerId);
    if (pickedTray >= 0 && state.panels[idx].photo !== pickedTray) {
      assignPhotoToPanel(pickedTray, idx);
      return;
    }
    state.selected = idx;
    drag = { x: e.clientX, y: e.clientY, ox: state.panels[idx].ox, oy: state.panels[idx].oy, moved: false };
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[state.selected];
    const dx = (e.clientX - drag.x) / rect.width;
    const dy = (e.clientY - drag.y) / rect.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.004) drag.moved = true;
    panel.ox = Math.max(-0.5, Math.min(0.5, drag.ox + dx));
    panel.oy = Math.max(-0.5, Math.min(0.5, drag.oy + dy));
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (drag?.moved) pushUndo();
    drag = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
    redraw();
  }, { passive: false });
}

state.panels = panelsFor(state.layout);
buildPickers();
wireEvents();
renderTray();
syncControls();
syncUndoButtons();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, { loadImage, assignPhotoToPanel, redraw, setStatus, renderTray });
} else {
  redraw();
}
