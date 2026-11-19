// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, full frame. Query params:
// photo (sample name), caption (title), subtitle, layout, grade, size.
// window.__shotReady is set once the scene is painted.

const SAMPLES = ['pier.jpg', 'boulevard.jpg'];

export async function runShot(shot, query, state, api) {
  const photoName = query.get('photo') ?? 'pier';
  const title = query.get('caption') ?? 'VICE COAST';
  const subtitle = query.get('subtitle') ?? 'one last ride';
  const layout = query.get('layout') ?? 'hero3';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';

  if (shot === 'cover') document.body.classList.add('shot-cover');

  state.title = title;
  state.subtitle = subtitle;
  state.layout = layout;
  state.grade = grade;
  state.size = size;

  // Load both samples so every layout has photos to fill.
  for (const name of SAMPLES) {
    if (state.photos.some((p) => p.name === name)) continue;
    const img = await api.loadImage(`samples/${name}`);
    state.photos.push({ img, url: `samples/${name}`, name });
  }
  const pierIdx = state.photos.findIndex((p) => p.name === `${photoName}.jpg`);
  const otherIdx = state.photos.findIndex((p) => p.name !== `${photoName}.jpg`);
  const { getLayout } = await import('./layouts.js');
  const count = getLayout(layout).panels.length;
  state.panels = Array.from({ length: count }, (_, i) => ({
    photo: i === 0 ? (pierIdx >= 0 ? pierIdx : 0) : (otherIdx >= 0 ? otherIdx : 0),
    zoom: 1,
    ox: 0,
    oy: 0,
  }));
  state.selected = shot === 'editor' ? 0 : -1;
  api.renderTray();
  api.redraw();
  try {
    await document.fonts.ready;
  } catch {
    // Fonts are local; if the ready promise fails, paint anyway.
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
