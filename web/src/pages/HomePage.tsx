/**
 * Dhanya Editorial Homepage
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Primary Background: Warm Ivory , Warm Surface 
 * - Deep Ink Framing 
 * - Editorial composition with confident typography and generous whitespace.
 */

import React from 'react';
import {
  Landmark,
  TrendingUp,
  Calculator,
  Flame,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { COUNTRIES } from '@dhanya/finance-engine';
import { Button, Card, MetricCard, SourceBadge, Section, SEOHead } from '@dhanya/ui';
import { CountryCode } from '@dhanya/types';
import { useIntelligence } from '../hooks/useIntelligence';

export const HomePage: React.FC = () => {
  const { activeCountry, setActiveCountryCode, navigateTo, formatMoney } = useFinancial();
  const { events: liveEvents, loading: eventsLoading } = useIntelligence();

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* SEO & Structured Data */}
      <SEOHead
        title="Dhanya — Global Financial Intelligence & Decision Infrastructure"
        description="High-precision actuarial models, multi-jurisdiction progressive tax estimators, and privacy-first loan command — anchored directly to verified central bank and tax gazette sources."
        canonicalUrl="https://dhanya.app/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Dhanya Financial Intelligence",
          "url": "https://dhanya.app",
          "description": "Global financial intelligence and decision-support infrastructure with deterministic calculations.",
        }}
      />
      {/* ---------------------------------------------------- */}
      {/* HERO SECTION — Editorial Composition */}
      {/* ---------------------------------------------------- */}
      <section className="relative pt-6 pb-12 sm:pt-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Text */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warm-surface border border-dhanya-border text-xs font-semibold text-dhanya-black shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-dhanya-emerald animate-pulse" />
              <span className="font-mono uppercase tracking-wider text-[11px] text-dhanya-secondary">Global Financial Intelligence</span>
              <span className="text-dhanya-border">•</span>
              <span className="text-dhanya-emerald font-bold">Deterministic Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dhanya-black tracking-tight leading-[1.02]">
              Your financial life,{' '}
              <span className="text-dhanya-emerald underline decoration-dhanya-border decoration-2 underline-offset-8">
                understood.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-dhanya-secondary leading-relaxed max-w-2xl font-normal">
              High-precision actuarial models, multi-jurisdiction progressive tax estimators, and privacy-first loan command — anchored directly to verified central bank and tax authority sources.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigateTo('calculators')}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Launch Financial Models
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigateTo('loan-command-center')}
                icon={<Landmark className="w-4 h-4 text-dhanya-secondary" />}
              >
                Loan Command Center
              </Button>
            </div>

            {/* Trust Anchors */}
            <div className="pt-6 border-t border-dhanya-border flex flex-wrap items-center gap-6 text-xs text-dhanya-secondary">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-dhanya-emerald" />
                <span>Zero Hallucinations</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-dhanya-emerald" />
                <span>Local-First Privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-dhanya-emerald" />
                <span>7 Major Jurisdictions</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card / Data Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative bg-deep-ink text-white rounded-3xl p-6 sm:p-8 border border-deep-surface shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-dhanya-champagne">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white tracking-wide">MORTGAGE INTELLIGENCE</div>
                    <div className="text-[10px] text-slate-400 font-mono">Conforming 30-Year Fixed</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-dhanya-emerald/30 text-emerald-300 border border-dhanya-emerald/40">
                  Active Optimization
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Required Monthly Installment
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white mt-1">
                  {formatMoney(2918)}
                  <span className="text-xs font-normal text-slate-400 ml-2 font-sans">/ month</span>
                </div>
                <div className="text-xs text-dhanya-blue mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-dhanya-champagne" />
                  <span>Extra $350/mo cuts tenure by <strong>5 yrs 8 mos</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-deep-surface">
                <div className="p-3 bg-deep-surface rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 font-medium block">Lifetime Interest Saved</span>
                  <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">{formatMoney(94500)}</span>
                </div>
                <div className="p-3 bg-deep-surface rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 font-medium block">Debt Freedom Target</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">Oct 2048</span>
                </div>
              </div>

              {/* Verified Source Micro-Pill */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
                <span>Verified Source: <strong className="text-slate-200">Federal Reserve / IRS</strong></span>
                <span className="text-dhanya-champagne font-mono">Aug 2026</span>
              </div>
            </div>

            {/* Floating Supporting Tag */}
            <div className="hidden sm:block absolute -bottom-5 -left-5 bg-warm-surface border border-dhanya-border rounded-2xl p-3.5 shadow-lg max-w-xs text-xs text-dhanya-black">
              <div className="flex items-center gap-2 font-bold text-dhanya-black">
                <SlidersHorizontal className="w-4 h-4 text-dhanya-emerald" />
                <span>Deterministic Math</span>
              </div>
              <p className="text-[11px] text-dhanya-secondary mt-0.5">
                Exact amortization calculations with zero estimated rounding errors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION: PRIMARY FINANCIAL SUITES */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-dhanya-border pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold font-mono text-dhanya-emerald uppercase tracking-wider block">
              PRECISION FINANCIAL SUITES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dhanya-black tracking-tight">
              Deterministic Models & Calculators
            </h2>
            <p className="text-sm text-dhanya-secondary">
              Actuarial-grade computational tools built for real decisions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo('calculators')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            View All Models
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Mortgage Master */}
          <div
            onClick={() => navigateTo('calculator-mortgage')}
            className="p-6 bg-warm-surface hover:bg-white border border-dhanya-border hover:border-deep-ink rounded-3xl transition-all cursor-pointer group flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-warm-ivory border border-dhanya-border flex items-center justify-center text-dhanya-emerald group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
                  Lending & Real Estate
                </span>
                <h3 className="text-lg font-bold text-dhanya-black mt-0.5 group-hover:text-dhanya-emerald transition-colors">
                  Mortgage & Loan Master
                </h3>
              </div>
              <p className="text-xs text-dhanya-secondary leading-relaxed">
                Reducing balance amortization, extra-EMI prepayment acceleration, and refinance breakeven analysis.
              </p>
            </div>
            <div className="pt-3 border-t border-dhanya-border-soft flex items-center justify-between text-xs font-semibold text-dhanya-black">
              <span className="text-dhanya-emerald">Open Model</span>
              <ArrowRight className="w-4 h-4 text-dhanya-secondary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: SIP Wealth Accumulator */}
          <div
            onClick={() => navigateTo('calculator-sip')}
            className="p-6 bg-warm-surface hover:bg-white border border-dhanya-border hover:border-deep-ink rounded-3xl transition-all cursor-pointer group flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-warm-ivory border border-dhanya-border flex items-center justify-center text-dhanya-emerald group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
                  Wealth & Equity
                </span>
                <h3 className="text-lg font-bold text-dhanya-black mt-0.5 group-hover:text-dhanya-emerald transition-colors">
                  SIP & Wealth Accumulator
                </h3>
              </div>
              <p className="text-xs text-dhanya-secondary leading-relaxed">
                Systematic investment compounding, step-up contribution velocity, and inflation purchasing power adjustments.
              </p>
            </div>
            <div className="pt-3 border-t border-dhanya-border-soft flex items-center justify-between text-xs font-semibold text-dhanya-black">
              <span className="text-dhanya-emerald">Open Model</span>
              <ArrowRight className="w-4 h-4 text-dhanya-secondary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Progressive Income Tax */}
          <div
            onClick={() => navigateTo('calculator-tax')}
            className="p-6 bg-warm-surface hover:bg-white border border-dhanya-border hover:border-deep-ink rounded-3xl transition-all cursor-pointer group flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-warm-ivory border border-dhanya-border flex items-center justify-center text-dhanya-emerald group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
                  Tax & Compliance
                </span>
                <h3 className="text-lg font-bold text-dhanya-black mt-0.5 group-hover:text-dhanya-emerald transition-colors">
                  Progressive Income Tax
                </h3>
              </div>
              <p className="text-xs text-dhanya-secondary leading-relaxed">
                Exact marginal brackets for US, India, UK, Canada, and Australia with standard deduction indexation.
              </p>
            </div>
            <div className="pt-3 border-t border-dhanya-border-soft flex items-center justify-between text-xs font-semibold text-dhanya-black">
              <span className="text-dhanya-emerald">Open Model</span>
              <ArrowRight className="w-4 h-4 text-dhanya-secondary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: FIRE Retirement Planner */}
          <div
            onClick={() => navigateTo('calculator-fire')}
            className="p-6 bg-warm-surface hover:bg-white border border-dhanya-border hover:border-deep-ink rounded-3xl transition-all cursor-pointer group flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-warm-ivory border border-dhanya-border flex items-center justify-center text-dhanya-emerald group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
                  Retirement Freedom
                </span>
                <h3 className="text-lg font-bold text-dhanya-black mt-0.5 group-hover:text-dhanya-emerald transition-colors">
                  FIRE & Freedom Planner
                </h3>
              </div>
              <p className="text-xs text-dhanya-secondary leading-relaxed">
                Safe withdrawal rates (Trinity study), Lean/Fat FIRE targets, and time-to-freedom accumulation velocity.
              </p>
            </div>
            <div className="pt-3 border-t border-dhanya-border-soft flex items-center justify-between text-xs font-semibold text-dhanya-black">
              <span className="text-dhanya-emerald">Open Model</span>
              <ArrowRight className="w-4 h-4 text-dhanya-secondary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION: DEEP INK PROVENANCE & GOVERNANCE SPOTLIGHT */}
      {/* ---------------------------------------------------- */}
      <section className="bg-deep-ink text-white rounded-3xl p-8 sm:p-12 md:p-16 border border-deep-surface shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-dhanya-champagne text-xs font-semibold border border-white/10 font-mono">
            <span>PROVENANCE GUARANTEE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Why deterministic math beats AI guessing for financial decisions.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Large language models hallucinate tax brackets, miscalculate interest compounding, and cite stale legislation. Dhanya enforces strict mathematical separation: every formula is unit-tested against official regulatory publications.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
            <div className="p-4 bg-deep-surface rounded-2xl border border-white/5">
              <div className="text-2xl font-extrabold font-mono text-dhanya-champagne">100%</div>
              <div className="text-xs font-bold text-white mt-1">Verified Provenance</div>
              <p className="text-[11px] text-slate-400 mt-1">Direct citations to IRS, Fed, RBI, BoC, and HMRC.</p>
            </div>

            <div className="p-4 bg-deep-surface rounded-2xl border border-white/5">
              <div className="text-2xl font-extrabold font-mono text-emerald-400">0.00%</div>
              <div className="text-xs font-bold text-white mt-1">Calculation Error</div>
              <p className="text-[11px] text-slate-400 mt-1">Exact reducing balance and actuarial compounding.</p>
            </div>

            <div className="p-4 bg-deep-surface rounded-2xl border border-white/5">
              <div className="text-2xl font-extrabold font-mono text-dhanya-blue">Local</div>
              <div className="text-xs font-bold text-white mt-1">Privacy Architecture</div>
              <p className="text-[11px] text-slate-400 mt-1">Your loan numbers stay inside your browser.</p>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <Button
              variant="champagne"
              size="md"
              onClick={() => navigateTo('sources')}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Inspect Sources Registry
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION: WHAT CHANGED — LIVE FINANCIAL INTELLIGENCE */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-dhanya-border pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold font-mono text-dhanya-emerald uppercase tracking-wider block">
              REGULATORY INTELLIGENCE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dhanya-black tracking-tight">
              What Changed — Live Rule Shifts
            </h2>
            <p className="text-sm text-dhanya-secondary">
              Recent central bank benchmark updates, tax threshold indexations, and regulatory changes.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo('what-changed')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Full Intelligence Feed
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventsLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-warm-surface border border-dhanya-border rounded-3xl animate-pulse space-y-3"
              >
                <div className="h-4 w-24 bg-dhanya-border/50 rounded" />
                <div className="h-5 w-3/4 bg-dhanya-border/50 rounded" />
                <div className="h-12 bg-dhanya-border/30 rounded" />
              </div>
            ))
          ) : liveEvents.length === 0 ? (
            <div className="col-span-3 p-8 bg-warm-surface border border-dhanya-border rounded-3xl text-center text-xs text-dhanya-secondary font-mono">
              Live regulatory events feed connecting...
            </div>
          ) : (
            liveEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={() => navigateTo('what-changed')}
                className="p-6 bg-warm-surface hover:bg-white border border-dhanya-border hover:border-deep-ink rounded-3xl transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-dhanya-black px-2 py-0.5 bg-warm-ivory rounded-md border border-dhanya-border">
                      {event.countryCode} • {event.category.replace('_', ' ')}
                    </span>
                    <span className="text-dhanya-muted">Effective {event.effectiveDate}</span>
                  </div>
                  <h3 className="text-base font-bold text-dhanya-black leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-xs text-dhanya-secondary leading-relaxed line-clamp-3">
                    {event.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-dhanya-border-soft flex items-center justify-between text-xs text-dhanya-secondary">
                  <span>Source: <strong className="text-dhanya-black">{event.source?.name || 'Official Gazette'}</strong></span>
                  <span className="text-dhanya-emerald font-bold">Details ↗</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION: GLOBAL JURISDICTIONS MATRIX */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-6">
        <div className="border-b border-dhanya-border pb-6 space-y-1">
          <span className="text-xs font-bold font-mono text-dhanya-emerald uppercase tracking-wider block">
            GLOBAL JURISDICTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-dhanya-black tracking-tight">
            Multi-Country Financial Support
          </h2>
          <p className="text-sm text-dhanya-secondary">
            Switch instant calculation context between world economies.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setActiveCountryCode(c.code as CountryCode);
                navigateTo('countries', { countryCode: c.code as CountryCode });
              }}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                activeCountry.code === c.code
                  ? 'bg-deep-ink text-white border-deep-ink shadow-md'
                  : 'bg-warm-surface text-dhanya-black border-dhanya-border hover:bg-white hover:border-dhanya-black'
              }`}
            >
              <div className="text-2xl mb-1">{c.flag}</div>
              <div className="font-bold text-xs truncate">{c.name}</div>
              <div className={`text-[10px] font-mono mt-0.5 ${activeCountry.code === c.code ? 'text-dhanya-blue' : 'text-dhanya-muted'}`}>
                {c.currency.code} ({c.currency.symbol})
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
