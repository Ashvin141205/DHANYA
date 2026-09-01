/**
 * Dhanya FIRE & Financial Independence Freedom Planner
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory, Deep Ink, Emerald, Champagne tokens
 * - Trinity study safe withdrawal rates, accumulation velocity, and Lean/Standard/Fat FIRE targets.
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Percent,
  Calendar,
  Flame,
  FileDown,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useSources } from '../../hooks/useSources';
import { useIntelligence } from '../../hooks/useIntelligence';
import {
  calculateFireTarget,
  generateFireDecisionPackage,
  exportReportToBrowserPrint,
  downloadReportAsJsonFile,
} from '@dhanya/finance-engine';
import {
  Button,
  CurrencyInput,
  ResultCard,
  SourceBadge,
  SEOHead,
  EightStepDecisionEngine,
} from '@dhanya/ui';

export const FireRetirementCalculator: React.FC = () => {
  const { activeCountry, formatMoney } = useFinancial();
  const { sources } = useSources();
  const { events } = useIntelligence({ countryCode: activeCountry.code });

  // Inputs
  const [annualExpenses, setAnnualExpenses] = useState<number>(() => {
    if (activeCountry.code === 'IN') return 1200000; // 12 Lakhs/yr
    if (activeCountry.code === 'GB') return 40000;
    return 60000;
  });

  const [currentSavings, setCurrentSavings] = useState<number>(() => {
    if (activeCountry.code === 'IN') return 2500000; // 25 Lakhs
    return 150000;
  });

  const [monthlySavings, setMonthlySavings] = useState<number>(() => {
    if (activeCountry.code === 'IN') return 50000;
    return 2000;
  });

  const [swrPct, setSwrPct] = useState<number>(4.0);
  const [expectedReturnPct, setExpectedReturnPct] = useState<number>(8.0);
  const [inflationPct, setInflationPct] = useState<number>(3.0);

  // Calculation Engine
  const result = useMemo(() => {
    return calculateFireTarget(
      annualExpenses,
      currentSavings,
      monthlySavings,
      swrPct,
      expectedReturnPct,
      inflationPct
    );
  }, [annualExpenses, currentSavings, monthlySavings, swrPct, expectedReturnPct, inflationPct]);

  const sourceCitation = useMemo(() => {
    const liveMatch = sources.find((s) => s.id.toLowerCase().includes(activeCountry.code.toLowerCase())) || sources[0];
    return liveMatch || {
      name: 'Trinity Study Safe Withdrawal Rate Standard',
      lastVerifiedAt: new Date().toISOString(),
      officialUrl: 'https://dhanya.app/sources',
    };
  }, [sources, activeCountry]);

  // 8-Step Decision Engine Package
  const decisionPackage = useMemo(() => {
    return generateFireDecisionPackage(
      annualExpenses,
      currentSavings,
      monthlySavings,
      swrPct,
      expectedReturnPct,
      inflationPct,
      result,
      activeCountry,
      events,
      formatMoney
    );
  }, [annualExpenses, currentSavings, monthlySavings, swrPct, expectedReturnPct, inflationPct, result, activeCountry, events, formatMoney]);

  // Report Export Handler
  const handleExportReport = (format: 'print' | 'html' | 'json') => {
    const reportData = {
      title: `${activeCountry.name} FIRE & Financial Freedom Plan`,
      calculatorType: 'FIRE' as const,
      countryName: activeCountry.name,
      currencyCode: activeCountry.currency.code,
      currencySymbol: activeCountry.currency.symbol,
      calculatedAt: new Date().toLocaleString(),
      inputs: [
        { label: 'Target Annual Living Expenses', value: formatMoney(annualExpenses) },
        { label: 'Current Invested Corpus', value: formatMoney(currentSavings) },
        { label: 'Monthly Savings Inflow', value: formatMoney(monthlySavings) },
        { label: 'Safe Withdrawal Rate (SWR)', value: `${swrPct.toFixed(2)}% / year` },
        { label: 'Expected Portfolio Return', value: `${expectedReturnPct.toFixed(1)}%` },
        { label: 'Assumed Annual Inflation', value: `${inflationPct.toFixed(1)}%` },
      ],
      primaryResults: [
        { label: 'Target FIRE Nest Egg', value: formatMoney(result.targetNestEgg), highlight: true },
        { label: 'Projected Freedom Timeline', value: `${result.yearsToFreedom} Years (Yr ${result.projectedFreedomYear})` },
        { label: 'Lean FIRE Milestone (75%)', value: formatMoney(result.leanFireTarget) },
        { label: 'Fat FIRE Milestone (150%)', value: formatMoney(result.fatFireTarget) },
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
        title="FIRE & Financial Independence Calculator — Safe Withdrawal & Freedom Date"
        description="Estimate your exact Financial Independence Number, Safe Withdrawal Rate (SWR), Lean/Fat FIRE milestones, and years until financial freedom."
        canonicalUrl="https://dhanya.app/finance/fire-retirement-calculator"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Dhanya FIRE & Financial Independence Planner",
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
                RETIREMENT FREEDOM
              </span>
              <span className="text-dhanya-border">•</span>
              <span className="text-xs font-mono text-dhanya-secondary">{activeCountry.name} ({activeCountry.currency.code})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
              FIRE & Freedom Planner
            </h1>
            <p className="text-sm text-dhanya-secondary max-w-2xl">
              Trinity Study safe withdrawal rates (SWR), accumulation velocity, and Lean, Standard, and Fat FIRE targets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SourceBadge
              sourceName="Trinity Study SWR Model"
              verifiedDate="Aug 2026"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-6">
            <h3 className="text-xs font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
              EXPENSE & SAVINGS PROFILE
            </h3>

            {/* Annual Living Expenses */}
            <div className="space-y-2">
              <CurrencyInput
                label="Target Annual Living Expenses in Retirement"
                value={annualExpenses}
                onChange={(val) => setAnnualExpenses(val)}
                currencySymbol={activeCountry.currency.symbol}
              />
              <input
                type="range"
                min={10000}
                max={activeCountry.code === 'IN' ? 8000000 : 350000}
                step={5000}
                value={annualExpenses}
                onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
              />
            </div>

            {/* Current Net Worth */}
            <div className="space-y-2">
              <CurrencyInput
                label="Current Invested Portfolio"
                value={currentSavings}
                onChange={(val) => setCurrentSavings(val)}
                currencySymbol={activeCountry.currency.symbol}
              />
            </div>

            {/* Monthly Savings Rate */}
            <div className="space-y-2">
              <CurrencyInput
                label="Monthly Additional Savings"
                value={monthlySavings}
                onChange={(val) => setMonthlySavings(val)}
                currencySymbol={activeCountry.currency.symbol}
              />
            </div>

            {/* SWR Parameter */}
            <div className="space-y-2 pt-4 border-t border-dhanya-border">
              <div className="flex justify-between items-center text-xs font-semibold text-dhanya-black">
                <label>Safe Withdrawal Rate (SWR)</label>
                <span className="font-mono font-bold text-dhanya-emerald text-sm">{swrPct}%</span>
              </div>
              <input
                type="range"
                min={2.5}
                max={5.5}
                step={0.1}
                value={swrPct}
                onChange={(e) => setSwrPct(Number(e.target.value))}
                className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
              />
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          <ResultCard
            title="Target FIRE Freedom Corpus"
            primaryValue={formatMoney(result.targetNestEgg)}
            secondaryMetrics={[
              {
                label: 'Time to Freedom',
                value: `${result.yearsToFreedom} Years`,
                highlight: true,
              },
              {
                label: 'Projected Freedom Year',
                value: `Year ${result.projectedFreedomYear}`,
              },
              {
                label: 'Safe Withdrawal Rate',
                value: `${swrPct}% / yr`,
              },
              {
                label: 'Savings Rate Velocity',
                value: `${result.savingsRatePct}%`,
              },
            ]}
          />

          {/* FIRE Tier Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-warm-surface rounded-3xl p-6 border border-dhanya-border space-y-1">
              <span className="text-[10px] font-bold font-mono text-dhanya-secondary uppercase tracking-wider block">
                Lean FIRE (75%)
              </span>
              <span className="text-xl font-extrabold font-mono text-dhanya-black block">
                {formatMoney(result.leanFireTarget)}
              </span>
              <span className="text-xs text-dhanya-secondary block">Frugal minimalist baseline</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-dhanya-emerald space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold font-mono text-dhanya-emerald uppercase tracking-wider block">
                Standard FIRE (100%)
              </span>
              <span className="text-xl font-extrabold font-mono text-dhanya-black block">
                {formatMoney(result.targetNestEgg)}
              </span>
              <span className="text-xs text-dhanya-secondary block">Matches current lifestyle</span>
            </div>

            <div className="bg-warm-surface rounded-3xl p-6 border border-dhanya-border space-y-1">
              <span className="text-[10px] font-bold font-mono text-dhanya-secondary uppercase tracking-wider block">
                Fat FIRE (150%)
              </span>
              <span className="text-xl font-extrabold font-mono text-dhanya-black block">
                {formatMoney(result.fatFireTarget)}
              </span>
              <span className="text-xs text-dhanya-secondary block">Abundant luxury lifestyle</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Step Decision Engine & Protocol */}
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
              Export FIRE Plan (PDF)
            </Button>
          </div>
        }
      />
    </div>
  );
};
