/**
 * Dhanya Global Financial Context & Routing Engine
 * Application: web
 * 
 * Handles:
 * - Standalone URL routing & history sync (/finance, /finance/mortgage-calculator, /intelligence, /loans, /sources, /countries)
 * - Active country & currency formatting
 * - Standard vs Pro Actuary mode
 * - Local-first persistent loan portfolio
 * - Universal intent search modal
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CountryCode, CountryInfo, UserTrackedLoan } from '@dhanya/types';
import { COUNTRIES, formatCurrency as formatCurrencyUtil, recordInstallmentPayment as recordInstallmentPaymentEngine } from '@dhanya/finance-engine';
import { validateUserTrackedLoanInput } from '@dhanya/validation';
import { useAuth } from './AuthContext';
import { apiClient } from '../services/apiClient';

export type WebRoute =
  | 'home'
  | 'calculators'
  | 'calculator-mortgage'
  | 'calculator-sip'
  | 'calculator-tax'
  | 'calculator-fire'
  | 'what-changed'
  | 'loan-command-center'
  | 'sources'
  | 'countries';

interface FinancialContextType {
  activeCountry: CountryInfo;
  setActiveCountryCode: (code: CountryCode) => void;
  isProMode: boolean;
  setIsProMode: (pro: boolean) => void;
  currentRoute: WebRoute;
  navigateTo: (route: WebRoute, options?: { countryCode?: CountryCode; replace?: boolean }) => void;
  selectedCalculatorId: string;
  setSelectedCalculatorId: (id: string) => void;
  userLoans: UserTrackedLoan[];
  isSyncingLoans: boolean;
  loanSyncError: string | null;
  addOrUpdateLoan: (loan: UserTrackedLoan) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  recordInstallmentPayment: (id: string) => Promise<void>;
  refreshLoans: () => Promise<void>;
  resetLoansToDefault: () => void;
  clearAllLoans: () => void;
  isStorageCorrupted: boolean;
  dismissStorageError: () => void;
  formatMoney: (amount: number, maxDecimals?: number) => string;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const LOCAL_STORAGE_COUNTRY_KEY = 'dhanya_country_code';
const LOCAL_STORAGE_PRO_KEY = 'dhanya_pro_mode';

export const DEFAULT_DEMO_LOANS: UserTrackedLoan[] = [
  {
    id: 'demo-loan-1',
    name: 'Primary Residence Mortgage (Demo)',
    lender: 'Chase Home Lending',
    loanType: 'MORTGAGE',
    countryCode: 'US',
    currencyCode: 'USD',
    originalPrincipal: 450000,
    currentPrincipal: 385200,
    interestRate: 6.75,
    startDate: '2022-06-01',
    tenureMonths: 360,
    monthlyEmi: 2918.54,
    nextDueDate: '2026-09-01',
    totalInstallments: 360,
    paidInstallments: 52,
    remainingInstallments: 308,
    paymentFrequency: 'MONTHLY',
    status: 'ACTIVE',
    notes: 'Fixed 30-year conforming loan (Local Preview / Demo).',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'demo-loan-2',
    name: 'Vehicle Financing (Demo)',
    lender: 'Ally Auto',
    loanType: 'AUTO',
    countryCode: 'US',
    currencyCode: 'USD',
    originalPrincipal: 38000,
    currentPrincipal: 21400,
    interestRate: 4.99,
    startDate: '2023-03-15',
    tenureMonths: 60,
    monthlyEmi: 716.88,
    nextDueDate: '2026-09-15',
    totalInstallments: 60,
    paidInstallments: 26,
    remainingInstallments: 34,
    paymentFrequency: 'MONTHLY',
    status: 'ACTIVE',
    notes: '5-year fixed auto loan (Local Preview / Demo).',
    lastUpdated: new Date().toISOString(),
  },
];

// Helper to parse route from pathname
function parseRouteFromPath(pathname: string): { route: WebRoute; country?: CountryCode } {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  
  if (cleanPath === '/' || cleanPath === '/home') return { route: 'home' };
  if (cleanPath === '/finance/mortgage-calculator' || cleanPath === '/mortgage') return { route: 'calculator-mortgage' };
  if (cleanPath === '/finance/sip-calculator' || cleanPath === '/sip') return { route: 'calculator-sip' };
  if (cleanPath === '/finance/tax-calculator' || cleanPath === '/tax') return { route: 'calculator-tax' };
  if (cleanPath === '/finance/fire-calculator' || cleanPath === '/fire') return { route: 'calculator-fire' };
  if (cleanPath.startsWith('/finance') || cleanPath.startsWith('/calculators')) return { route: 'calculators' };
  if (cleanPath.startsWith('/intelligence') || cleanPath.startsWith('/what-changed')) return { route: 'what-changed' };
  if (cleanPath.startsWith('/loans')) return { route: 'loan-command-center' };
  if (cleanPath.startsWith('/sources') || cleanPath.startsWith('/provenance')) return { route: 'sources' };
  if (cleanPath.startsWith('/countries')) {
    const parts = cleanPath.split('/');
    if (parts[2]) {
      const code = parts[2].toUpperCase() as CountryCode;
      if (COUNTRIES.some(c => c.code === code)) {
        return { route: 'countries', country: code };
      }
    }
    return { route: 'countries' };
  }
  return { route: 'home' };
}

function getPathForRoute(route: WebRoute, countryCode?: CountryCode): string {
  switch (route) {
    case 'home': return '/';
    case 'calculators': return '/finance';
    case 'calculator-mortgage': return '/finance/mortgage-calculator';
    case 'calculator-sip': return '/finance/sip-calculator';
    case 'calculator-tax': return '/finance/tax-calculator';
    case 'calculator-fire': return '/finance/fire-calculator';
    case 'what-changed': return '/intelligence';
    case 'loan-command-center': return '/loans';
    case 'sources': return '/sources';
    case 'countries': return countryCode ? `/countries/${countryCode.toLowerCase()}` : '/countries';
  }
}

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  const [countryCode, setCountryCode] = useState<CountryCode>(() => {
    const initial = parseRouteFromPath(window.location.pathname);
    if (initial.country) return initial.country;
    const saved = localStorage.getItem(LOCAL_STORAGE_COUNTRY_KEY);
    return (saved as CountryCode) || 'US';
  });

  const [isProMode, setIsProMode] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_PRO_KEY) === 'true';
  });

  const [currentRoute, setCurrentRoute] = useState<WebRoute>(() => {
    return parseRouteFromPath(window.location.pathname).route;
  });

  const [selectedCalculatorId, setSelectedCalculatorId] = useState<string>('mortgage-master');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStorageCorrupted, setIsStorageCorrupted] = useState(false);

  // Authenticated Loans State
  const [userLoans, setUserLoans] = useState<UserTrackedLoan[]>([]);
  const [isSyncingLoans, setIsSyncingLoans] = useState<boolean>(false);
  const [loanSyncError, setLoanSyncError] = useState<string | null>(null);

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromPath(window.location.pathname);
      setCurrentRoute(parsed.route);
      if (parsed.country) {
        setCountryCode(parsed.country);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((route: WebRoute, options?: { countryCode?: CountryCode; replace?: boolean }) => {
    setCurrentRoute(route);
    if (options?.countryCode) {
      setCountryCode(options.countryCode);
      localStorage.setItem(LOCAL_STORAGE_COUNTRY_KEY, options.countryCode);
    }
    
    // Map specific calculator routes to selectedCalculatorId
    if (route === 'calculator-mortgage') setSelectedCalculatorId('mortgage-master');
    if (route === 'calculator-sip') setSelectedCalculatorId('sip-wealth');
    if (route === 'calculator-tax') setSelectedCalculatorId('progressive-tax');
    if (route === 'calculator-fire') setSelectedCalculatorId('fire-retirement');

    const path = getPathForRoute(route, options?.countryCode || countryCode);
    if (window.location.pathname !== path) {
      if (options?.replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [countryCode]);

  // Load Authoritative User Loans from Backend when Authenticated
  const fetchUserLoansFromBackend = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      // Unauthenticated: default to empty array (never silently populate with demo loans)
      setUserLoans([]);
      return;
    }

    setIsSyncingLoans(true);
    setLoanSyncError(null);

    try {
      const res = await apiClient.get<{ status: string; count: number; data: UserTrackedLoan[] }>('/api/v1/loans');
      if (res?.status === 'success' && Array.isArray(res.data)) {
        setUserLoans(res.data);
      } else {
        setUserLoans([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch user loans from backend:', err);
      setLoanSyncError(err.message || 'Unable to sync loans with secure server.');
      // If error (e.g. network offline), leave empty rather than leaking
      setUserLoans([]);
    } finally {
      setIsSyncingLoans(false);
    }
  }, [isAuthenticated, currentUser]);

  // Trigger load when auth state or current user changes
  useEffect(() => {
    fetchUserLoansFromBackend();
  }, [fetchUserLoansFromBackend]);

  const setActiveCountryCode = (code: CountryCode) => {
    setCountryCode(code);
    localStorage.setItem(LOCAL_STORAGE_COUNTRY_KEY, code);
  };

  const handleSetIsProMode = (pro: boolean) => {
    setIsProMode(pro);
    localStorage.setItem(LOCAL_STORAGE_PRO_KEY, String(pro));
  };

  const activeCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  }, [countryCode]);

  const formatMoney = (amount: number, maxDecimals: number = 0) => {
    return formatCurrencyUtil(amount, activeCountry.currency.code, activeCountry.currency.locale, maxDecimals);
  };

  // Add or Update Loan with Server-side Authoritative Persistence
  const addOrUpdateLoan = async (loan: UserTrackedLoan) => {
    const validated = validateUserTrackedLoanInput(loan);
    const sanitizedLoan = validated.isValid && validated.sanitized ? (validated.sanitized as UserTrackedLoan) : loan;

    if (!isAuthenticated) {
      // Local scratchpad mode for unauthenticated users
      setUserLoans((prev) => {
        const idx = prev.findIndex((l) => l.id === sanitizedLoan.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = sanitizedLoan;
          return next;
        }
        return [sanitizedLoan, ...prev];
      });
      return;
    }

    try {
      setIsSyncingLoans(true);
      const existsLocally = userLoans.some((l) => l.id === sanitizedLoan.id && !sanitizedLoan.id.startsWith('demo-'));

      let saved: UserTrackedLoan;
      if (existsLocally) {
        // Update existing loan
        const res = await apiClient.patch<{ status: string; data: UserTrackedLoan }>(
          `/api/v1/loans/${sanitizedLoan.id}`,
          sanitizedLoan
        );
        saved = res.data;
      } else {
        // Create new loan on server
        const { id, ...createPayload } = sanitizedLoan;
        const res = await apiClient.post<{ status: string; data: UserTrackedLoan }>(
          '/api/v1/loans',
          createPayload
        );
        saved = res.data;
      }

      setUserLoans((prev) => {
        const idx = prev.findIndex((l) => l.id === saved.id || l.id === sanitizedLoan.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      setLoanSyncError(null);
    } catch (err: any) {
      console.error('Failed to save loan to server:', err);
      setLoanSyncError(err.message || 'Failed to save loan to server.');
      throw err;
    } finally {
      setIsSyncingLoans(false);
    }
  };

  // Delete Loan with Server-side Verification
  const deleteLoan = async (id: string) => {
    if (!isAuthenticated) {
      setUserLoans((prev) => prev.filter((l) => l.id !== id));
      return;
    }

    try {
      setIsSyncingLoans(true);
      await apiClient.delete(`/api/v1/loans/${id}`);
      setUserLoans((prev) => prev.filter((l) => l.id !== id));
      setLoanSyncError(null);
    } catch (err: any) {
      console.error('Failed to delete loan from server:', err);
      setLoanSyncError(err.message || 'Failed to delete loan from server.');
      throw err;
    } finally {
      setIsSyncingLoans(false);
    }
  };

  // Record Installment Payment with Server-side Ledger Update
  const recordInstallmentPayment = async (id: string) => {
    if (!isAuthenticated) {
      setUserLoans((prev) => {
        return prev.map((loan) => {
          if (loan.id === id) {
            return recordInstallmentPaymentEngine(loan);
          }
          return loan;
        });
      });
      return;
    }

    try {
      setIsSyncingLoans(true);
      const res = await apiClient.post<{ status: string; data: UserTrackedLoan }>(
        `/api/v1/loans/${id}/record-payment`,
        { extraPrincipal: 0 }
      );
      if (res?.data) {
        setUserLoans((prev) => {
          return prev.map((loan) => (loan.id === id ? res.data : loan));
        });
      }
      setLoanSyncError(null);
    } catch (err: any) {
      console.error('Failed to record payment on server:', err);
      setLoanSyncError(err.message || 'Failed to record payment on server.');
      throw err;
    } finally {
      setIsSyncingLoans(false);
    }
  };

  const resetLoansToDefault = () => {
    setUserLoans(DEFAULT_DEMO_LOANS);
    setIsStorageCorrupted(false);
  };

  const clearAllLoans = () => {
    setUserLoans([]);
  };

  const dismissStorageError = () => {
    setIsStorageCorrupted(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <FinancialContext.Provider
      value={{
        activeCountry,
        setActiveCountryCode,
        isProMode,
        setIsProMode: handleSetIsProMode,
        currentRoute,
        navigateTo,
        selectedCalculatorId,
        setSelectedCalculatorId,
        userLoans,
        isSyncingLoans,
        loanSyncError,
        addOrUpdateLoan,
        deleteLoan,
        recordInstallmentPayment,
        refreshLoans: fetchUserLoansFromBackend,
        resetLoansToDefault,
        clearAllLoans,
        isStorageCorrupted,
        dismissStorageError,
        formatMoney,
        isSearchOpen,
        setIsSearchOpen,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

