/**
 * Dhanya "What Changed" Live Financial Intelligence Feed
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory , Deep Ink , Emerald , Champagne 
 * - Chronological log of central bank benchmark rates, tax reforms, and regulatory shifts with full citations.
 */

import React, { useState } from 'react';
import {
  Newspaper,
  ShieldCheck,
  ExternalLink,
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { COUNTRIES } from '@dhanya/finance-engine';
import { CountryCode } from '@dhanya/types';
import { SourceBadge, SEOHead } from '@dhanya/ui';
import { useIntelligence } from '../hooks/useIntelligence';

export const IntelligenceFeedPage: React.FC = () => {
  const { activeCountry, setActiveCountryCode, navigateTo } = useFinancial();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>(activeCountry.code);

  const { events, loading, error, isLive, refetch } = useIntelligence({
    countryCode: filterCountry,
    category: selectedCategory,
  });

  return (
    <div className="space-y-10">
      <SEOHead
        title="What Changed — Regulatory & Financial Intelligence Feed"
        description="Audited chronicle of central bank monetary policy decisions, fiscal reforms, and statutory lending indexations across USA, India, UK, and Canada."
        canonicalUrl="https://dhanya.app/intelligence"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Dhanya Regulatory Intelligence Feed",
          "description": "Chronicle of central bank monetary policy decisions and tax reforms.",
        }}
      />
      {/* Header Banner Card */}
      <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald uppercase tracking-wider">
                REGULATORY OBSERVATORY & PROVENANCE
              </span>
              <span className="text-dhanya-border">•</span>
              <span className="text-xs font-mono text-dhanya-secondary">Official Gazette Grounded</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
              What Changed — Live Financial Intelligence
            </h1>
            <p className="text-sm text-dhanya-secondary max-w-2xl">
              Chronological log of central bank benchmark rates, tax slab adjustments, and statutory updates verified directly from official revenue authorities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-dhanya-border text-xs font-mono">
              <Radio className={`w-3 h-3 ${isLive ? 'text-dhanya-emerald animate-pulse' : 'text-dhanya-muted'}`} />
              <span className="font-bold text-dhanya-black">
                {loading ? 'Fetching...' : isLive ? 'Live Verified Feed' : 'Offline'}
              </span>
            </div>
            <SourceBadge
              sourceName="Verified Gazette Registry"
              verifiedDate="Aug 2026"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="pt-6 border-t border-dhanya-border flex flex-wrap items-center justify-between gap-4">
          {/* Country Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterCountry('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterCountry === 'ALL'
                  ? 'bg-deep-ink text-white shadow-2xs'
                  : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
              }`}
            >
              All Jurisdictions
            </button>
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setFilterCountry(c.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterCountry === c.code
                    ? 'bg-deep-ink text-white shadow-2xs'
                    : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            {['ALL', 'TAX_REFORM', 'RATE_CUT', 'POLICY_UPDATE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-dhanya-emerald/15 text-dhanya-emerald border border-dhanya-emerald/30'
                    : 'text-dhanya-secondary hover:text-dhanya-black'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4 text-rose-800 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Intelligence Feed Unavailable</p>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Timeline Event Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-dhanya-border/50 rounded-lg" />
                  <div className="h-4 w-24 bg-dhanya-border/50 rounded-lg" />
                </div>
                <div className="h-6 w-3/4 bg-dhanya-border/50 rounded-lg" />
                <div className="h-4 w-full bg-dhanya-border/50 rounded-lg" />
                <div className="h-16 bg-white rounded-2xl border border-dhanya-border" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-warm-surface rounded-3xl p-12 text-center border border-dhanya-border space-y-2">
            <Newspaper className="w-8 h-8 text-dhanya-muted mx-auto" />
            <h3 className="text-base font-bold text-dhanya-black">No regulatory events recorded</h3>
            <p className="text-xs text-dhanya-secondary">No published bulletins matched the active filter criteria.</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border shadow-2xs hover:border-dhanya-black transition-all space-y-5"
            >
              {/* Event Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-dhanya-border text-dhanya-black">
                    {event.countryCode} • {event.jurisdictionName || 'Federal'}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    event.category === 'RATE_CUT'
                      ? 'bg-dhanya-emerald/10 text-dhanya-emerald border border-dhanya-emerald/20'
                      : event.category === 'TAX_REFORM'
                      ? 'bg-dhanya-champagne/15 text-dhanya-champagne-text border border-dhanya-champagne/30'
                      : 'bg-deep-ink/10 text-deep-ink border border-deep-ink/20'
                  }`}>
                    {event.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-dhanya-secondary">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-dhanya-muted" />
                    Effective: <strong className="text-dhanya-black">{event.effectiveDate}</strong>
                  </span>
                </div>
              </div>

              {/* Event Title & Summary */}
              <div>
                <h3 className="text-xl font-extrabold text-dhanya-black tracking-tight">
                  {event.title}
                </h3>
                <p className="text-sm text-dhanya-secondary mt-1.5 leading-relaxed">
                  {event.summary}
                </p>
              </div>

              {/* Before & After Rule Delta Box */}
              {(event.previousRuleValue || event.newRuleValue) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-dhanya-border text-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-dhanya-muted uppercase tracking-wider block">Previous State</span>
                    <span className="font-mono text-dhanya-secondary line-through mt-1 block font-semibold">{event.previousRuleValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-dhanya-emerald uppercase tracking-wider block">New Verified Value</span>
                    <span className="font-mono font-bold text-dhanya-black mt-1 block">{event.newRuleValue}</span>
                  </div>
                </div>
              )}

              {/* Detailed Actuarial Analysis */}
              <div className="text-xs text-dhanya-black bg-white p-5 rounded-2xl border border-dhanya-border leading-relaxed">
                <span className="font-bold text-dhanya-emerald uppercase font-mono tracking-wider text-[10px] block mb-1">
                  Actuarial Impact & Mathematical Analysis
                </span>
                {event.detailedAnalysis}
              </div>

              {/* Footer Provenance & Actions */}
              <div className="pt-3 border-t border-dhanya-border flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-dhanya-secondary">
                  <ShieldCheck className="w-4 h-4 text-dhanya-emerald" />
                  <span className="font-mono text-[11px]">
                    Verified Source: <strong className="text-dhanya-black font-sans">{event.source.name}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={event.source.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dhanya-secondary hover:text-dhanya-black font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    Official Gazette <ExternalLink className="w-3 h-3" />
                  </a>

                  {event.category === 'TAX_REFORM' && (
                    <button
                      onClick={() => {
                        setActiveCountryCode(event.countryCode as CountryCode);
                        navigateTo('calculator-tax');
                      }}
                      className="px-4 py-2 bg-deep-ink text-white rounded-xl font-bold hover:bg-deep-surface transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      Calculate Impact <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {event.category === 'RATE_CUT' && (
                    <button
                      onClick={() => {
                        setActiveCountryCode(event.countryCode as CountryCode);
                        navigateTo('calculator-mortgage');
                      }}
                      className="px-4 py-2 bg-deep-ink text-white rounded-xl font-bold hover:bg-deep-surface transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      Simulate Refinance <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
