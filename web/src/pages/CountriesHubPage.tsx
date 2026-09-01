/**
 * Dhanya Global Jurisdictions Hub & Country Pages
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory , Deep Ink , Emerald , Champagne 
 * - Monetary policy, taxation structure, conforming lending guidelines, and regulatory intelligence.
 */

import React from 'react';
import {
  Landmark,
  ShieldCheck,
  Calculator,
  ArrowRight,
  TrendingUp,
  Percent,
  Coins,
  Building,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { COUNTRIES, TAX_BRACKETS_BY_JURISDICTION } from '@dhanya/finance-engine';
import { Button, MetricCard, SourceBadge, SEOHead } from '@dhanya/ui';
import { CountryCode } from '@dhanya/types';
import { useIntelligence } from '../hooks/useIntelligence';

export const CountriesHubPage: React.FC = () => {
  const { activeCountry, setActiveCountryCode, navigateTo, formatMoney } = useFinancial();

  // Find live events for the active country
  const { events: countryEvents, loading: eventsLoading } = useIntelligence({
    countryCode: activeCountry.code,
  });

  const defaultJurisdiction = activeCountry.jurisdictions[0] || { id: 'us-fed', taxYear: '2025' };
  const taxConfig = TAX_BRACKETS_BY_JURISDICTION[defaultJurisdiction.id] || TAX_BRACKETS_BY_JURISDICTION['us-fed'];

  return (
    <div className="space-y-12">
      {/* SEO Metadata */}
      <SEOHead
        title={`${activeCountry.name} Financial Intelligence & Tax Dashboard`}
        description={`Official monetary policy, income tax slabs, central bank benchmarks, and statutory lending guidelines for ${activeCountry.name} (${activeCountry.currency.code}).`}
        canonicalUrl={`https://dhanya.app/country/${activeCountry.code.toLowerCase()}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": `${activeCountry.name} Financial Profile`,
          "description": `Statutory tax slabs, central bank rates, and financial regulations for ${activeCountry.name}.`,
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dhanya.app/" },
              { "@type": "ListItem", "position": 2, "name": "Jurisdictions", "item": "https://dhanya.app/countries" },
              { "@type": "ListItem", "position": 3, "name": activeCountry.name, "item": `https://dhanya.app/country/${activeCountry.code.toLowerCase()}` }
            ]
          }
        }}
      />
      {/* Country Selection Header */}
      <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl sm:text-5xl">{activeCountry.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-dhanya-emerald">
                  Jurisdiction Profile
                </span>
                <span className="text-dhanya-border">•</span>
                <span className="text-xs font-mono text-dhanya-secondary">{activeCountry.code}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
                {activeCountry.name} Financial Dashboard
              </h1>
              <p className="text-sm text-dhanya-secondary mt-1">
                Monetary policy, taxation structure, conforming lending guidelines, and regulatory intelligence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setActiveCountryCode(c.code as CountryCode);
                  navigateTo('countries', { countryCode: c.code as CountryCode });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCountry.code === c.code
                    ? 'bg-deep-ink text-white border-deep-ink'
                    : 'bg-white text-dhanya-secondary border-dhanya-border hover:border-dhanya-black hover:text-dhanya-black'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Country Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-dhanya-border">
          <MetricCard
            label="Currency & Symbol"
            value={`${activeCountry.currency.code} (${activeCountry.currency.symbol})`}
            subtext={activeCountry.currency.name}
            icon={<Coins className="w-4 h-4" />}
          />
          <MetricCard
            label="Tax Authority"
            value={activeCountry.taxAuthority}
            subtext="Primary Revenue Body"
            icon={<Building className="w-4 h-4" />}
          />
          <MetricCard
            label="Standard Mortgage Term"
            value={`${activeCountry.defaultMortgageTermYears} Years`}
            subtext={activeCountry.standardLoanCompounding}
            icon={<Landmark className="w-4 h-4" />}
          />
          <MetricCard
            label="Verified Status"
            value="Active"
            subtext="All Brackets Indexed"
            highlight={true}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Country Taxation & Brackets Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-dhanya-black">
                  Income Tax Structure ({defaultJurisdiction.taxYear || '2025'})
                </h3>
                <p className="text-xs text-dhanya-secondary">
                  Marginal tax slabs and automatic statutory deductions.
                </p>
              </div>
              <SourceBadge
                sourceName={taxConfig.source.name}
                verifiedDate="Aug 2026"
                officialUrl={taxConfig.source.officialUrl}
              />
            </div>

            <div className="p-4 bg-warm-surface rounded-2xl border border-dhanya-border flex items-center justify-between text-xs">
              <span className="text-dhanya-secondary font-medium">Standard Deduction Offset</span>
              <span className="font-mono font-bold text-sm text-dhanya-black">
                {formatMoney(taxConfig.standardDeduction)}
              </span>
            </div>

            {/* Slabs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-dhanya-border">
                <thead className="bg-warm-surface text-dhanya-secondary font-bold">
                  <tr>
                    <th className="px-4 py-3">Taxable Income Range</th>
                    <th className="px-4 py-3 text-right">Marginal Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dhanya-border-soft font-mono">
                  {taxConfig.brackets.map((b, idx) => (
                    <tr key={idx} className="hover:bg-warm-surface/50">
                      <td className="px-4 py-2.5 text-dhanya-black">
                        {formatMoney(b.min)} {b.max === Infinity ? '+' : `— ${formatMoney(b.max)}`}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-dhanya-emerald">{b.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo('calculator-tax')}
                icon={<Calculator className="w-3.5 h-3.5" />}
              >
                Launch {activeCountry.name} Tax Estimator
              </Button>
            </div>
          </div>
        </div>

        {/* Regulatory Updates & Central Bank News */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-4">
            <h3 className="text-base font-bold text-dhanya-black">
              Recent Regulatory & Policy Changes
            </h3>

            {countryEvents.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-dhanya-border text-center text-xs text-dhanya-secondary">
                No pending or unverified regulatory alterations currently on record for {activeCountry.name}.
              </div>
            ) : (
              countryEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-5 bg-white rounded-2xl border border-dhanya-border space-y-3 shadow-2xs hover:border-dhanya-black transition-all"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-dhanya-emerald uppercase">
                      {evt.category.replace('_', ' ')}
                    </span>
                    <span className="text-dhanya-secondary font-mono">{evt.effectiveDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-dhanya-black leading-snug">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-dhanya-secondary leading-relaxed">
                    {evt.summary}
                  </p>
                </div>
              ))
            )}

            <Button
              variant="secondary"
              className="w-full justify-center"
              size="sm"
              onClick={() => navigateTo('what-changed')}
            >
              View Full Global Regulatory Feed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
