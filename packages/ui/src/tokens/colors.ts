/**
 * Dhanya Official Design Tokens — Palette & Semantic Colors
 * Package: @dhanya/ui
 * 
 * Single authoritative source of truth for color tokens across Web, Admin, and Shared Components.
 */

export const DHANYA_PALETTE = {
  // Primary Neutrals & Surfaces
  warmIvory: '#F5F1E9',
  lightSurface: '#FAF8F3',
  deepInk: '#111A33',
  darkSurface: '#18213A',

  // Typography & Text
  primaryText: '#111111',
  secondaryText: '#5F625F',
  mutedText: '#7A7D78',

  // Borders & Dividers
  border: '#DDD9D0',
  softBorder: '#E8E4DC',

  // Core Financial Accents
  emerald: '#2F7D68',
  emeraldDark: '#256654',
  mutedTeal: '#4E9583',
  softBlue: '#C9D8F3',
  softLavender: '#D7D8EF',
  champagne: '#C8A96B',
  champagneDark: '#BA9959',
  champagneText: '#8A6A2B',

  // Dark Neutrals & Text
  darkBorder: '#232F4D',
  darkText: '#FFFFFF',
  darkTextSecondary: '#94A3B8',
  darkTextMuted: '#64748B',
  darkBodyText: '#F8FAFC',

  // Semantic Status Colors
  success: '#2F7D68',
  successBg: 'rgba(47, 125, 104, 0.1)',
  warning: '#C8A96B',
  warningBg: 'rgba(200, 169, 107, 0.15)',
  danger: '#E11D48',
  dangerBg: 'rgba(225, 29, 72, 0.1)',
  info: '#2563EB',
  infoBg: 'rgba(37, 99, 235, 0.1)',
} as const;

export const DHANYA_SEMANTIC_COLORS = {
  // Canvas & Surfaces
  backgroundPrimary: DHANYA_PALETTE.warmIvory,
  backgroundSecondary: DHANYA_PALETTE.lightSurface,
  surface: DHANYA_PALETTE.lightSurface,
  surfaceMuted: DHANYA_PALETTE.warmIvory,

  // Text Semantics
  textPrimary: DHANYA_PALETTE.primaryText,
  textSecondary: DHANYA_PALETTE.secondaryText,
  textMuted: DHANYA_PALETTE.mutedText,

  // Borders
  border: DHANYA_PALETTE.border,
  borderSubtle: DHANYA_PALETTE.softBorder,

  // Financial Accents
  accent: DHANYA_PALETTE.emerald,
  accentSoft: DHANYA_PALETTE.mutedTeal,
  accentChampagne: DHANYA_PALETTE.champagne,
  accentBlue: DHANYA_PALETTE.softBlue,
  accentLavender: DHANYA_PALETTE.softLavender,

  // Dark Canvas Semantics
  darkBackground: DHANYA_PALETTE.deepInk,
  darkSurface: DHANYA_PALETTE.darkSurface,
  darkBorder: DHANYA_PALETTE.darkBorder,
  darkText: DHANYA_PALETTE.darkText,
  darkTextSecondary: DHANYA_PALETTE.darkTextSecondary,
  darkTextMuted: DHANYA_PALETTE.darkTextMuted,
  darkBodyText: DHANYA_PALETTE.darkBodyText,

  // States
  success: DHANYA_PALETTE.success,
  successSoft: DHANYA_PALETTE.successBg,
  warning: DHANYA_PALETTE.warning,
  warningSoft: DHANYA_PALETTE.warningBg,
  danger: DHANYA_PALETTE.danger,
  dangerSoft: DHANYA_PALETTE.dangerBg,
  info: DHANYA_PALETTE.info,
  infoSoft: DHANYA_PALETTE.infoBg,
} as const;

export type DhanyaPaletteColor = keyof typeof DHANYA_PALETTE;
export type DhanyaSemanticColor = keyof typeof DHANYA_SEMANTIC_COLORS;
