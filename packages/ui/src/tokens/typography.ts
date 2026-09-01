/**
 * Dhanya Official Design Tokens — Typography
 * Package: @dhanya/ui
 * 
 * Strict Typeface Standard:
 * - Primary Font: Manrope
 * - Monospace / Numerical: JetBrains Mono
 */

export const DHANYA_TYPOGRAPHY = {
  fontFamily: {
    sans: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Editorial Typographic Scales
  scales: {
    display: {
      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', // 40px to 72px
      lineHeight: '1.08',
      fontWeight: '800',
      letterSpacing: '-0.035em',
    },
    h1: {
      fontSize: 'clamp(2rem, 3.5vw, 3rem)', // 32px to 48px
      lineHeight: '1.12',
      fontWeight: '800',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)', // 24px to 36px
      lineHeight: '1.2',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: 'clamp(1.25rem, 1.8vw, 1.5rem)', // 20px to 24px
      lineHeight: '1.3',
      fontWeight: '700',
      letterSpacing: '-0.015em',
    },
    h4: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    bodyLarge: {
      fontSize: '1.125rem', // 18px
      lineHeight: '1.6',
      fontWeight: '400',
    },
    body: {
      fontSize: '1rem', // 16px
      lineHeight: '1.6',
      fontWeight: '400',
    },
    small: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1.5',
      fontWeight: '500',
    },
    caption: {
      fontSize: '0.75rem', // 12px
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '0.02em',
    },
    navigation: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    button: {
      fontSize: '0.875rem', // 14px
      lineHeight: '1',
      fontWeight: '700',
      letterSpacing: '-0.01em',
    },
    financialNumber: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 'clamp(2rem, 4vw, 3.5rem)',
      lineHeight: '1',
      fontWeight: '800',
      letterSpacing: '-0.03em',
    },
  },
} as const;
