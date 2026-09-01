/**
 * Dhanya Design System & Reusable UI Primitives
 * Package: @dhanya/ui
 * 
 * Strict Brand Guidelines:
 * - Font: Manrope
 * - Primary light background: Warm Ivory , Light Surface 
 * - Primary dark: Deep Ink / Navy , Dark Surface 
 * - Primary text: , Secondary: , Muted: 
 * - Borders: , Soft Border: 
 * - Accents: Emerald , Teal , Blue , Champagne 
 */

import React, { useState, useEffect } from 'react';
import { DHANYA_PALETTE, DHANYA_SEMANTIC_COLORS, DHANYA_TYPOGRAPHY } from './tokens';

export * from './tokens';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ----------------------------------------------------
// SEO & STRUCTURED DATA COMPONENT
// ----------------------------------------------------
export interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = '/og-dhanya-intelligence.png',
  structuredData,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title.includes('Dhanya') ? title : `${title} — Dhanya Financial Intelligence`;
    document.title = formattedTitle;

    // 2. Helper to set or update meta tag
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', formattedTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    // 3. Update or set Canonical URL Link
    if (canonicalUrl) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.rel = 'canonical';
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = canonicalUrl;
    }

    // 4. Inject or Update JSON-LD Structured Data
    if (structuredData) {
      const scriptId = 'dhanya-structured-data';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, canonicalUrl, ogType, ogImage, structuredData]);

  return null;
};

// ----------------------------------------------------
// BUTTON COMPONENT
// ----------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'emerald' | 'champagne' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    // Deep Ink primary button
    primary: 'bg-deep-ink hover:bg-deep-surface text-white border border-deep-ink shadow-xs active:scale-[0.99]',
    // Warm surface secondary
    secondary: 'bg-warm-surface hover:bg-warm-ivory text-dhanya-black border border-dhanya-border shadow-2xs',
    // Outline
    outline: 'bg-transparent hover:bg-warm-surface text-dhanya-black border border-dhanya-border',
    // Emerald Growth / Positive Action
    emerald: 'bg-dhanya-emerald hover:bg-dhanya-emerald-dark text-white border border-dhanya-emerald shadow-xs active:scale-[0.99]',
    // Champagne Accent
    champagne: 'bg-dhanya-champagne hover:bg-dhanya-champagne-dark text-deep-ink font-bold border border-dhanya-champagne shadow-xs',
    // Danger / Warning
    danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 shadow-xs',
    // Ghost
    ghost: 'bg-transparent hover:bg-black/5 text-dhanya-secondary hover:text-dhanya-black',
  }[variant];

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-6 py-3 text-base font-bold rounded-xl gap-2.5',
  }[size];

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-sans transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles,
        sizeStyles,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

// ----------------------------------------------------
// FORM INPUT PRIMITIVES
// ----------------------------------------------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  prefixElement,
  suffixElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-dhanya-black uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefixElement && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-dhanya-secondary font-mono text-sm">
            {prefixElement}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-warm-surface text-dhanya-black border rounded-xl px-3.5 py-2.5 text-sm font-medium placeholder-dhanya-muted transition-colors',
            'focus:outline-none focus:bg-white focus:border-deep-ink focus:ring-1 focus:ring-deep-ink',
            error ? 'border-rose-500 bg-rose-50/30' : 'border-dhanya-border',
            prefixElement ? 'pl-9' : '',
            suffixElement ? 'pr-12' : '',
            className
          )}
          {...props}
        />
        {suffixElement && (
          <div className="absolute right-3.5 flex items-center pointer-events-none text-dhanya-secondary font-mono text-xs">
            {suffixElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-dhanya-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

// ----------------------------------------------------
// CURRENCY & PERCENTAGE INPUTS
// ----------------------------------------------------
export interface CurrencyInputProps extends Omit<InputProps, 'onChange'> {
  value: number;
  onChange: (val: number) => void;
  currencySymbol?: string;
  currencyCode?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currencySymbol = '$',
  currencyCode = 'USD',
  label,
  helperText,
  min,
  max,
  step = 1000,
  ...props
}) => {
  return (
    <Input
      label={label}
      helperText={helperText}
      type="number"
      value={isNaN(value) ? '' : value}
      onChange={(e) => {
        const val = parseFloat(e.target.value);
        onChange(isNaN(val) ? 0 : val);
      }}
      prefixElement={<span>{currencySymbol}</span>}
      suffixElement={<span className="font-semibold">{currencyCode}</span>}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
};

export interface PercentageInputProps extends Omit<InputProps, 'onChange'> {
  value: number;
  onChange: (val: number) => void;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  value,
  onChange,
  label,
  helperText,
  min = 0,
  max = 100,
  step = 0.1,
  ...props
}) => {
  return (
    <Input
      label={label}
      helperText={helperText}
      type="number"
      value={isNaN(value) ? '' : value}
      onChange={(e) => {
        const val = parseFloat(e.target.value);
        onChange(isNaN(val) ? 0 : val);
      }}
      suffixElement={<span>%</span>}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
};

// ----------------------------------------------------
// CARD PRIMITIVES
// ----------------------------------------------------
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'ivory' | 'dark' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  padding = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    surface: 'bg-warm-surface border border-dhanya-border text-dhanya-black',
    ivory: 'bg-warm-ivory border border-dhanya-border-soft text-dhanya-black',
    dark: 'bg-deep-ink border border-deep-surface text-white shadow-xl',
    outline: 'bg-transparent border border-dhanya-border text-dhanya-black',
  }[variant];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  return (
    <div className={cn('rounded-2xl transition-all', variantStyles, paddingStyles, className)} {...props}>
      {children}
    </div>
  );
};

// ----------------------------------------------------
// METRIC CARD & FINANCIAL METRIC
// ----------------------------------------------------
export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
  className?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  highlight = false,
  className = '',
  icon,
  trend,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl border transition-all',
        highlight
          ? 'bg-deep-ink text-white border-deep-surface shadow-md'
          : 'bg-warm-surface border-dhanya-border text-dhanya-black',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-semibold uppercase tracking-wider', highlight ? 'text-dhanya-blue' : 'text-dhanya-secondary')}>
          {label}
        </span>
        {icon && <div className={highlight ? 'text-dhanya-blue' : 'text-dhanya-muted'}>{icon}</div>}
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight">
        {value}
      </div>

      <div className="flex items-center justify-between mt-1.5 gap-2">
        {subtext && (
          <span className={cn('text-xs', highlight ? 'text-slate-300' : 'text-dhanya-muted')}>
            {subtext}
          </span>
        )}
        {trend && (
          <span
            className={cn(
              'text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded',
              trend.isPositive
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/20 text-rose-400'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// RESULT CARD COMPONENT
// ----------------------------------------------------
export interface ResultCardSecondaryMetric {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}

export interface ResultCardProps {
  title: string;
  primaryValue: string | number;
  primaryLabel?: string;
  unit?: string;
  secondaryMetrics?: ResultCardSecondaryMetric[];
  note?: string;
  badge?: string;
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  primaryValue,
  primaryLabel,
  unit,
  secondaryMetrics = [],
  note,
  badge,
  className = '',
}) => {
  return (
    <div className={cn('bg-deep-ink text-white rounded-3xl p-6 sm:p-8 border border-deep-surface shadow-2xl space-y-6', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-dhanya-champagne uppercase font-mono tracking-wider">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10">
            {badge}
          </span>
        )}
      </div>

      <div>
        <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-2">
          <span>{primaryValue}</span>
          {unit && <span className="text-sm font-sans font-normal text-slate-400">{unit}</span>}
        </div>
        {primaryLabel && (
          <span className="text-xs sm:text-sm text-dhanya-blue mt-1.5 block font-medium">
            {primaryLabel}
          </span>
        )}
      </div>

      {secondaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-5 border-t border-deep-surface/80">
          {secondaryMetrics.map((m, i) => (
            <div
              key={i}
              className={cn(
                'p-3.5 rounded-xl border',
                m.highlight ? 'bg-deep-surface border-dhanya-emerald/50' : 'bg-deep-surface border-white/5'
              )}
            >
              <span className="text-[11px] text-slate-400 font-medium block">{m.label}</span>
              <span
                className={cn(
                  'text-base sm:text-lg font-bold font-mono mt-0.5 block',
                  m.highlight ? 'text-emerald-400' : 'text-white'
                )}
              >
                {m.value}
              </span>
              {m.subtext && <span className="text-[10px] text-slate-400 mt-0.5 block">{m.subtext}</span>}
            </div>
          ))}
        </div>
      )}

      {note && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-deep-surface/80 pt-4">
          {note}
        </p>
      )}
    </div>
  );
};

// ----------------------------------------------------
// PROVENANCE & SOURCE BADGES
// ----------------------------------------------------
export interface SourceBadgeProps {
  sourceName: string;
  officialUrl?: string;
  isVerified?: boolean;
  verifiedDate?: string;
  publicationDate?: string;
  jurisdiction?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceName,
  officialUrl,
  isVerified = true,
  verifiedDate,
  publicationDate,
  jurisdiction,
}) => {
  const dateDisplay = verifiedDate || publicationDate;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warm-surface border border-dhanya-border text-xs font-medium text-dhanya-black">
      <span className={cn('w-2 h-2 rounded-full shrink-0', isVerified ? 'bg-dhanya-emerald' : 'bg-amber-500')} />
      <span>
        {jurisdiction && <strong className="font-semibold text-dhanya-secondary mr-1">[{jurisdiction}]</strong>}
        Source: <span className="font-semibold">{sourceName}</span>
      </span>
      {dateDisplay && (
        <span className="text-[11px] font-mono text-dhanya-muted">({dateDisplay})</span>
      )}
      {officialUrl && (
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-dhanya-emerald hover:text-dhanya-black hover:underline font-mono text-xs ml-0.5"
          title="Open authoritative regulatory source citation"
        >
          ↗
        </a>
      )}
    </div>
  );
};

export const ProvenanceBadge = SourceBadge;

// ----------------------------------------------------
// STATUS BADGES
// ----------------------------------------------------
export interface StatusBadgeProps {
  status: 'VERIFIED' | 'FLAGGED' | 'ACTIVE' | 'SUPERSEDED' | 'PROPOSED' | 'STABLE';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const config = {
    VERIFIED: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600', text: 'Verified' },
    FLAGGED: { bg: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-600', text: 'Flagged' },
    ACTIVE: { bg: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-600', text: 'Active' },
    SUPERSEDED: { bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500', text: 'Superseded' },
    PROPOSED: { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-600', text: 'Proposed' },
    STABLE: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600', text: 'Stable' },
  }[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono', config.bg)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      <span>{label || config.text}</span>
    </span>
  );
};

// ----------------------------------------------------
// ACCORDION (For Methodology, Assumptions, FAQ)
// ----------------------------------------------------
export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, defaultOpenId }) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    return defaultOpenId ? { [defaultOpenId]: true } : {};
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="divide-y divide-dhanya-border-soft border-y border-dhanya-border-soft">
      {items.map((item) => {
        const isOpen = !!openIds[item.id];
        return (
          <div key={item.id} className="py-4">
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-dhanya-black hover:text-dhanya-emerald transition-colors cursor-pointer"
            >
              <span>{item.title}</span>
              <span className="font-mono text-lg text-dhanya-muted ml-4 shrink-0">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <div className="mt-3 text-sm text-dhanya-secondary leading-relaxed animate-in fade-in duration-150">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------
// PAGE HEADER & SECTION
// ----------------------------------------------------
export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={cn('pb-8 sm:pb-12 border-b border-dhanya-border flex flex-col md:flex-row md:items-end justify-between gap-6', className)}>
      <div className="max-w-3xl space-y-2">
        {eyebrow && (
          <span className="text-xs font-bold font-mono tracking-wider text-dhanya-emerald uppercase block">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-dhanya-black font-sans leading-[1.08]">
          {title}
        </h1>
        {description && (
          <p className="text-base sm:text-lg text-dhanya-secondary font-normal leading-relaxed pt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

// ----------------------------------------------------
// 8-STEP DECISION ENGINE UI & WORKFLOW
// ----------------------------------------------------
export interface EightStepDecisionEngineProps {
  decisionPackage: any; // CalculatorDecisionPackage
  onExportReport?: (format: 'print' | 'html' | 'json') => void;
  formatMoney?: (val: number) => string;
  customActionSlot?: React.ReactNode;
}

export const EightStepDecisionEngine: React.FC<EightStepDecisionEngineProps> = ({
  decisionPackage,
  onExportReport,
  formatMoney = (val: number) => `$${val.toLocaleString()}`,
  customActionSlot,
}) => {
  const [activeStep, setActiveStep] = useState<string>('explain');

  if (!decisionPackage || !decisionPackage.steps) return null;

  return (
    <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-dhanya-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-dhanya-emerald uppercase tracking-wider">
              8-STEP DECISION ENGINE
            </span>
            <span className="text-dhanya-border">•</span>
            <span className="text-xs font-mono text-dhanya-secondary">Deterministic & Explainable</span>
          </div>
          <h2 className="text-2xl font-extrabold text-dhanya-black tracking-tight mt-1">
            Financial Decision & Intelligence Protocol
          </h2>
        </div>

        {onExportReport && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onExportReport('print')}
              icon={<span className="font-mono text-xs">📄</span>}
            >
              Export Official Report (PDF)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExportReport('json')}
            >
              Export JSON
            </Button>
          </div>
        )}
      </div>

      {/* 8-Step Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {decisionPackage.steps.map((s: any) => {
          const isActive = activeStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={cn(
                'p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[72px]',
                isActive
                  ? 'bg-deep-ink text-white border-deep-ink shadow-2xs ring-2 ring-deep-ink/20'
                  : 'bg-white text-dhanya-black border-dhanya-border hover:border-dhanya-secondary/50'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className={cn('text-[10px] font-mono font-bold', isActive ? 'text-dhanya-champagne' : 'text-dhanya-emerald')}>
                  0{s.stepNumber}
                </span>
                <span className={cn('text-[9px] font-mono uppercase tracking-wider', isActive ? 'text-white/60' : 'text-dhanya-muted')}>
                  STEP
                </span>
              </div>
              <div className="text-xs font-bold leading-tight mt-1 truncate">
                {s.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content Viewport */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dhanya-border-soft space-y-6 animate-in fade-in duration-150">
        {/* 1. CALCULATE */}
        {activeStep === 'calculate' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 01 / CALCULATE
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">Deterministic Engine Outputs</h3>
            </div>
            <p className="text-xs text-dhanya-secondary">
              Direct mathematical output produced by pure zero-hallucination actuarial algorithms without estimation.
            </p>
            <div className="p-4 bg-warm-ivory rounded-2xl border border-dhanya-border">
              <div className="text-xs font-mono text-dhanya-secondary mb-1">EXECUTION STATUS</div>
              <div className="text-sm font-bold text-dhanya-black flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-dhanya-emerald"></span>
                Calculated deterministically via @dhanya/finance-engine
              </div>
            </div>
          </div>
        )}

        {/* 2. EXPLAIN */}
        {activeStep === 'explain' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 02 / EXPLAIN
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">Mathematical Formula & Mechanics</h3>
            </div>

            <div className="p-4 bg-deep-ink text-white rounded-2xl font-mono text-sm space-y-1 overflow-x-auto">
              <div className="text-xs text-dhanya-champagne font-bold">GOVERNING ACTUARIAL FORMULATION:</div>
              <div className="text-dhanya-blue font-bold">{decisionPackage.explanation.formula}</div>
            </div>

            <p className="text-sm text-dhanya-secondary leading-relaxed">
              {decisionPackage.explanation.narrative}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-warm-ivory rounded-2xl border border-dhanya-border space-y-2">
                <div className="text-xs font-mono font-bold text-dhanya-black uppercase">Key Assumptions:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-dhanya-secondary">
                  {decisionPackage.explanation.assumptions.map((a: string, idx: number) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-warm-ivory rounded-2xl border border-dhanya-border space-y-2">
                <div className="text-xs font-mono font-bold text-dhanya-black uppercase">Statutory Caveats:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-dhanya-secondary">
                  {decisionPackage.explanation.caveats.map((c: string, idx: number) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 3. COMPARE */}
        {activeStep === 'compare' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 03 / COMPARE
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">Comparative Scenario Simulation</h3>
            </div>
            <p className="text-xs text-dhanya-secondary">
              Real-time sensitivity analysis comparing your baseline against alternate interest rate, tenure, and acceleration paths.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {decisionPackage.comparisons.map((c: any, idx: number) => (
                <div key={idx} className="p-5 bg-warm-ivory rounded-2xl border border-dhanya-border space-y-3">
                  <div>
                    <div className="font-bold text-sm text-dhanya-black">{c.name}</div>
                    <div className="text-[11px] text-dhanya-secondary">{c.description}</div>
                  </div>
                  <div className="pt-2 border-t border-dhanya-border-soft space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-dhanya-muted">{c.primaryMetricLabel}:</span>
                      <span className="font-bold text-dhanya-black">{c.primaryMetricValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dhanya-muted">{c.secondaryMetricLabel}:</span>
                      <span className="font-bold text-dhanya-secondary">{c.secondaryMetricValue}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dhanya-border-soft">
                      <span className="text-dhanya-muted">{c.deltaLabel}:</span>
                      <span className={cn('font-bold', c.isFavorable ? 'text-dhanya-emerald' : 'text-rose-600')}>
                        {c.deltaValue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CURRENT DATA */}
        {activeStep === 'current_data' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 04 / CURRENT DATA
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">Verified Sovereign Data Provenance</h3>
            </div>

            <div className="p-6 bg-warm-ivory rounded-2xl border border-dhanya-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-dhanya-emerald font-bold uppercase">OFFICIAL PROVENANCE CITATION</div>
                  <div className="text-base font-bold text-dhanya-black mt-0.5">{decisionPackage.provenance.sourceName}</div>
                </div>
                <StatusBadge status={decisionPackage.provenance.status === 'VERIFIED' ? 'VERIFIED' : 'ACTIVE'} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-dhanya-border-soft text-xs font-mono">
                <div>
                  <span className="text-dhanya-muted block">Organization</span>
                  <span className="font-bold text-dhanya-black">{decisionPackage.provenance.organization}</span>
                </div>
                <div>
                  <span className="text-dhanya-muted block">Last Verified</span>
                  <span className="font-bold text-dhanya-black">{decisionPackage.provenance.verifiedDate}</span>
                </div>
                <div>
                  <span className="text-dhanya-muted block">Citation Registry</span>
                  <a
                    href={decisionPackage.provenance.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-dhanya-emerald hover:underline inline-flex items-center gap-1"
                  >
                    Official Portal ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. WHAT CHANGED */}
        {activeStep === 'what_changed' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 05 / WHAT CHANGED
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">Regulatory & Policy Feed</h3>
            </div>

            {decisionPackage.relevantIntelligence && decisionPackage.relevantIntelligence.length > 0 ? (
              <div className="space-y-3">
                {decisionPackage.relevantIntelligence.map((event: any) => (
                  <div key={event.id} className="p-4 bg-warm-ivory rounded-2xl border border-dhanya-border flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase bg-deep-ink text-white px-2 py-0.5 rounded">
                          {event.category}
                        </span>
                        <span className="text-xs font-mono text-dhanya-muted">
                          {event.publishedDate}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-dhanya-black">{event.title}</div>
                      <div className="text-xs text-dhanya-secondary">{event.summary}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-dhanya-emerald shrink-0">
                      {event.impactScore} IMPACT
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-warm-ivory rounded-2xl border border-dhanya-border text-center text-xs text-dhanya-secondary">
                No recent regulatory disruptions active for this jurisdiction. Standard statutory baseline in effect.
              </div>
            )}
          </div>
        )}

        {/* 6. PERSONALIZE */}
        {activeStep === 'personalize' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 06 / PERSONALIZE
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">User Context & Parameters</h3>
            </div>
            <p className="text-xs text-dhanya-secondary">
              Calculations are strictly calibrated to the inputs and assumptions configured in the calculator parameter panel above.
            </p>
            <div className="p-4 bg-warm-ivory rounded-2xl border border-dhanya-border text-xs text-dhanya-secondary space-y-2">
              <div>• Zero speculative assumptions are made without explicit user entry.</div>
              <div>• All calculations update instantaneously in real-time as you adjust parameters.</div>
            </div>
          </div>
        )}

        {/* 7. RECOMMEND */}
        {activeStep === 'recommend' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 07 / RECOMMEND
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">Deterministic Strategic Insights</h3>
            </div>

            <div className="space-y-3">
              {decisionPackage.recommendations.map((rec: any) => (
                <div key={rec.id} className="p-5 bg-warm-ivory rounded-2xl border-l-4 border-l-dhanya-emerald border border-dhanya-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-dhanya-black">{rec.title}</div>
                    <span className="text-[10px] font-mono font-bold uppercase bg-white px-2 py-0.5 rounded border border-dhanya-border text-dhanya-secondary">
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <div className="text-xs text-dhanya-secondary">{rec.rationale}</div>
                  <div className="text-xs font-mono font-bold text-dhanya-emerald">
                    Impact: {rec.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. ACT */}
        {activeStep === 'act' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">
                STEP 08 / ACT
              </span>
              <h3 className="text-lg font-bold text-dhanya-black">Execution & Implementation Steps</h3>
            </div>

            <div className="space-y-3">
              {decisionPackage.actionPlan.map((act: any) => (
                <div key={act.id} className="p-5 bg-warm-ivory rounded-2xl border border-dhanya-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-dhanya-black">{act.title}</div>
                    <div className="text-xs text-dhanya-secondary">{act.description}</div>
                  </div>

                  {act.actionType === 'EXPORT' && onExportReport && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onExportReport('print')}
                      className="shrink-0"
                    >
                      Export PDF Report
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {customActionSlot && (
              <div className="pt-4 border-t border-dhanya-border">
                {customActionSlot}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Section: React.FC<{ children: React.ReactNode; className?: string; dark?: boolean }> = ({
  children,
  className = '',
  dark = false,
}) => {
  return (
    <section
      className={cn(
        'w-full py-12 sm:py-16 md:py-20 px-4 sm:px-8',
        dark ? 'bg-deep-ink text-white' : 'bg-warm-ivory text-dhanya-black',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
};
