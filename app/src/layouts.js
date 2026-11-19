// Panel layouts for the cover: each panel is a rectangle in cover fractions
// (x, y, w, h in 0..1), plus an optional tilt in degrees for the snapshot look.
// All layouts are original designs for this app.

export const LAYOUTS = {
  hero3: {
    name: 'Hero + 3',
    blurb: 'One big hero, three stacked',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 1.0 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.34 },
      { x: 0.62, y: 0.34, w: 0.38, h: 0.33 },
      { x: 0.62, y: 0.67, w: 0.38, h: 0.33 },
    ],
  },
  grid4: {
    name: 'Four Square',
    blurb: 'Classic 2 x 2 grid',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.5 },
      { x: 0.0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  fullbleed: {
    name: 'Full Bleed',
    blurb: 'One photo, edge to edge',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0 }],
  },
  grid9: {
    name: 'Nine Grid',
    blurb: 'A 3 x 3 contact sheet',
    panels: [
      { x: 0.0, y: 0.0, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 0.0, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 0.0, w: 1 / 3, h: 1 / 3 },
      { x: 0.0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 0.0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
  },
  snapshots: {
    name: 'Snapshots',
    blurb: 'Three tilted prints',
    panels: [
      { x: 0.06, y: 0.05, w: 0.42, h: 0.52, tilt: -4 },
      { x: 0.52, y: 0.08, w: 0.42, h: 0.52, tilt: 3 },
      { x: 0.28, y: 0.48, w: 0.44, h: 0.5, tilt: -1.5 },
    ],
  },
  duo: {
    name: 'Duo Split',
    blurb: 'Two tall halves',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 1.0 },
      { x: 0.5, y: 0.0, w: 0.5, h: 1.0 },
    ],
  },
};

/** Returns the layout object for a key, falling back to hero3. */
export function getLayout(key) {
  return LAYOUTS[key] ?? LAYOUTS.hero3;
}
