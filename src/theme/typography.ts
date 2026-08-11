// Two families only: Fraunces (display, serif) + Inter (body, sans).
// Use these exact keys everywhere. Do not add ad-hoc font styles.
export const typography = {
  // Display — Fraunces serif
  display: { fontFamily: 'Fraunces-Medium', fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  h1: { fontFamily: 'Fraunces-Medium', fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontFamily: 'Fraunces-Medium', fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h3: { fontFamily: 'Fraunces-Medium', fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  // Body — Inter sans
  body: { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: 'Inter-Medium', fontSize: 15, lineHeight: 22 },
  small: { fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 18 },
  // Eyebrows and uppercase labels
  eyebrow: { fontFamily: 'Inter-Medium', fontSize: 11, lineHeight: 14, letterSpacing: 1.8, textTransform: 'uppercase' as const },
  caption: { fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 16 },
} as const;

export type TypographyKey = keyof typeof typography;
