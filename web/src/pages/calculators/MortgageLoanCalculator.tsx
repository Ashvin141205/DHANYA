/**
 * Dhanya Mortgage & Home Loan Master
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory, Deep Ink, Emerald, Champagne tokens
 * - Deterministic amortization, prepayment acceleration, refinance breakeven, and provenance citation.
 */

import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  BookOpen,
  ExternalLink,
  ArrowRight,
  RotateCcw,
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
  calculateLoanSchedule,
  calculateRefinanceBreakeven,
  generateMortgageDecisionPackage,
  exportReportToBrowserPrint,
  downloadReportAsJsonFile,
} from '@dhanya/finance-engine';
import {
  Button,
  Card,
  CurrencyInput,
  MetricCard,
  ResultCard,
  SourceBadge,
  Accordion,
  SEOHead,
  DHANYA_PALETTE,
  EightStepDecisionEngine,
} from '@dhanya/ui';

export const MortgageLoanCalculator: React.FC = () => {
  const { activeCountry, formatMoney, navigateTo } = useFinancial();
  const { sources } = useSources();
  const { events } = useIntelligence({ countryCode: activeCountry.code });

  // Inputs
  const [principal, setPrincipal] = useState<number>(() => {
    if (activeCountry.code === 'IN') return 5000000; // 50 Lakhs
    if (activeCountry.code === 'GB') return 300000;
    return 400000;
  });

  const [interestRate, setInterestRate] = useState<number>(() => {
    if (activeCountry.code === 'IN') return 8.5;
    if (activeCountry.code === 'GB') return 4.75;
    if (activeCountry.code === 'US') return 6.5;
    return 5.5;
  });

  const [tenureYears, setTenureYears] = useState<number>(activeCountry.defaultMortgageTermYears || 30);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);
  const [annualPrepayment, setAnnualPrepayment] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'amortization' | 'refinance' | 'schedule' | 'methodology' | 'decision_engine'>('amortization');

  // Refinance Inputs
  const [refinanceRate, setRefinanceRate] = useState<number>(Math.max(1, interestRate - 1.0));
  const [refinanceClosingCosts, setRefinanceClosingCosts] = useState<number>(() => Math.round(principal * 0.015));

  // Calculation Engine
  const result = useMemo(() => {
    return calculateLoanSchedule(
      principal,
      interestRate,
      tenureYears,
      extraMonthlyPayment,
      annualPrepayment,
      activeCountry.standardLoanCompounding
    );
  }, [principal, interestRate, tenureYears, extraMonthlyPayment, annualPrepayment, activeCountry]);

  const refinanceResult = useMemo(() => {
    return calculateRefinanceBreakeven(
      principal,
      interestRate,
      tenureYears * 12,
      refinanceRate,
      tenureYears * 12,
      refinanceClosingCosts
    );
  }, [principal, interestRate, tenureYears, refinanceRate, refinanceClosingCosts]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return result.annualSchedule.map((item) => ({
      year: `Yr ${item.year}`,
      Balance: Math.round(item.endingBalance),
      PrincipalPaid: Math.round(item.principalPaid),
      InterestPaid: Math.round(item.interestPaid),
    }));
  }, [result]);

  const sourceCitation = useMemo(() => {
    const liveMatch = sources.find(
      (s) => (s.organizationType === 'CENTRAL_BANK' || s.organizationType === 'REGULATOR') &&
             (s.id.toLowerCase().includes(activeCountry.code.toLowerCase()) || s.name.toLowerCase().includes(activeCountry.name.toLowerCase()))
    ) || sources.find((s) => s.id.toLowerCase().includes(activeCountry.code.toLowerCase())) || sources[0];

    if (liveMatch) {
      return {
        name: liveMatch.name,
        lastVerifiedAt: liveMatch.lastVerifiedAt,
        officialUrl: liveMatch.officialUrl,
      };
    }

    return {
      name: `${activeCountry.name} Statutory Lending Benchmark`,
      lastVerifiedAt: new Date().toISOString(),
      officialUrl: 'https://dhanya.app/sources',
    };
  }, [sources, activeCountry]);

  // 8-Step Decision Engine Package
  const decisionPackage = useMemo(() => {
    const matchedSource = sources.find((s) => s.name === sourceCitation.name) || sources[0];
    return generateMortgageDecisionPackage(
      principal,
      interestRate,
      tenureYears,
      extraMonthlyPayment,
      annualPrepayment,
      result,
      activeCountry,
      matchedSource,
      events,
      formatMoney
    );
  }, [principal, interestRate, tenureYears, extraMonthlyPayment, annualPrepayment, result, activeCountry, sources, sourceCitation, events, formatMoney]);

  // Report Export Handler
  const handleExportReport = (format: 'print' | 'html' | 'json') => {
    const reportData = {
      title: `${activeCountry.name} Mortgage & Amortization Report`,
      calculatorType: 'MORTGAGE' as const,
      countryName: activeCountry.name,
      currencyCode: activeCountry.currency.code,
      currencySymbol: activeCountry.currency.symbol,
      calculatedAt: new Date().toLocaleString(),
      inputs: [
        { label: 'Principal Borrowed', value: formatMoney(principal) },
        { label: 'Annual Interest Rate', value: `${interestRate.toFixed(2)}% APR` },
        { label: 'Tenure Duration', value: `${tenureYears} Years (${tenureYears * 12} Months)` },
        { label: 'Extra Monthly Payment', value: formatMoney(extraMonthlyPayment) },
        { label: 'Annual Prepayment', value: formatMoney(annualPrepayment) },
        { label: 'Compounding Convention', value: activeCountry.standardLoanCompounding },
      ],
      primaryResults: [
        { label: 'Monthly Payment (EMI)', value: `${formatMoney(result.monthlyEmi)}/mo`, highlight: true },
        { label: 'Total Interest Paid', value: formatMoney(result.totalInterest) },
        { label: 'Total Lifetime Outflow', value: formatMoney(result.totalPayment) },
        { label: 'Debt-Free Payoff Date', value: result.payoffDate },
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
        title="Mortgage & Home Loan Calculator — Deterministic Amortization"
        description="Calculate monthly mortgage payments, prepayment savings, extra principal payoff schedules, and refinance breakeven with mathematical accuracy."
        canonicalUrl="https://dhanya.app/finance/mortgage-calculator"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Dhanya Mortgage & Loan Calculator",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }}
      />
      {/* Header & Mode Switcher */}
      <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald uppercase tracking-wider">
                LENDING & REAL ESTATE
              </span>
              <span className="text-dhanya-border">•</span>
              <span className="text-xs font-mono text-dhanya-secondary">{activeCountry.name} ({activeCountry.currency.code})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
              Mortgage & Loan Master
            </h1>
            <p className="text-sm text-dhanya-secondary max-w-2xl">
              Exact reducing balance amortization, prepayment acceleration simulator, and refinance breakeven analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SourceBadge
              sourceName={sourceCitation.name}
              verifiedDate={new Date(sourceCitation.lastVerifiedAt).toLocaleDateString()}
              officialUrl={sourceCitation.officialUrl}
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 pt-4 border-t border-dhanya-border overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('amortization')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'amortization'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            Amortization & Inputs
          </button>
          <button
            onClick={() => setActiveTab('refinance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'refinance'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            Refinance & Savings Lab
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            Year-by-Year Schedule
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'methodology'
                ? 'bg-deep-ink text-white shadow-2xs'
                : 'bg-white text-dhanya-secondary border border-dhanya-border hover:text-dhanya-black'
            }`}
          >
            Methodology & Formulas
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

      {activeTab === 'amortization' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Panel (Left Column) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
                  LOAN PARAMETERS
                </h3>
                <span className="text-[11px] font-mono text-dhanya-muted">Standard Monthly Reducing</span>
              </div>

              {/* Principal Amount */}
              <div className="space-y-2">
                <CurrencyInput
                  label="Loan Principal Amount"
                  value={principal}
                  onChange={(val) => setPrincipal(val)}
                  currencySymbol={activeCountry.currency.symbol}
                />
                <input
                  type="range"
                  min={10000}
                  max={activeCountry.code === 'IN' ? 30000000 : 2500000}
                  step={5000}
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-dhanya-black">
                  <label>Annual Interest Rate (APR)</label>
                  <span className="font-mono font-bold text-sm text-dhanya-black">{interestRate.toFixed(2)}%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Math.max(0.1, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-white border border-dhanya-border rounded-2xl text-sm font-mono font-bold text-dhanya-black focus:outline-none focus:ring-2 focus:ring-deep-ink"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-dhanya-muted font-mono font-bold">%</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={18.0}
                  step={0.05}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                />
              </div>

              {/* Tenure Years */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-dhanya-black">
                  <label>Loan Duration (Tenure)</label>
                  <span className="font-mono text-xs text-dhanya-secondary">{tenureYears} Years ({tenureYears * 12} Months)</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((yr) => (
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

              {/* Prepayment Acceleration Lab */}
              <div className="pt-6 border-t border-dhanya-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-dhanya-emerald uppercase font-mono tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Prepayment & Extra EMI</span>
                  </div>
                  {(extraMonthlyPayment > 0 || annualPrepayment > 0) && (
                    <button
                      onClick={() => {
                        setExtraMonthlyPayment(0);
                        setAnnualPrepayment(0);
                      }}
                      className="text-[11px] text-dhanya-muted hover:text-dhanya-black flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                <div className="space-y-4 bg-warm-ivory p-4 rounded-2xl border border-dhanya-border-soft">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-dhanya-black">
                      <label>Extra Monthly Payment</label>
                      <span className="font-mono text-dhanya-emerald font-bold">+{formatMoney(extraMonthlyPayment)}/mo</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2000}
                      step={25}
                      value={extraMonthlyPayment}
                      onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
                      className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-dhanya-black">
                      <label>Lump-Sum Annual Prepayment</label>
                      <span className="font-mono text-dhanya-emerald font-bold">+{formatMoney(annualPrepayment)}/yr</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25000}
                      step={500}
                      value={annualPrepayment}
                      onChange={(e) => setAnnualPrepayment(Number(e.target.value))}
                      className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel (Right Column) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Result Card (Deep Ink) */}
            <ResultCard
              title="Required Monthly Payment (EMI)"
              primaryValue={formatMoney(result.monthlyEmi)}
              unit="/ month"
              secondaryMetrics={[
                {
                  label: 'Principal Borrowed',
                  value: formatMoney(result.totalPrincipal),
                },
                {
                  label: 'Total Interest Paid',
                  value: formatMoney(result.totalInterest),
                  highlight: true,
                },
                {
                  label: 'Total Lifetime Outflow',
                  value: formatMoney(result.totalPayment),
                },
                {
                  label: 'Debt-Free Payoff Date',
                  value: result.payoffDate,
                },
              ]}
            />

            {/* Prepayment Impact Banner */}
            {result.prepaymentSavings && (extraMonthlyPayment > 0 || annualPrepayment > 0) && (
              <div className="bg-warm-surface border border-dhanya-emerald/30 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-dhanya-emerald/15 text-dhanya-emerald flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-dhanya-black">
                      Prepayment Savings Activated
                    </div>
                    <div className="text-xs text-dhanya-secondary">
                      Reduces total interest by <strong className="text-dhanya-emerald font-mono">{formatMoney(result.prepaymentSavings.interestSaved)}</strong>.
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-dhanya-muted block">Tenure Shortened By</span>
                  <span className="text-sm font-bold font-mono text-dhanya-emerald">
                    {Math.floor(result.prepaymentSavings.monthsSaved / 12)} yrs {result.prepaymentSavings.monthsSaved % 12} mos
                  </span>
                </div>
              </div>
            )}

            {/* Amortization Chart */}
            <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-dhanya-black">
                    Principal Amortization & Equity Build-Up
                  </h4>
                  <p className="text-xs text-dhanya-secondary">
                    Annual remaining debt balance vs cumulative principal paid.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-dhanya-secondary bg-white px-2.5 py-1 rounded-xl border border-dhanya-border">
                  {chartData.length} Years
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={DHANYA_PALETTE.deepInk} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={DHANYA_PALETTE.deepInk} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={DHANYA_PALETTE.emerald} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={DHANYA_PALETTE.emerald} stopOpacity={0.0} />
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
                      dataKey="Balance"
                      name="Remaining Balance"
                      stroke={DHANYA_PALETTE.deepInk}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#balanceGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="PrincipalPaid"
                      name="Principal Paid"
                      stroke={DHANYA_PALETTE.emerald}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#principalGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'refinance' && (
        <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-8">
          <div>
            <h3 className="text-xl font-bold text-dhanya-black">
              Refinance & Balance Transfer Breakeven Simulator
            </h3>
            <p className="text-xs text-dhanya-secondary mt-1">
              Verify if refinancing into a lower APR covers loan closing fees and yields net lifetime savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 bg-white p-6 rounded-3xl border border-dhanya-border">
              <h4 className="text-xs font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
                REFINANCE OFFER PARAMETERS
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-dhanya-black">
                  <label>New Offered Interest Rate (APR)</label>
                  <span className="font-mono font-bold text-dhanya-emerald">{refinanceRate.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={12.0}
                  step={0.05}
                  value={refinanceRate}
                  onChange={(e) => setRefinanceRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
                />
              </div>

              <div className="space-y-2">
                <CurrencyInput
                  label="Estimated Closing Costs / Fees"
                  value={refinanceClosingCosts}
                  onChange={(val) => setRefinanceClosingCosts(val)}
                  currencySymbol={activeCountry.currency.symbol}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-6 rounded-3xl border ${
                refinanceResult.isBeneficial
                  ? 'bg-white border-dhanya-emerald'
                  : 'bg-white border-dhanya-border'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-dhanya-black">
                  <Sparkles className="w-4 h-4 text-dhanya-emerald" />
                  <span>
                    {refinanceResult.isBeneficial
                      ? 'Refinancing is Financially Advantageous'
                      : 'Refinance does not yield sufficient net gain'}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-dhanya-secondary block">Monthly Savings</span>
                    <span className="text-2xl font-bold font-mono text-dhanya-black">
                      {formatMoney(refinanceResult.monthlySavings)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-dhanya-secondary block">Breakeven Time</span>
                    <span className="text-2xl font-bold font-mono text-dhanya-emerald">
                      {refinanceResult.breakevenMonths} Months
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-dhanya-border text-xs text-dhanya-secondary">
                  Net lifetime interest savings after fees:{' '}
                  <strong className="text-dhanya-black font-mono font-bold">
                    {formatMoney(refinanceResult.netFinancialGain)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-4">
          <div>
            <h3 className="text-base font-bold text-dhanya-black">
              Annual Amortization Table
            </h3>
            <p className="text-xs text-dhanya-secondary">
              Deterministic year-by-year principal, interest, and remaining balance schedule.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-dhanya-border">
              <thead className="bg-white text-dhanya-secondary font-bold">
                <tr>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Principal Paid</th>
                  <th className="px-4 py-3">Interest Paid</th>
                  <th className="px-4 py-3">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dhanya-border-soft font-mono">
                {result.annualSchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-white/80 transition-colors">
                    <td className="px-4 py-2.5 font-bold font-sans text-dhanya-black">Year {row.year}</td>
                    <td className="px-4 py-2.5 text-dhanya-emerald font-semibold">{formatMoney(row.principalPaid)}</td>
                    <td className="px-4 py-2.5 text-dhanya-champagne">{formatMoney(row.interestPaid)}</td>
                    <td className="px-4 py-2.5 text-dhanya-black font-bold">{formatMoney(row.endingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'methodology' && (
        <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
          <div className="flex items-center gap-2 text-dhanya-emerald font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Standard Amortization Annuity Formulation</span>
          </div>

          <div className="space-y-4 text-xs text-dhanya-secondary leading-relaxed max-w-3xl">
            <p>
              The Equated Monthly Installment (EMI) is derived using the standard annuity formula:
            </p>
            <div className="p-4 bg-deep-ink text-dhanya-blue font-mono text-sm rounded-2xl overflow-x-auto">
              EMI = P × [r(1 + r)ⁿ] / [(1 + r)ⁿ - 1]
            </div>
            <ul className="list-disc pl-5 space-y-1 text-dhanya-secondary">
              <li><strong className="text-dhanya-black">P</strong> = Principal loan amount.</li>
              <li><strong className="text-dhanya-black">r</strong> = Monthly interest rate (Annual Rate / 12 / 100).</li>
              <li><strong className="text-dhanya-black">n</strong> = Total number of monthly installments (Tenure in Years × 12).</li>
            </ul>

            <h4 className="font-bold text-dhanya-black text-sm pt-2">Prepayment & Compounding Optimization</h4>
            <p>
              Additional prepayments directly reduce the unamortized principal balance. Because interest is charged solely on the outstanding principal, prepayments shorten the loan tenure and generate compounding lifetime interest savings.
            </p>
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
                Download PDF Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('refinance')}
              >
                Open Refinance Simulator
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
