// Colour grades: a sunset or neon wash drawn over each photo panel.
// Each grade is a filter for the photo plus one or two gradient overlays
// (stops are [offset, css colour]) blended with the 'overlay' composite.

// `filter` is a CSS filter string applied while the photo is drawn.
// `overlays` are vertical gradients painted over the photo afterwards.

export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    blurb: 'Orange dusk, pink sky',
    filter: 'saturate(1.25) contrast(1.08) brightness(1.02)',
    overlays: [
      { opacity: 0.5, stops: [[0, 'rgba(255,170,60,0.10)'], [0.55, 'rgba(255,94,58,0.28)'], [1, 'rgba(224,33,138,0.55)']] },
    ],
    swatch: 'linear-gradient(135deg,#ffb347,#ff5e3a 45%,#e0218a)',
  },
  neon: {
    name: 'Neon Nights',
    blurb: 'Pink and teal after dark',
    filter: 'saturate(1.45) contrast(1.12) brightness(0.98)',
    overlays: [
      { opacity: 0.55, stops: [[0, 'rgba(255,0,153,0.35)'], [0.5, 'rgba(120,40,220,0.18)'], [1, 'rgba(18,181,201,0.45)']] },
    ],
    swatch: 'linear-gradient(135deg,#ff0099,#7b2ff7 55%,#12b5c9)',
  },
  gold: {
    name: 'Palm Gold',
    blurb: 'Warm golden hour',
    filter: 'saturate(1.2) contrast(1.05) brightness(1.05) sepia(0.25)',
    overlays: [
      { opacity: 0.4, stops: [[0, 'rgba(255,214,120,0.30)'], [1, 'rgba(255,140,40,0.35)']] },
    ],
    swatch: 'linear-gradient(135deg,#ffe08a,#ffb347 55%,#ff8c28)',
  },
  noir: {
    name: 'Teal Noir',
    blurb: 'Moody, desaturated teal',
    filter: 'saturate(0.65) contrast(1.18) brightness(0.94)',
    overlays: [
      { opacity: 0.5, stops: [[0, 'rgba(20,60,90,0.35)'], [1, 'rgba(0,180,180,0.30)']] },
    ],
    swatch: 'linear-gradient(135deg,#123a4a,#0e7d8a 60%,#12b5c9)',
  },
  hotpink: {
    name: 'Hot Pink',
    blurb: 'Full magenta punch',
    filter: 'saturate(1.6) contrast(1.1) brightness(1.0)',
    overlays: [
      { opacity: 0.55, stops: [[0, 'rgba(255,80,180,0.35)'], [1, 'rgba(180,0,120,0.5)']] },
    ],
    swatch: 'linear-gradient(135deg,#ff7ad9,#e0218a 55%,#8a0055)',
  },
};

/** Returns the grade object for a key, falling back to sunset. */
export function getGrade(key) {
  return GRADES[key] ?? GRADES.sunset;
}
