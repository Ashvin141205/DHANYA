/**
 * Dhanya Multi-Country Progressive Income Tax Estimator
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory , Deep Ink , Emerald , Champagne 
 * - Multi-bracket statutory calculation, standard deduction offsets, and verified provenance.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  ShieldCheck,
  ExternalLink,
  Layers,
  Sparkles,
  FileDown,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useIntelligence } from '../../hooks/useIntelligence';
import {
  calculateProgressiveTax,
  TAX_BRACKETS_BY_JURISDICTION,
  generateTaxDecisionPackage,
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

export const ProgressiveTaxCalculator: React.FC = () => {
  const { activeCountry, formatMoney } = useFinancial();
  const { events } = useIntelligence({ countryCode: activeCountry.code });

  // Active Jurisdiction selection within country
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState<string>(() => {
    return activeCountry.jurisdictions[0]?.id || 'us-fed';
  });

  // Gross Income
  const [grossIncome, setGrossIncome] = useState<number>(() => {
    if (activeCountry.code === 'IN') return 1800000; // 18 Lakhs
    if (activeCountry.code === 'GB') return 65000;
    if (activeCountry.code === 'CA') return 95000;
    return 110000;
  });

  const [customDeductions, setCustomDeductions] = useState<number>(0);

  // Sync jurisdiction with active country changes
  useEffect(() => {
    if (activeCountry.jurisdictions.length > 0) {
      setSelectedJurisdictionId(activeCountry.jurisdictions[0].id);
    }
  }, [activeCountry]);

  // Jurisdiction Config
  const jurisdictionConfig = useMemo(() => {
    return TAX_BRACKETS_BY_JURISDICTION[selectedJurisdictionId] || TAX_BRACKETS_BY_JURISDICTION['us-fed'];
  }, [selectedJurisdictionId]);

  // Tax Calculation Engine
  const result = useMemo(() => {
    return calculateProgressiveTax(
      grossIncome,
      jurisdictionConfig.brackets,
      jurisdictionConfig.standardDeduction,
      customDeductions,
      jurisdictionConfig.source,
      jurisdictionConfig.notes
    );
  }, [grossIncome, jurisdictionConfig, customDeductions]);

  const activeJurisdiction = useMemo(() => {
    return activeCountry.jurisdictions.find((j) => j.id === selectedJurisdictionId) || activeCountry.jurisdictions[0];
  }, [activeCountry, selectedJurisdictionId]);

  // 8-Step Decision Engine Package
  const decisionPackage = useMemo(() => {
    return generateTaxDecisionPackage(
      grossIncome,
      customDeductions,
      result,
      activeCountry,
      activeJurisdiction?.name || activeCountry.name,
      jurisdictionConfig.source,
      events,
      formatMoney
    );
  }, [grossIncome, customDeductions, result, activeCountry, activeJurisdiction, jurisdictionConfig, events, formatMoney]);

  // Report Export Handler
  const handleExportReport = (format: 'print' | 'html' | 'json') => {
    const reportData = {
      title: `${activeCountry.name} (${activeJurisdiction?.name || activeCountry.code}) Statutory Tax Report`,
      calculatorType: 'TAX' as const,
      countryName: activeCountry.name,
      currencyCode: activeCountry.currency.code,
      currencySymbol: activeCountry.currency.symbol,
      calculatedAt: new Date().toLocaleString(),
      inputs: [
        { label: 'Gross Annual Income', value: formatMoney(grossIncome) },
        { label: 'Standard Deduction Allowance', value: formatMoney(jurisdictionConfig.standardDeduction) },
        { label: 'Itemized Custom Deductions', value: formatMoney(customDeductions) },
        { label: 'Taxable Income Base', value: formatMoney(result.taxableIncome) },
      ],
      primaryResults: [
        { label: 'Total Annual Tax Liability', value: formatMoney(result.totalTax), highlight: true },
        { label: 'Monthly Net Take-Home', value: `${formatMoney(result.monthlyTakeHome)}/mo` },
        { label: 'Effective Statutory Tax Rate', value: `${result.effectiveTaxRate}%` },
        { label: 'Marginal Top Bracket', value: `${result.marginalTaxRate}%` },
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
        title={`${activeCountry.name} Progressive Income Tax Estimator — Slabs & Surcharges`}
        description={`Calculate official progressive income tax, standard deduction allowances, effective rate, and net take-home salary across ${activeCountry.name} tax regimes.`}
        canonicalUrl="https://dhanya.app/finance/progressive-tax-calculator"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": `${activeCountry.name} Progressive Income Tax Calculator`,
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "All",
        }}
      />
      {/* Top Header Card */}
      <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald uppercase tracking-wider">
                TAX & COMPLIANCE
              </span>
              <span className="text-dhanya-border">•</span>
              <span className="text-xs font-mono text-dhanya-secondary">{activeCountry.name} ({activeCountry.currency.code})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
              Progressive Income Tax Estimator
            </h1>
            <p className="text-sm text-dhanya-secondary max-w-2xl">
              Statutory marginal tax brackets, official standard deduction offsets, effective tax rate, and take-home pay.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SourceBadge
              sourceName={jurisdictionConfig.source.name}
              verifiedDate="Aug 2026"
              officialUrl={jurisdictionConfig.source.officialUrl}
            />
          </div>
        </div>

        {/* Sub-Jurisdiction / Tax Regime Switcher */}
        {activeCountry.jurisdictions.length > 1 && (
          <div className="pt-4 border-t border-dhanya-border flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold font-mono text-dhanya-secondary uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Regime / State:
            </span>
            {activeCountry.jurisdictions.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedJurisdictionId(j.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedJurisdictionId === j.id
                    ? 'bg-deep-ink text-white border-deep-ink'
                    : 'bg-white text-dhanya-secondary border-dhanya-border hover:text-dhanya-black'
                }`}
              >
                {j.name} ({j.taxYear})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-6">
            <h3 className="text-xs font-bold font-mono text-dhanya-secondary uppercase tracking-wider">
              INCOME & DEDUCTIONS
            </h3>

            {/* Gross Annual Income */}
            <div className="space-y-2">
              <CurrencyInput
                label="Gross Annual Income"
                value={grossIncome}
                onChange={(val) => setGrossIncome(val)}
                currencySymbol={activeCountry.currency.symbol}
              />
              <input
                type="range"
                min={10000}
                max={activeCountry.code === 'IN' ? 15000000 : 750000}
                step={5000}
                value={grossIncome}
                onChange={(e) => setGrossIncome(Number(e.target.value))}
                className="w-full h-1.5 bg-dhanya-border rounded-lg appearance-none cursor-pointer accent-dhanya-emerald"
              />
            </div>

            {/* Standard Deduction Info */}
            <div className="p-4 bg-white rounded-2xl border border-dhanya-border space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-dhanya-secondary font-medium">Automatic Standard Deduction</span>
                <span className="font-mono font-bold text-dhanya-black">
                  {formatMoney(jurisdictionConfig.standardDeduction)}
                </span>
              </div>
              <span className="text-[11px] text-dhanya-muted block font-mono">
                Indexed by {jurisdictionConfig.source.name}
              </span>
            </div>

            {/* Custom Deductions */}
            <div className="space-y-2">
              <CurrencyInput
                label="Additional Itemized Deductions"
                value={customDeductions}
                onChange={(val) => setCustomDeductions(val)}
                currencySymbol={activeCountry.currency.symbol}
              />
            </div>
          </div>
        </div>

        {/* Results & Tax Breakdown Column */}
        <div className="lg:col-span-7 space-y-6">
          <ResultCard
            title="Net Annual Take-Home Pay"
            primaryValue={formatMoney(result.takeHomePay)}
            unit="/ year"
            secondaryMetrics={[
              {
                label: 'Monthly Take-Home',
                value: formatMoney(result.monthlyTakeHome),
              },
              {
                label: 'Total Annual Tax',
                value: formatMoney(result.totalTax),
                highlight: true,
              },
              {
                label: 'Effective Tax Rate',
                value: `${result.effectiveTaxRate}%`,
              },
              {
                label: 'Marginal Top Bracket',
                value: `${result.marginalTaxRate}%`,
              },
            ]}
          />

          {/* Progressive Slabs Table */}
          <div className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border space-y-4">
            <h4 className="text-base font-bold text-dhanya-black">
              Marginal Tax Slab Breakdown
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-dhanya-border">
                <thead className="bg-white text-dhanya-secondary font-bold">
                  <tr>
                    <th className="px-4 py-3">Income Bracket</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Taxable in Bracket</th>
                    <th className="px-4 py-3">Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dhanya-border-soft font-mono">
                  {result.bracketBreakdown.map((b, idx) => (
                    <tr key={idx} className="hover:bg-white/80 transition-colors">
                      <td className="px-4 py-2.5 text-dhanya-black font-sans">{b.bracket}</td>
                      <td className="px-4 py-2.5 text-dhanya-secondary font-bold">{b.rate}%</td>
                      <td className="px-4 py-2.5 text-dhanya-black">{formatMoney(b.taxableInThisBracket)}</td>
                      <td className="px-4 py-2.5 text-dhanya-champagne font-semibold">{formatMoney(b.taxForThisBracket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-dhanya-border flex items-center justify-between text-xs text-dhanya-secondary">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-dhanya-emerald" />
                Authority: <strong className="text-dhanya-black">{jurisdictionConfig.source.name}</strong>
              </span>
              <a
                href={jurisdictionConfig.source.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dhanya-emerald hover:text-deep-ink font-semibold inline-flex items-center gap-1 hover:underline"
              >
                Official Gazette <ExternalLink className="w-3 h-3" />
              </a>
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
              Export Tax Report (PDF)
            </Button>
          </div>
        }
      />
    </div>
  );
};
