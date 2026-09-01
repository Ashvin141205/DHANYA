/**
 * Dhanya Public Web Application
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory , Deep Ink , Emerald , Champagne 
 * - Routing integration: HomePage, CountriesHubPage, CalculatorsHubPage, LoanCommandCenterPage, IntelligenceFeedPage, SourcesRegistryPage
 */

import React from 'react';
import { useFinancial } from './context/FinancialContext';
import { Navigation } from './components/Navigation';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { HomePage } from './pages/HomePage';
import { CountriesHubPage } from './pages/CountriesHubPage';
import { CalculatorsHubPage } from './pages/CalculatorsHubPage';
import { MortgageLoanCalculator } from './pages/calculators/MortgageLoanCalculator';
import { SIPWealthCalculator } from './pages/calculators/SIPWealthCalculator';
import { ProgressiveTaxCalculator } from './pages/calculators/ProgressiveTaxCalculator';
import { FireRetirementCalculator } from './pages/calculators/FireRetirementCalculator';
import { IntelligenceFeedPage } from './pages/IntelligenceFeedPage';
import { LoanCommandCenterPage } from './pages/LoanCommandCenterPage';
import { SourcesRegistryPage } from './pages/SourcesRegistryPage';
import { ShieldCheck, Layers } from 'lucide-react';

export const WebApp: React.FC = () => {
  const { currentRoute, activeCountry, navigateTo } = useFinancial();

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage />;
      case 'countries':
        return <CountriesHubPage />;
      case 'calculators':
        return <CalculatorsHubPage />;
      case 'calculator-mortgage':
        return <MortgageLoanCalculator />;
      case 'calculator-sip':
        return <SIPWealthCalculator />;
      case 'calculator-tax':
        return <ProgressiveTaxCalculator />;
      case 'calculator-fire':
        return <FireRetirementCalculator />;
      case 'what-changed':
        return <IntelligenceFeedPage />;
      case 'loan-command-center':
        return <LoanCommandCenterPage />;
      case 'sources':
        return <SourcesRegistryPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-ivory text-dhanya-black font-sans selection:bg-dhanya-emerald/20 selection:text-dhanya-black">
      {/* Navigation Header */}
      <Navigation />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {renderCurrentView()}
      </main>

      {/* Global Footer (Deep Ink & Warm Ivory Framing) */}
      <footer className="w-full bg-deep-ink text-slate-400 border-t border-deep-surface mt-20 py-16 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-deep-surface flex items-center justify-center text-dhanya-champagne border border-deep-border">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-base tracking-tight font-sans">DHANYA</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Global financial intelligence and decision-support infrastructure. Deterministic calculations, verified regulatory provenance, and privacy-first debt command center.
              </p>
              <div className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-dhanya-emerald" />
                <span>Zero Hallucination Guarantee</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">Calculators & Models</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button onClick={() => navigateTo('calculator-mortgage')} className="hover:text-white transition-colors cursor-pointer">
                    Mortgage & Loan Master
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('calculator-sip')} className="hover:text-white transition-colors cursor-pointer">
                    SIP & Wealth Accumulator
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('calculator-tax')} className="hover:text-white transition-colors cursor-pointer">
                    Progressive Income Tax
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('calculator-fire')} className="hover:text-white transition-colors cursor-pointer">
                    FIRE Freedom Planner
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">Regulatory Gazettes</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Federal Reserve System (Fed)</li>
                <li>Internal Revenue Service (IRS)</li>
                <li>Bank of Canada (BoC) & CRA</li>
                <li>Reserve Bank of India (RBI)</li>
                <li>HM Revenue & Customs (HMRC)</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">Privacy & Guarantee</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Dhanya operates under a strict client-side calculation policy. Sensitive financial figures and private loan portfolios are processed in-browser.
              </p>
              <div className="pt-1 text-[11px] text-slate-500 font-mono">
                Platform: <strong className="text-slate-300">Dhanya Intelligence</strong>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-deep-surface flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
            <div>
              © {new Date().getFullYear()} Dhanya Financial Intelligence Platform. Built for global decision support.
            </div>
            <div className="flex items-center gap-4">
              <span>Jurisdiction: <strong className="text-slate-300 font-medium">{activeCountry.name}</strong></span>
              <span>•</span>
              <span>Currency: <strong className="text-slate-300 font-medium">{activeCountry.currency.code} ({activeCountry.currency.symbol})</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Universal Search Modal */}
      <UniversalSearchModal />
    </div>
  );
};
