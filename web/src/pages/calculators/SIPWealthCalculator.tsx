/**
 * Dhanya SIP & Wealth Accumulator
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory, Deep Ink, Emerald, Champagne tokens
 * - Step-up compounding, inflation-adjusted real purchasing power, and milestone table.
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  FileDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useFinancial } from '../../context/FinancialContext';
import { useSources } from '../../hooks/useSources';
import { useIntelligence } from '../../hooks/useIntelligence';
import {
  calculateSIP,
  generateSIPDecisionPackage,
  exportReportToBrowserPrint,
  downloadReportAsJsonFile,
} from '@dhanya/finance-engine';
import {
  Button,
  CurrencyInput,
  ResultCard,
  SourceBadge,
  SEOHead,
  DHANYA_PALETTE,
  EightStepDecisionEngine,
} from '@dhanya/ui';

export const SIPWealthCalculator: React.FC = () => {
  const { activeCountry, formatMoney } = useFinancial();
  const { sources } = useSources();
  const { events } = useIntelligence({ countryCode: activeCountry.code });

  // Inputs
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(() => {
    if (activeCountry.code === 'IN') return 15000;
    if (activeCountry.code === 'GB') return 500;
    return 1000;
  });

  const [expectedReturnPct, setExpectedReturnPct] = useState<number>(12.0);
  const [tenureYears, setTenureYears] = useState<number>(15);
  const [stepUpPct, setStepUpPct] = useState<number>(10);
  const [inflationPct, setInflationPct] = useState<number>(5.0);
  const [activeTab, setActiveTab] = useState<'wealth' | 'inflation' | 'comparison' | 'schedule' | 'decision_engine'>('wealth');

  // Calculation Engine
  const result = useMemo(() => {
    return calculateSIP(monthlyInvestment, expectedReturnPct, tenureYears, stepUpPct, inflationPct);
  }, [monthlyInvestment, expectedReturnPct, tenureYears, stepUpPct, inflationPct]);

  // Chart Data
  const chartData = useMemo(() => {
    return result.yearlyBreakdown.map((row) => ({
      year: `Yr ${row.year}`,
      TotalValue: Math.round(row.totalValue),
      InvestedCapital: Math.round(row.investedCapital),
      ReturnsGenerated: Math.round(row.wealthGained),
    }));
  }, [result]);

  const sourceCitation = useMemo(() => {
    const liveMatch = sources.find((s) => s.id.toLowerCase().includes(activeCountry.code.toLowerCase())) || sources[0];
    return liveMatch || {
      name: `${activeCountry.name} Capital Markets Benchmark`,
      lastVerifiedAt: new Date().toISOString(),
      officialUrl: 'https://dhanya.app/sources',
    };
  }, [sources, activeCountry]);

  // 8-Step Decision Engine Package
  const decisionPackage = useMemo(() => {
    return generateSIPDecisionPackage(
      monthlyInvestment,
      expectedReturnPct,
      tenureYears,
      stepUpPct,
      inflationPct,
      result,
      activeCountry,
      events,
      formatMoney
    );
  }, [monthlyInvestment, expectedReturnPct, tenureYears, stepUpPct, inflationPct, result, activeCountry, events, formatMoney]);

  // Report Export Handler
  const handleExportReport = (format: 'print' | 'html' | 'json') => {
    const reportData = {
      title: `${activeCountry.name} Systematic Investment & Wealth Accumulator Report`,
      calculatorType: 'SIP' as const,
      countryName: activeCountry.name,
      currencyCode: activeCountry.currency.code,
      currencySymbol: activeCountry.currency.symbol,
      calculatedAt: new Date().toLocaleString(),
      inputs: [
        { label: 'Initial Monthly Investment', value: `${formatMoney(monthlyInvestment)}/mo` },
        { label: 'Expected Annual Return (CAGR)', value: `${expectedReturnPct.toFixed(2)}%` },
        { label: 'Investment Time Horizon', value: `${tenureYears} Years` },
        { label: 'Annual Step-Up Increment', value: `${stepUpPct.toFixed(1)}% / year` },
        { label: 'Assumed Annual Inflation', value: `${inflationPct.toFixed(1)}%` },
      ],
      primaryResults: [
        { label: 'Nominal Maturity Corpus', value: formatMoney(result.totalMaturityValue), highlight: true },
        { label: 'Total Capital Invested', value: formatMoney(result.totalInvested) },
        { label: 'Compound Wealth Gained', value: `+${formatMoney(result.estimatedReturns)}` },
        { label: 'Inflation-Adjusted Real Value', value: formatMoney(result.inflationAdjustedValue) },
      ],
      decisionPackage,
    };

    if (format === 'json') {
      downloadReportAsJsonFile(reportData);
    } else {
      exportReportToBrowserPrint(reportData);
    }
  };

  return (
    <div className="space-y-10">
      <SEOHead
        title="SIP & Wealth Compound Calculator — Step-Up & Inflation Adjusted"
        description="Model systematic investment plans with annual step-up contribution velocity, long-term compound growth, and inflation-adjusted future purchasing power."
        canonicalUrl="https://dhanya.app/finance/sip-calculator"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Dhanya SIP & Wealth Accumulator",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "All",
        }}
      />
      {/* Header Card */}
      <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald uppercase tracking-wider">
                WEALTH & EQUITY
              </span>
              <span className="text-dhanya-border">•</span>
              <span className="text-xs font-mono text-dhanya-secondary">{activeCountry.name} ({activeCountry.currency.code})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
              SIP & Wealth Accumulator
            </h1>
            <p className="text-sm text-dhanya-secondary max-w-2xl">
              Systematic monthly compounding, annual salary step-up velocity, and inflation purchasing power adjustments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SourceBadge
              sourceName="Actuarial Compounding Standard"
              verifiedDate="Aug 2026"
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 border-t border-dhanya-border overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('wealth')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'wealth'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            Wealth Growth & Projection
          </button>
          <button
            onClick={() => setActiveTab('inflation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inflation'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            Real Purchasing Power (Inflation)
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            SIP vs Lump-Sum Equivalence
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            Yearly Milestones
          </button>
          <button
            onClick={() => setActiveTab('decision_engine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'decision_engine'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-emerald-50 text-dhanya-emerald border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>8-Step Decision Engine</span>
          </button>
        </div>
      </div>

      {activeTab === 'wealth' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-6">
              <h3 className="text-xs font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
                INVESTMENT PARAMETERS
              </h3>

              {/* Monthly Investment */}
              <div className="space-y-2">
                <CurrencyInput
                  label="Monthly Contribution"
                  value={monthlyInvestment}
                  onChange={(val) => setMonthlyInvestment(val)}
                  currencySymbol={activeCountry.currency.symbol}
                />
                <input
                  type="range"
                  min={50}
                  max={activeCountry.code === 'IN' ? 250000 : 25000}
                  step={50}
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                  className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                />
              </div>

              {/* Expected Return */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-dhanya-black">
                  <label>Expected CAGR Return Rate (p.a.)</label>
                  <span className="font-mono font-bold text-sm text-dhanya-black">{expectedReturnPct.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={expectedReturnPct}
                    onChange={(e) => setExpectedReturnPct(Math.max(0.1, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-white border border-dhanya-border rounded-2xl text-sm font-mono font-bold text-dhanya-black focus:outline-none focus:ring-2 focus:ring-deep-ink"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-dhanya-muted font-mono font-bold">%</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={30.0}
                  step={0.5}
                  value={expectedReturnPct}
                  onChange={(e) => setExpectedReturnPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                />
              </div>

              {/* Tenure Years */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-dhanya-black">
                  <label>Investment Horizon</label>
                  <span className="font-mono text-xs text-dhanya-secondary">{tenureYears} Years</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 25].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setTenureYears(yr)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        tenureYears === yr
                          ? 'bg-deep-ink text-white border-deep-ink'
                          : 'bg-white text-dhanya-black border-dhanya-border hover:border-dhanya-black'
                      }`}
                    >
                      {yr} Yrs
                    </button>
                  ))}
                </div>
              </div>

              {/* Step-Up */}
              <div className="pt-6 border-t border-dhanya-border space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-dhanya-black uppercase font-mono tracking-wider">
                  <span className="flex items-center gap-1.5 text-dhanya-emerald">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Annual Step-Up Increment</span>
                  </span>
                  <span className="font-mono text-sm text-dhanya-emerald">{stepUpPct}% / yr</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={stepUpPct}
                  onChange={(e) => setStepUpPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                />
                <p className="text-[11px] text-dhanya-secondary">
                  Scaling contributions with annual wage growth drives asymmetric wealth compounding.
                </p>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">
            <ResultCard
              title="Projected Maturity Corpus"
              primaryValue={formatMoney(result.totalMaturityValue)}
              secondaryMetrics={[
                {
                  label: 'Total Capital Invested',
                  value: formatMoney(result.totalInvested),
                },
                {
                  label: 'Compound Wealth Gained',
                  value: `+${formatMoney(result.estimatedReturns)}`,
                  highlight: true,
                },
                {
                  label: 'Growth Multiplier',
                  value: `${result.growthMultiplier}x`,
                },
                {
                  label: 'Real (Inflation-Adjusted)',
                  value: formatMoney(result.inflationAdjustedValue),
                },
              ]}
            />

            {/* Trajectory Chart */}
            <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-dhanya-black">
                    Corpus Accumulation Trajectory
                  </h4>
                  <p className="text-xs text-dhanya-secondary">
                    Invested capital vs compounded investment yield over {tenureYears} years.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalValueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={DHANYA_PALETTE.emerald} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={DHANYA_PALETTE.emerald} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="capitalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={DHANYA_PALETTE.deepInk} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={DHANYA_PALETTE.deepInk} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={DHANYA_PALETTE.softBorder} />
                    <XAxis dataKey="year" stroke={DHANYA_PALETTE.mutedText} fontSize={11} />
                    <YAxis stroke={DHANYA_PALETTE.mutedText} fontSize={11} tickFormatter={(v) => `${formatMoney(v)}`} />
                    <Tooltip
                      formatter={(val: any) => [`${formatMoney(Number(val))}`, '']}
                      labelStyle={{ color: DHANYA_PALETTE.primaryText, fontWeight: 'bold' }}
                      contentStyle={{ backgroundColor: DHANYA_PALETTE.lightSurface, borderRadius: '16px', border: `1px solid ${DHANYA_PALETTE.border}` }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="TotalValue"
                      name="Total Wealth Corpus"
                      stroke={DHANYA_PALETTE.emerald}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#totalValueGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="InvestedCapital"
                      name="Capital Invested"
                      stroke={DHANYA_PALETTE.deepInk}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#capitalGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inflation' && (
        <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-8">
          <div>
            <h3 className="text-xl font-bold text-dhanya-black">
              Inflation & Real Purchasing Power Discounting
            </h3>
            <p className="text-xs text-dhanya-secondary mt-1">
              Computes the real purchasing power of your maturity corpus in today's currency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 bg-white p-6 rounded-3xl border border-dhanya-border">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-dhanya-black">
                  <label>Expected Annual Inflation</label>
                  <span className="font-mono font-bold text-dhanya-emerald">{inflationPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={12.0}
                  step={0.5}
                  value={inflationPct}
                  onChange={(e) => setInflationPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                />
              </div>
            </div>

            <div className="p-6 bg-deep-ink text-white rounded-3xl border border-deep-surface space-y-4">
              <span className="text-xs font-bold text-dhanya-champagne uppercase font-mono tracking-wider block">
                INFLATION-ADJUSTED REAL VALUE (TODAY'S MONEY)
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                {formatMoney(result.inflationAdjustedValue)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A nominal maturity value of {formatMoney(result.totalMaturityValue)} in {tenureYears} years will purchase what{' '}
                <strong className="text-emerald-400 font-mono">{formatMoney(result.inflationAdjustedValue)}</strong> buys today at {inflationPct}% annual inflation.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-8">
          <div>
            <h3 className="text-xl font-bold text-dhanya-black">
              Systematic Investment (SIP) vs One-Time Lump-Sum Equivalence
            </h3>
            <p className="text-xs text-dhanya-secondary mt-1">
              Compares recurring DCA contributions with deploying the cumulative principal on Day 1.
            </p>
          </div>

          {result.comparisonLumpSum && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-3xl border border-dhanya-emerald">
                <h4 className="text-xs font-bold font-mono text-dhanya-emerald uppercase tracking-wider">SIP Strategy</h4>
                <div className="text-3xl font-extrabold font-mono text-dhanya-black mt-2">
                  {formatMoney(result.totalMaturityValue)}
                </div>
                <p className="text-xs text-dhanya-secondary mt-2">
                  Accumulated steadily via disciplined monthly capital deployment.
                </p>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-dhanya-border">
                <h4 className="text-xs font-bold font-mono text-dhanya-secondary uppercase tracking-wider">Day 1 Lump-Sum Equivalent</h4>
                <div className="text-3xl font-extrabold font-mono text-dhanya-black mt-2">
                  {formatMoney(result.comparisonLumpSum.lumpSumTotal)}
                </div>
                <p className="text-xs text-dhanya-secondary mt-2">
                  If the full {formatMoney(result.totalInvested)} capital was invested simultaneously at Year 0.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-4">
          <h3 className="text-base font-bold text-dhanya-black">
            Year-by-Year Wealth Progression Table
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-dhanya-border">
              <thead className="bg-white text-dhanya-secondary font-bold">
                <tr>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Invested Capital</th>
                  <th className="px-4 py-3">Compound Wealth Generated</th>
                  <th className="px-4 py-3">Year-End Corpus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dhanya-border-soft font-mono">
                {result.yearlyBreakdown.map((row) => (
                  <tr key={row.year} className="hover:bg-white/80 transition-colors">
                    <td className="px-4 py-2.5 font-bold font-sans text-dhanya-black">Year {row.year}</td>
                    <td className="px-4 py-2.5 text-dhanya-secondary">{formatMoney(row.investedCapital)}</td>
                    <td className="px-4 py-2.5 text-dhanya-emerald font-semibold">+{formatMoney(row.wealthGained)}</td>
                    <td className="px-4 py-2.5 text-dhanya-black font-bold">{formatMoney(row.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'decision_engine' && (
        <EightStepDecisionEngine
          decisionPackage={decisionPackage}
          onExportReport={handleExportReport}
          formatMoney={formatMoney}
          customActionSlot={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExportReport('print')}
                icon={<FileDown className="w-3.5 h-3.5" />}
              >
                Export PDF Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('inflation')}
              >
                Inspect Inflation Adjustments
              </Button>
            </div>
          }
        />
      )}

      {/* Persistent Decision Protocol at bottom of page */}
      {activeTab !== 'decision_engine' && (
        <EightStepDecisionEngine
          decisionPackage={decisionPackage}
          onExportReport={handleExportReport}
          formatMoney={formatMoney}
        />
      )}
    </div>
  );
};
