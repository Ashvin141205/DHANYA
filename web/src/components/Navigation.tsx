/**
 * Dhanya Navigation Shell
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory , Top Ribbon Deep Ink , Deep Ink Text 
 * - Navigation links, search trigger (⌘K), country dropdown, and Pro mode switch.
 */

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ShieldCheck,
  Building2,
  Calculator,
  Newspaper,
  ChevronDown,
  Layers,
  Search,
  Globe,
  Home,
  User,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { useFinancial, WebRoute } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { COUNTRIES } from '@dhanya/finance-engine';
import { CountryCode } from '@dhanya/types';

export const Navigation: React.FC = () => {
  const {
    activeCountry,
    setActiveCountryCode,
    isProMode,
    setIsProMode,
    currentRoute,
    navigateTo,
    setIsSearchOpen,
  } = useFinancial();

  const { currentUser, isAuthenticated, role, setIsAuthModalOpen } = useAuth();
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const isCalculatorRoute = currentRoute.startsWith('calculator');
  const hasAdminPrivileges = role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 w-full bg-warm-ivory/95 backdrop-blur-md border-b border-dhanya-border transition-all">
      {/* Top Utility Ribbon (Deep Ink) */}
      <div className="bg-deep-ink text-slate-300 text-xs px-3 sm:px-8 py-1.5 sm:py-2 flex items-center justify-between border-b border-deep-surface gap-2 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium tracking-tight text-[11px] sm:text-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-dhanya-emerald animate-pulse" />
            <span className="hidden sm:inline">Verified Financial Rules Engine</span>
            <span className="inline sm:hidden">Rules Engine</span>
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400 text-[11px] font-mono">
            Active Jurisdiction: <strong className="text-white font-medium">{activeCountry.name}</strong> ({activeCountry.currency.code})
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Admin Portal Link if privileged */}
          {hasAdminPrivileges && (
            <a
              href="/admin"
              className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold text-amber-300 hover:text-amber-200 bg-amber-400/15 border border-amber-400/30 px-1.5 sm:px-2 py-0.5 rounded-full transition-colors shrink-0"
              title="Access the secure Administration Portal"
            >
              <span className="hidden sm:inline">Admin Console</span>
              <span className="inline sm:hidden">Admin</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}

          {/* Simple Email Auth Trigger */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-0.5 rounded-full bg-deep-surface hover:bg-slate-800 border border-deep-border text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
            title="Account Authentication"
          >
            {isAuthenticated && currentUser ? (
              <>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-dhanya-emerald" />
                <span className="font-mono text-[10px] sm:text-[11px] max-w-[120px] sm:max-w-[180px] truncate">{currentUser.email}</span>
                <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  currentUser.role === 'ADMIN' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-800 text-slate-300'
                }`}>
                  [{currentUser.role}]
                </span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-slate-400" />
                <span className="font-mono text-[10px] sm:text-[11px]">Sign In</span>
              </>
            )}
          </button>

          {/* Pro Mode Switch */}
          <button
            onClick={() => setIsProMode(!isProMode)}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full transition-all cursor-pointer shrink-0 ${
              isProMode
                ? 'bg-dhanya-emerald/30 text-emerald-300 border border-dhanya-emerald/50'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle deeper actuarial metrics, marginal brackets, sensitivity analysis, and formulas"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="font-mono text-[10px] sm:text-[11px] hidden sm:inline">{isProMode ? 'Pro / Actuary View' : 'Standard View'}</span>
          </button>
        </div>
      </div>


      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <div
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-deep-ink flex items-center justify-center text-dhanya-champagne shadow-2xs border border-deep-surface group-hover:scale-105 transition-transform shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-dhanya-black font-sans">DHANYA</span>
                <span className="hidden xs:inline-block text-[9px] font-bold font-mono tracking-widest text-dhanya-emerald bg-dhanya-emerald/10 border border-dhanya-emerald/20 px-1.5 py-0.5 rounded-full">
                  INTELLIGENCE
                </span>
              </div>
              <p className="text-[10px] text-dhanya-secondary font-medium tracking-tight -mt-0.5 hidden md:block">
                Global Decision Support & Provenance
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-warm-surface p-1 rounded-2xl border border-dhanya-border">
            <button
              onClick={() => navigateTo('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'home'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => navigateTo('calculators')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCalculatorRoute || currentRoute === 'calculators'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculators</span>
            </button>

            <button
              onClick={() => navigateTo('what-changed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'what-changed'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>What Changed</span>
            </button>

            <button
              onClick={() => navigateTo('loan-command-center')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'loan-command-center'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Loan Command</span>
            </button>

            <button
              onClick={() => navigateTo('sources')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'sources'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Sources</span>
            </button>

            <button
              onClick={() => navigateTo('countries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'countries'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Jurisdictions</span>
            </button>
          </nav>
        </div>

        {/* Search Bar & Country Selector */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Universal Intent Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-warm-surface hover:bg-white border border-dhanya-border rounded-2xl text-dhanya-secondary text-xs font-medium transition-all group cursor-pointer shadow-2xs shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-dhanya-secondary group-hover:text-dhanya-black" />
            <span className="hidden md:inline">Search tools, tax rules, intent...</span>
            <span className="hidden sm:inline md:hidden">Search</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 bg-white border border-dhanya-border rounded-md text-[10px] font-mono text-dhanya-secondary">
              ⌘K
            </kbd>
          </button>

          {/* Country Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-warm-surface hover:bg-white border border-dhanya-border rounded-2xl text-xs font-bold text-dhanya-black shadow-2xs transition-all cursor-pointer"
            >
              <span className="text-sm sm:text-base leading-none">{activeCountry.flag}</span>
              <span className="hidden sm:inline">{activeCountry.name}</span>
              <span className="text-dhanya-secondary font-mono text-[11px] sm:text-xs">({activeCountry.currency.code})</span>
              <ChevronDown className="w-3.5 h-3.5 text-dhanya-secondary" />
            </button>

            {countryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setCountryDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-warm-surface rounded-3xl shadow-2xl border border-dhanya-border z-40 py-2 divide-y divide-dhanya-border-soft animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 text-[10px] font-mono font-bold text-dhanya-muted uppercase tracking-wider">
                    SELECT JURISDICTION & CURRENCY
                  </div>
                  <div className="py-1">
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setActiveCountryCode(c.code as CountryCode);
                          setCountryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs hover:bg-white transition-colors cursor-pointer ${
                          activeCountry.code === c.code ? 'bg-white font-bold text-dhanya-black' : 'text-dhanya-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{c.flag}</span>
                          <div>
                            <div className="font-bold text-dhanya-black">{c.name}</div>
                            <div className="text-[10px] text-dhanya-muted font-mono">{c.taxAuthority}</div>
                          </div>
                        </div>
                        <span className="font-mono text-dhanya-secondary font-semibold">{c.currency.code} ({c.currency.symbol})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Row */}
      <div className="xl:hidden px-3 sm:px-4 pb-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full max-w-full">
        <button
          onClick={() => navigateTo('home')}
          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
            currentRoute === 'home' ? 'bg-deep-ink text-white' : 'bg-warm-surface text-dhanya-secondary border border-dhanya-border'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => navigateTo('calculators')}
          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
            isCalculatorRoute || currentRoute === 'calculators' ? 'bg-deep-ink text-white' : 'bg-warm-surface text-dhanya-secondary border border-dhanya-border'
          }`}
        >
          Calculators
        </button>
        <button
          onClick={() => navigateTo('what-changed')}
          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
            currentRoute === 'what-changed' ? 'bg-deep-ink text-white' : 'bg-warm-surface text-dhanya-secondary border border-dhanya-border'
          }`}
        >
          What Changed
        </button>
        <button
          onClick={() => navigateTo('loan-command-center')}
          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
            currentRoute === 'loan-command-center' ? 'bg-deep-ink text-white' : 'bg-warm-surface text-dhanya-secondary border border-dhanya-border'
          }`}
        >
          Loan Command
        </button>
        <button
          onClick={() => navigateTo('sources')}
          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
            currentRoute === 'sources' ? 'bg-deep-ink text-white' : 'bg-warm-surface text-dhanya-secondary border border-dhanya-border'
          }`}
        >
          Verified Sources
        </button>
        <button
          onClick={() => navigateTo('countries')}
          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
            currentRoute === 'countries' ? 'bg-deep-ink text-white' : 'bg-warm-surface text-dhanya-secondary border border-dhanya-border'
          }`}
        >
          Jurisdictions
        </button>
      </div>
    </header>
  );
};
