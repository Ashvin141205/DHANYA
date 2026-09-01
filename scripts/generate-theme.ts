import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DHANYA_PALETTE, DHANYA_SEMANTIC_COLORS } from '../packages/ui/src/tokens/colors.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function generateThemeCss(): string {
  const cssContent = `/**
 * Dhanya Design Token System — Centralized Tailwind @theme Bridge
 * AUTO-GENERATED from packages/ui/src/tokens/colors.ts — DO NOT MANUALLY EDIT
 * Single Authoritative Source: DHANYA_PALETTE & DHANYA_SEMANTIC_COLORS
 */

@theme {
  --font-sans: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  /* Dhanya Palette Tokens */
  --color-warm-ivory: ${DHANYA_PALETTE.warmIvory};
  --color-warm-surface: ${DHANYA_PALETTE.lightSurface};
  --color-deep-ink: ${DHANYA_PALETTE.deepInk};
  --color-deep-surface: ${DHANYA_PALETTE.darkSurface};
  --color-deep-border: ${DHANYA_PALETTE.darkBorder};
  
  --color-dhanya-black: ${DHANYA_PALETTE.primaryText};
  --color-dhanya-secondary: ${DHANYA_PALETTE.secondaryText};
  --color-dhanya-muted: ${DHANYA_PALETTE.mutedText};
  
  --color-dhanya-border: ${DHANYA_PALETTE.border};
  --color-dhanya-border-soft: ${DHANYA_PALETTE.softBorder};
  
  --color-dhanya-emerald: ${DHANYA_PALETTE.emerald};
  --color-dhanya-emerald-dark: ${DHANYA_PALETTE.emeraldDark};
  --color-dhanya-teal: ${DHANYA_PALETTE.mutedTeal};
  --color-dhanya-blue: ${DHANYA_PALETTE.softBlue};
  --color-dhanya-lavender: ${DHANYA_PALETTE.softLavender};
  --color-dhanya-champagne: ${DHANYA_PALETTE.champagne};
  --color-dhanya-champagne-dark: ${DHANYA_PALETTE.champagneDark};
  --color-dhanya-champagne-text: ${DHANYA_PALETTE.champagneText};

  --color-dark-text: ${DHANYA_PALETTE.darkBodyText};

  /* Semantic UI Tokens */
  --color-bg-primary: ${DHANYA_SEMANTIC_COLORS.backgroundPrimary};
  --color-bg-surface: ${DHANYA_SEMANTIC_COLORS.backgroundSecondary};
  --color-bg-dark: ${DHANYA_SEMANTIC_COLORS.darkBackground};
  --color-bg-dark-surface: ${DHANYA_SEMANTIC_COLORS.darkSurface};

  --color-text-primary: ${DHANYA_SEMANTIC_COLORS.textPrimary};
  --color-text-secondary: ${DHANYA_SEMANTIC_COLORS.textSecondary};
  --color-text-muted: ${DHANYA_SEMANTIC_COLORS.textMuted};

  --color-border-primary: ${DHANYA_SEMANTIC_COLORS.border};
  --color-border-subtle: ${DHANYA_SEMANTIC_COLORS.borderSubtle};

  --color-accent-emerald: ${DHANYA_SEMANTIC_COLORS.accent};
  --color-accent-teal: ${DHANYA_SEMANTIC_COLORS.accentSoft};
  --color-accent-champagne: ${DHANYA_SEMANTIC_COLORS.accentChampagne};
}
`;

  const targetPath = path.join(rootDir, 'packages', 'ui', 'src', 'tokens', 'theme.css');
  fs.writeFileSync(targetPath, cssContent.trim() + '\n', 'utf-8');
  return targetPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = generateThemeCss();
  console.log(`[Token Sync] Generated ${file} directly from packages/ui/src/tokens/colors.ts`);
}
