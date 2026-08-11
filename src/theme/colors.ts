// Kin brand palette. Every color used in the app must come from here.
export const colors = {
  plum: '#3D2337',        // primary ink, all text, all headers
  marigold: '#E8863A',    // accent, one-per-screen for the primary action
  papaya: '#F8EFE7',      // paper, page background
  cream: '#FEF7EE',       // elevated surfaces, cards
  moss: '#5F6D5A',        // success, growth, completed states
  blush: '#F5D9C4',       // gentle highlight
  warmGray: '#9A8879',    // secondary text, muted labels
  hairline: '#E5D8CB',    // borders, dividers
  clay: '#B4544A',        // error states, gentle alert
  ink80: 'rgba(61, 35, 55, 0.8)',
  ink60: 'rgba(61, 35, 55, 0.6)',
  ink40: 'rgba(61, 35, 55, 0.4)',
} as const;

export type ColorKey = keyof typeof colors;
