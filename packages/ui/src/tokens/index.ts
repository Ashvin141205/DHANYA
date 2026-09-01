/**
 * Dhanya Design Token System Index
 * Package: @dhanya/ui
 */

export * from './colors';
export * from './typography';
export * from './spacing';

import { DHANYA_PALETTE, DHANYA_SEMANTIC_COLORS } from './colors';
import { DHANYA_TYPOGRAPHY } from './typography';
import { DHANYA_SPACING, DHANYA_RADIUS, DHANYA_SHADOWS } from './spacing';

export const dhanyaTokens = {
  palette: DHANYA_PALETTE,
  colors: DHANYA_SEMANTIC_COLORS,
  typography: DHANYA_TYPOGRAPHY,
  spacing: DHANYA_SPACING,
  radius: DHANYA_RADIUS,
  shadows: DHANYA_SHADOWS,
} as const;

export default dhanyaTokens;
