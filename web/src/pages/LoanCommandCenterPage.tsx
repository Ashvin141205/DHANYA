/**
 * Dhanya Loan Command Center
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory, Deep Ink, Emerald, Champagne
 * - Production-grade local-first debt portfolio tracking, deterministic payment recording, and payoff management.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Plus,
  Download,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  ShieldCheck,
  User,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { UserTrackedLoan } from '@dhanya/types';
import { calculatePortfolioSummary } from '@dhanya/finance-engine';
import { SEOHead } from '@dhanya/ui';
import { LoanMetrics } from '../components/loans/LoanMetrics';
import { LoanCard } from '../components/loans/LoanCard';
import { LoanDetailModal } from '../components/loans/LoanDetailModal';
import { LoanFormModal } from '../components/loans/LoanFormModal';
import { CorruptedStorageBanner } from '../components/loans/CorruptedStorageBanner';

type FilterTab = 'ALL' | 'ACTIVE' | 'PAID_OFF';
type SortOption = 'BALANCE_DESC' | 'BALANCE_ASC' | 'RATE_DESC' | 'DUE_DATE' | 'EMI_DESC';

export const LoanCommandCenterPage: React.FC = () => {
  const {
    userLoans,
    isSyncingLoans,
    loanSyncError,
    refreshLoans,
    addOrUpdateLoan,
    deleteLoan,
    recordInstallmentPayment,
    resetLoansToDefault,
    clearAllLoans,
    isStorageCorrupted,
    dismissStorageError,
    formatMoney,
    activeCountry,
  } = useFinancial();

  const { currentUser, isAuthenticated, setIsAuthModalOpen } = useAuth();

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<UserTrackedLoan | null>(null);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<UserTrackedLoan | null>(null);

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('BALANCE_DESC');
  const [importNotification, setImportNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Portfolio-wide Aggregates from deterministic math engine
  const portfolioSummary = useMemo(() => {
    return calculatePortfolioSummary(userLoans);
  }, [userLoans]);

  // Keep selectedLoanForDetails updated with state changes if modal is open
  const currentDetailLoan = useMemo(() => {
    if (!selectedLoanForDetails) return null;
    return userLoans.find((l) => l.id === selectedLoanForDetails.id) || selectedLoanForDetails;
  }, [userLoans, selectedLoanForDetails]);

  // Filtered & Sorted Loans
  const filteredLoans = useMemo(() => {
    return userLoans
      .filter((loan) => {
        // Tab filter
        const isPaid = loan.status === 'PAID_OFF' || loan.currentPrincipal <= 0.01;
        if (activeTab === 'ACTIVE' && isPaid) return false;
        if (activeTab === 'PAID_OFF' && !isPaid) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = loan.name.toLowerCase().includes(q);
          const matchesLender = loan.lender.toLowerCase().includes(q);
          const matchesType = loan.loanType.toLowerCase().includes(q);
          if (!matchesName && !matchesLender && !matchesType) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'BALANCE_DESC') return b.currentPrincipal - a.currentPrincipal;
        if (sortBy === 'BALANCE_ASC') return a.currentPrincipal - b.currentPrincipal;
        if (sortBy === 'RATE_DESC') return b.interestRate - a.interestRate;
        if (sortBy === 'EMI_DESC') return b.monthlyEmi - a.monthlyEmi;
        if (sortBy === 'DUE_DATE') return (a.nextDueDate || '').localeCompare(b.nextDueDate || '');
        return 0;
      });
  }, [userLoans, activeTab, searchQuery, sortBy]);

  // Export JSON Backup
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userLoans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dhanya_loans_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const loan of parsed) {
            if (loan && typeof loan === 'object') {
              await addOrUpdateLoan(loan);
            }
          }
          setImportNotification(`Successfully imported ${parsed.length} loan records.`);
          setTimeout(() => setImportNotification(null), 3000);
        } else {
          setImportNotification('Invalid file structure: Expected an array of loan records.');
          setTimeout(() => setImportNotification(null), 3000);
        }
      } catch (err) {
        setImportNotification('Failed to parse JSON file.');
        setTimeout(() => setImportNotification(null), 3000);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      <SEOHead
        title="Loan Command Center — Privacy-First Debt Portfolio Intelligence"
        description="Consolidate mortgages, auto loans, and personal debt. Track payments, amortize balances deterministically, and manage debt offline."
        canonicalUrl="https://dhanya.app/loans"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Dhanya Loan Command Center",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "All",
        }}
      />

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
        aria-hidden="true"
      />

      {/* Header Banner */}
      <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-dhanya-emerald uppercase tracking-wider">
                DEBT PORTFOLIO INTELLIGENCE
              </span>
              <span className="text-dhanya-border">•</span>
              {isAuthenticated && currentUser ? (
                <span className="text-xs font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3 h-3 text-dhanya-emerald" />
                  Authenticated: {currentUser.name} ({currentUser.role})
                </span>
              ) : (
                <span className="text-xs font-mono text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Local Preview / Unauthenticated
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
              Loan Command Center
            </h1>
            <p className="text-sm text-dhanya-secondary max-w-2xl leading-relaxed">
              Consolidate all mortgages, auto loans, and debt obligations. Record monthly payments, inspect deterministic amortization schedules, and track portfolio-wide payoff progress.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isAuthenticated && (
              <button
                onClick={() => refreshLoans()}
                disabled={isSyncingLoans}
                className="px-3.5 py-2.5 bg-white hover:bg-warm-surface text-dhanya-black border border-dhanya-border rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Sync with server"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-dhanya-secondary ${isSyncingLoans ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingLoans ? 'Syncing...' : 'Sync'}</span>
              </button>
            )}

            <button
              onClick={handleImportClick}
              className="px-3.5 py-2.5 bg-white hover:bg-warm-surface text-dhanya-black border border-dhanya-border rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Import JSON backup"
            >
              <Upload className="w-3.5 h-3.5 text-dhanya-secondary" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              onClick={handleExportData}
              className="px-3.5 py-2.5 bg-white hover:bg-warm-surface text-dhanya-black border border-dhanya-border rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Export local debt portfolio as JSON"
            >
              <Download className="w-3.5 h-3.5 text-dhanya-secondary" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => {
                setEditingLoan(null);
                setIsFormModalOpen(true);
              }}
              className="px-5 py-2.5 bg-deep-ink hover:bg-deep-surface text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Track New Loan</span>
            </button>
          </div>
        </div>

        {/* Unauthenticated Info Banner with Persona Switch Prompt */}
        {!isAuthenticated && (
          <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                You are currently in <strong>Local Preview Mode</strong>. Sign in with a dev persona (e.g. Alex Rivera or Sarah Chen) to persist private loans to the tenant-isolated server ledger.
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors cursor-pointer shrink-0"
            >
              Sign In (Dev Auth)
            </button>
          </div>
        )}

        {/* Sync Error Alert if any */}
        {loanSyncError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loanSyncError}</span>
          </div>
        )}

        {/* Storage Corruption Recovery Alert if triggered */}
        {isStorageCorrupted && (
          <CorruptedStorageBanner
            onResetToDefault={resetLoansToDefault}
            onDismiss={dismissStorageError}
          />
        )}

        {/* Import Notification Toast */}
        {importNotification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-dhanya-emerald flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4" />
            <span>{importNotification}</span>
          </div>
        )}
      </div>


      {/* Portfolio Aggregates Section */}
      <LoanMetrics
        summary={portfolioSummary}
        formatMoney={formatMoney}
        onAddLoanClick={() => {
          setEditingLoan(null);
          setIsFormModalOpen(true);
        }}
      />

      {/* Main Liabilities Section */}
      <div className="space-y-6">
        {/* Controls Bar: Filter Tabs, Search & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tab Filter */}
          <div className="flex items-center gap-1 p-1 bg-warm-surface border border-dhanya-border rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              All Loans ({userLoans.length})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              Active ({portfolioSummary.activeLoanCount})
            </button>
            <button
              onClick={() => setActiveTab('PAID_OFF')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PAID_OFF'
                  ? 'bg-white text-dhanya-black shadow-2xs border border-dhanya-border'
                  : 'text-dhanya-secondary hover:text-dhanya-black'
              }`}
            >
              Paid Off ({portfolioSummary.paidOffLoanCount})
            </button>
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-dhanya-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lender or title..."
                className="pl-8 pr-3 py-1.5 bg-white border border-dhanya-border rounded-xl text-xs text-dhanya-black focus:outline-none focus:ring-1 focus:ring-dhanya-black w-44 sm:w-56"
              />
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1 text-xs text-dhanya-secondary">
              <SlidersHorizontal className="w-3.5 h-3.5 text-dhanya-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 bg-white border border-dhanya-border rounded-xl text-xs font-semibold text-dhanya-black focus:outline-none"
              >
                <option value="BALANCE_DESC">Highest Balance</option>
                <option value="BALANCE_ASC">Lowest Balance</option>
                <option value="RATE_DESC">Highest APR</option>
                <option value="EMI_DESC">Highest Monthly EMI</option>
                <option value="DUE_DATE">Due Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loans List / Grid */}
        {filteredLoans.length === 0 ? (
          <div className="bg-warm-surface rounded-3xl p-12 text-center border border-dhanya-border space-y-4">
            <Building2 className="w-12 h-12 text-dhanya-muted mx-auto" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-dhanya-black">
                {userLoans.length === 0 ? 'No liabilities currently tracked' : 'No matching loans found'}
              </h4>
              <p className="text-xs text-dhanya-secondary max-w-sm mx-auto leading-relaxed">
                {userLoans.length === 0
                  ? 'Add your home mortgage, auto loan, or student debt to track payments and simulate payoff schedules.'
                  : 'Try clearing your search query or switching the status filter tab.'}
              </p>
            </div>

            {userLoans.length === 0 ? (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditingLoan(null);
                    setIsFormModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-deep-ink hover:bg-deep-surface text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Loan</span>
                </button>
                <button
                  onClick={resetLoansToDefault}
                  className="px-4 py-2.5 bg-white hover:bg-warm-surface text-dhanya-secondary border border-dhanya-border rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Load Sample Loans</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }}
                className="px-4 py-2 bg-white border border-dhanya-border rounded-xl text-xs font-bold text-dhanya-black hover:bg-warm-surface cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLoans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                formatMoney={formatMoney}
                onOpenDetails={(l) => setSelectedLoanForDetails(l)}
                onEdit={(l) => {
                  setEditingLoan(l);
                  setIsFormModalOpen(true);
                }}
                onDelete={(id) => deleteLoan(id)}
                onRecordPayment={(id) => recordInstallmentPayment(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Loan Modal */}
      <LoanFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingLoan(null);
        }}
        onSave={(loan) => {
          addOrUpdateLoan(loan);
          setIsFormModalOpen(false);
          setEditingLoan(null);
        }}
        editingLoan={editingLoan}
        currencyCode={activeCountry.currency.code}
        countryCode={activeCountry.code}
        formatMoney={formatMoney}
      />

      {/* Individual Loan Details & Amortization Modal */}
      <LoanDetailModal
        loan={currentDetailLoan}
        isOpen={Boolean(currentDetailLoan)}
        onClose={() => setSelectedLoanForDetails(null)}
        formatMoney={formatMoney}
        onRecordPayment={(id) => recordInstallmentPayment(id)}
      />
    </div>
  );
};
