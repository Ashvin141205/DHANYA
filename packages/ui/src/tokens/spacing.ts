/**
 * Dhanya Official Design Tokens — Spacing, Radius, Shadows
 * Package: @dhanya/ui
 */

export const DHANYA_SPACING = {
  px1: '4px',
  px2: '8px',
  px3: '12px',
  px4: '16px',
  px5: '20px',
  px6: '24px',
  px8: '32px',
  px10: '40px',
  px12: '48px',
  px16: '64px',
  px20: '80px',
  px24: '96px',
  px30: '120px',
} as const;

export const DHANYA_RADIUS = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  pill: '9999px',
} as const;

export const DHANYA_SHADOWS = {
  none: 'none',
  subtle: '0 1px 2px 0 rgba(17, 26, 51, 0.04)',
  card: '0 2px 8px -2px rgba(17, 26, 51, 0.06), 0 1px 4px -1px rgba(17, 26, 51, 0.04)',
  medium: '0 8px 24px -4px rgba(17, 26, 51, 0.08), 0 4px 12px -2px rgba(17, 26, 51, 0.04)',
  darkCard: '0 12px 32px -8px rgba(0, 0, 0, 0.35)',
} as const;
