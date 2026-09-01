/**
 * Dhanya Universal Intent Search Modal
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory, Deep Ink, Emerald design tokens
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Calculator, ShieldCheck, Newspaper, Landmark, DollarSign, Sparkles, Globe, Wallet } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { COUNTRIES } from '@dhanya/finance-engine';
import { CountryCode } from '@dhanya/types';
import { useIntelligence } from '../hooks/useIntelligence';
import { useSources } from '../hooks/useSources';

interface SearchItem {
  id: string;
  title: string;
  category: 'CALCULATOR' | 'WHAT_CHANGED' | 'TAX_HUB' | 'LOAN_COMMAND' | 'PROVENANCE' | 'USER_LOAN';
  subtitle: string;
  action: () => void;
  badge?: string;
  icon: React.ReactNode;
}

export const UniversalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    navigateTo,
    setSelectedCalculatorId,
    setActiveCountryCode,
    userLoans,
    formatMoney,
  } = useFinancial();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const { events: liveEvents, loading: eventsLoading } = useIntelligence();
  const { sources: liveSources, loading: sourcesLoading } = useSources();

  const searchItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [
      {
        id: 'calc-mortgage',
        title: 'Mortgage & Home Loan Master',
        category: 'CALCULATOR',
        subtitle: 'Amortization schedule, extra EMI prepayment simulator, and refinance breakeven.',
        badge: 'Deterministic Math',
        icon: <Landmark className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          navigateTo('calculator-mortgage');
          setIsSearchOpen(false);
        },
      },
      {
        id: 'calc-sip',
        title: 'SIP & Wealth Accumulator',
        category: 'CALCULATOR',
        subtitle: 'Step-up compounding, SIP vs Lump-sum comparison, and inflation discounting.',
        badge: 'Wealth & Equity',
        icon: <DollarSign className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          navigateTo('calculator-sip');
          setIsSearchOpen(false);
        },
      },
      {
        id: 'calc-tax',
        title: 'Progressive Income Tax Estimator',
        category: 'CALCULATOR',
        subtitle: 'Multi-country progressive tax slabs (US, Canada, India New/Old, UK, Australia).',
        badge: 'Verified Brackets',
        icon: <Calculator className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          navigateTo('calculator-tax');
          setIsSearchOpen(false);
        },
      },
      {
        id: 'calc-fire',
        title: 'FIRE & Financial Independence Planner',
        category: 'CALCULATOR',
        subtitle: 'Safe withdrawal rates, Lean/Fat FIRE targets, and time-to-freedom calculations.',
        badge: 'Retirement',
        icon: <Sparkles className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          navigateTo('calculator-fire');
          setIsSearchOpen(false);
        },
      },
      {
        id: 'tab-loan-command',
        title: 'Loan Command Center',
        category: 'LOAN_COMMAND',
        subtitle: 'Track your real loans, monitor amortization, and test interest-saving prepayments.',
        badge: 'Privacy-First',
        icon: <Landmark className="w-4 h-4 text-deep-ink" />,
        action: () => {
          navigateTo('loan-command-center');
          setIsSearchOpen(false);
        },
      },
      {
        id: 'tab-what-changed',
        title: 'What Changed — Live Financial Intelligence',
        category: 'WHAT_CHANGED',
        subtitle: 'Central bank rate decisions, tax slab reforms, and regulatory shifts with verified sources.',
        badge: 'Live Provenance',
        icon: <Newspaper className="w-4 h-4 text-dhanya-champagne" />,
        action: () => {
          navigateTo('what-changed');
          setIsSearchOpen(false);
        },
      },
      {
        id: 'tab-sources',
        title: 'Verified Sources & Provenance Registry',
        category: 'PROVENANCE',
        subtitle: 'Direct citations to IRS, Fed, Bank of Canada, RBI, HMRC, ATO, and IRAS.',
        badge: 'Official Regulators',
        icon: <ShieldCheck className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          navigateTo('sources');
          setIsSearchOpen(false);
        },
      },
    ];

    // Add country specific search routes
    COUNTRIES.forEach((c) => {
      items.push({
        id: `country-${c.code}`,
        title: `${c.flag} ${c.name} Financial Hub`,
        category: 'TAX_HUB',
        subtitle: `Switch jurisdiction to ${c.name} (${c.currency.code}). Tax authority: ${c.taxAuthority}.`,
        badge: c.currency.code,
        icon: <Globe className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          setActiveCountryCode(c.code as CountryCode);
          navigateTo('countries', { countryCode: c.code as CountryCode });
          setIsSearchOpen(false);
        },
      });
    });

    // Add User Tracked Loans from Privacy-First Ledger
    userLoans.forEach((loan) => {
      items.push({
        id: `loan-${loan.id}`,
        title: loan.name,
        category: 'USER_LOAN',
        subtitle: `${loan.lender || 'Direct Loan'} • Balance: ${formatMoney(loan.currentPrincipal)} @ ${loan.interestRate}%`,
        badge: 'Tracked Loan',
        icon: <Wallet className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          navigateTo('loan-command-center');
          setIsSearchOpen(false);
        },
      });
    });

    // Add What Changed events from Live Intelligence Feed
    liveEvents.forEach((e) => {
      items.push({
        id: `wc-${e.id}`,
        title: e.title,
        category: 'WHAT_CHANGED',
        subtitle: `${e.countryCode} • Effective ${e.effectiveDate} • ${e.summary}`,
        badge: e.category.replace('_', ' '),
        icon: <Newspaper className="w-4 h-4 text-dhanya-champagne" />,
        action: () => {
          navigateTo('what-changed');
          setIsSearchOpen(false);
        },
      });
    });

    // Add Authoritative Sources from Live Sources Registry
    liveSources.forEach((src) => {
      items.push({
        id: `src-${src.id}`,
        title: `${src.name} (${src.id})`,
        category: 'PROVENANCE',
        subtitle: `${src.organization} • ${src.organizationType.replace('_', ' ')} • ${src.verificationStatus || 'VERIFIED'}`,
        badge: 'Statutory Source',
        icon: <ShieldCheck className="w-4 h-4 text-dhanya-emerald" />,
        action: () => {
          navigateTo('sources');
          setIsSearchOpen(false);
        },
      });
    });

    return items;
  }, [
    navigateTo,
    setSelectedCalculatorId,
    setActiveCountryCode,
    setIsSearchOpen,
    userLoans,
    liveEvents,
    liveSources,
    formatMoney,
  ]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return searchItems.slice(0, 8);
    const q = query.toLowerCase();
    return searchItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [query, searchItems]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-deep-ink/70 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
      />
      <div className="relative w-full max-w-2xl bg-warm-surface rounded-3xl shadow-2xl border border-dhanya-border overflow-hidden divide-y divide-dhanya-border-soft z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 gap-3 bg-white">
          <Search className="w-5 h-5 text-dhanya-muted shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search financial models, tax brackets, regulatory events, sources, or tracked loans..."
            className="w-full bg-transparent text-sm text-dhanya-black placeholder-dhanya-muted focus:outline-none font-semibold"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-dhanya-muted hover:text-dhanya-black cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 bg-warm-ivory border border-dhanya-border rounded-md text-[10px] font-mono text-dhanya-secondary">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div ref={resultsContainerRef} className="max-h-96 overflow-y-auto p-2 divide-y divide-dhanya-border-soft/50">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-dhanya-secondary space-y-1">
              <p className="font-bold text-dhanya-black">No matching records found</p>
              <p>No financial models, regulatory events, sources, or tracked loans matched "{query}".</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 group transition-colors cursor-pointer ${
                    isSelected ? 'bg-white shadow-2xs border border-dhanya-border' : 'hover:bg-white/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl bg-white border border-dhanya-border transition-all shrink-0 mt-0.5 ${
                      isSelected ? 'scale-105 border-deep-ink text-dhanya-emerald' : 'group-hover:scale-105'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-dhanya-black truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-warm-ivory text-dhanya-secondary border border-dhanya-border rounded-md">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dhanya-secondary truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-all ${
                    isSelected ? 'text-dhanya-black translate-x-0.5' : 'text-dhanya-muted group-hover:text-dhanya-black group-hover:translate-x-0.5'
                  }`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white flex items-center justify-between text-[11px] text-dhanya-secondary font-mono">
          <span className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </span>
          <span>Deterministic Actuarial Math</span>
        </div>
      </div>
    </div>
  );
};
