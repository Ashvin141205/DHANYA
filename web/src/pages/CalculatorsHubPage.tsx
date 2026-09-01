/**
 * Dhanya Unified Calculators Hub
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory , Deep Ink , Emerald , Champagne 
 */

import React from 'react';
import {
  Landmark,
  TrendingUp,
  Calculator,
  Flame,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { MortgageLoanCalculator } from './calculators/MortgageLoanCalculator';
import { SIPWealthCalculator } from './calculators/SIPWealthCalculator';
import { ProgressiveTaxCalculator } from './calculators/ProgressiveTaxCalculator';
import { FireRetirementCalculator } from './calculators/FireRetirementCalculator';
import { SEOHead } from '@dhanya/ui';

export const CalculatorsHubPage: React.FC = () => {
  const { selectedCalculatorId, setSelectedCalculatorId, navigateTo } = useFinancial();

  const tools = [
    {
      id: 'mortgage-master',
      route: 'calculator-mortgage' as const,
      title: 'Mortgage & Loan Master',
      icon: <Landmark className="w-5 h-5 text-dhanya-emerald" />,
      category: 'Lending & Real Estate',
      description: 'Reducing balance amortization, extra prepayment acceleration, and refinance breakeven.',
      component: <MortgageLoanCalculator />,
    },
    {
      id: 'sip-wealth',
      route: 'calculator-sip' as const,
      title: 'SIP & Wealth Accumulator',
      icon: <TrendingUp className="w-5 h-5 text-dhanya-emerald" />,
      category: 'Investments & Equity',
      description: 'Systematic monthly compounding, annual step-up velocity, and inflation purchasing power.',
      component: <SIPWealthCalculator />,
    },
    {
      id: 'progressive-tax',
      route: 'calculator-tax' as const,
      title: 'Progressive Income Tax',
      icon: <Calculator className="w-5 h-5 text-dhanya-emerald" />,
      category: 'Tax & Compliance',
      description: 'Multi-jurisdiction progressive tax brackets, standard deduction indexation, and take-home pay.',
      component: <ProgressiveTaxCalculator />,
    },
    {
      id: 'fire-retirement',
      route: 'calculator-fire' as const,
      title: 'FIRE & Freedom Planner',
      icon: <Flame className="w-5 h-5 text-dhanya-emerald" />,
      category: 'Retirement & Long-Term',
      description: 'Safe withdrawal rates, Lean/Fat FIRE targets, and time-to-freedom accumulation velocity.',
      component: <FireRetirementCalculator />,
    },
  ];

  const currentTool = tools.find((t) => t.id === selectedCalculatorId) || tools[0];

  return (
    <div className="space-y-10">
      <SEOHead
        title="Financial Calculators & Actuarial Models — Dhanya"
        description="Deterministic mortgage amortization, SIP compounding velocity, multi-jurisdiction progressive tax estimators, and FIRE retirement models."
        canonicalUrl="https://dhanya.app/calculators"
      />
      {/* Tool Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setSelectedCalculatorId(tool.id);
              navigateTo(tool.route);
            }}
            className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              selectedCalculatorId === tool.id
                ? 'bg-warm-surface border-deep-ink shadow-md'
                : 'bg-warm-surface border-dhanya-border hover:border-dhanya-black'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl bg-white border border-dhanya-border group-hover:scale-105 transition-transform">
                {tool.icon}
              </div>
              <span className="text-[10px] font-mono font-bold text-dhanya-secondary uppercase tracking-wider">
                {tool.category.split('&')[0]}
              </span>
            </div>
            <div className="font-bold text-sm text-dhanya-black tracking-tight">
              {tool.title}
            </div>
            <p className="text-xs text-dhanya-secondary line-clamp-1 mt-1">
              {tool.description}
            </p>
          </button>
        ))}
      </div>

      {/* Render Selected Tool */}
      <div>
        {currentTool.component}
      </div>
    </div>
  );
};
