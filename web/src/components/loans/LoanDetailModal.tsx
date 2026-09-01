/**
 * Dhanya Individual Loan Details & Amortization Modal
 * Application: web
 * Displays comprehensive loan metadata, deterministic payment tracking, and full amortization schedule.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  CreditCard,
  CheckCircle2,
  Download,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { UserTrackedLoan } from '@dhanya/types';
import { calculateLoanSchedule, calculateEmi } from '@dhanya/finance-engine';

interface LoanDetailModalProps {
  loan: UserTrackedLoan | null;
  isOpen: boolean;
  onClose: () => void;
  formatMoney: (amount: number, maxDecimals?: number) => string;
  onRecordPayment: (id: string) => void;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
  loan,
  isOpen,
  onClose,
  formatMoney,
  onRecordPayment,
}) => {
  const [schedulePage, setSchedulePage] = useState(1);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState(false);
  const rowsPerPage = 12;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !loan) return null;

  const isPaidOff = loan.status === 'PAID_OFF' || loan.currentPrincipal <= 0.01;
  const totalInstallments = loan.totalInstallments || loan.tenureMonths;
  const paidInstallments = loan.paidInstallments !== undefined
    ? loan.paidInstallments
    : Math.min(totalInstallments, Math.max(0, Math.round(((loan.originalPrincipal - loan.currentPrincipal) / (loan.originalPrincipal || 1)) * totalInstallments)));
  const remainingInstallments = loan.remainingInstallments !== undefined
    ? loan.remainingInstallments
    : Math.max(0, totalInstallments - paidInstallments);

  const principalRepaid = Math.max(0, loan.originalPrincipal - loan.currentPrincipal);
  const progressPct = Math.min(100, Math.max(0, Number(((principalRepaid / (loan.originalPrincipal || 1)) * 100).toFixed(1))));

  // Deterministic Amortization Schedule from Finance Engine
  const amortizationResult = useMemo(() => {
    return calculateLoanSchedule(
      loan.originalPrincipal,
      loan.interestRate,
      loan.tenureMonths / 12
    );
  }, [loan.originalPrincipal, loan.interestRate, loan.tenureMonths]);

  // Next Installment Breakdown (Interest vs Principal)
  const nextPaymentBreakdown = useMemo(() => {
    const monthlyRate = (loan.interestRate || 0) / 100 / 12;
    const interestPortion = Number((loan.currentPrincipal * monthlyRate).toFixed(2));
    const emi = loan.monthlyEmi > 0 ? loan.monthlyEmi : calculateEmi(loan.originalPrincipal, loan.interestRate, loan.tenureMonths);
    const principalPortion = Number(Math.min(loan.currentPrincipal, Math.max(0, emi - interestPortion)).toFixed(2));
    return { interestPortion, principalPortion, emi };
  }, [loan.currentPrincipal, loan.interestRate, loan.monthlyEmi, loan.originalPrincipal, loan.tenureMonths]);

  // Pagination for amortization table
  const totalPages = Math.ceil(amortizationResult.schedule.length / rowsPerPage);
  const displayedSchedule = amortizationResult.schedule.slice(
    (schedulePage - 1) * rowsPerPage,
    schedulePage * rowsPerPage
  );

  const handleRecordPayment = () => {
    onRecordPayment(loan.id);
    setPaymentSuccessMessage(true);
    setTimeout(() => setPaymentSuccessMessage(false), 3000);
  };

  // Export Amortization Schedule as CSV
  const handleExportScheduleCsv = () => {
    const headers = ['Month', 'Year', 'Payment', 'Principal Paid', 'Interest Paid', 'Remaining Balance'];
    const rows = amortizationResult.schedule.map((r) => [
      r.month,
      r.year,
      r.payment,
      r.principalPaid,
      r.interestPaid,
      r.remainingBalance,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${loan.name.replace(/\s+/g, '_')}_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-ink/75 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-modal-title"
    >
      <div className="w-full max-w-4xl bg-warm-surface rounded-3xl shadow-2xl border border-dhanya-border my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-dhanya-border flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-warm-surface border border-dhanya-border text-dhanya-black">
                {loan.loanType}
              </span>
              <span className="text-xs font-semibold text-dhanya-secondary">{loan.lender}</span>
              <span className="text-dhanya-border">•</span>
              <span className="text-xs font-mono text-dhanya-secondary">
                {loan.countryCode} ({loan.currencyCode})
              </span>
            </div>
            <h2 id="loan-modal-title" className="text-2xl sm:text-3xl font-extrabold text-dhanya-black tracking-tight">
              {loan.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-dhanya-secondary hover:text-dhanya-black rounded-2xl hover:bg-warm-surface transition-colors cursor-pointer"
            aria-label="Close loan details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-dhanya-border">
              <span className="text-xs text-dhanya-secondary font-medium block">Current Balance</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-dhanya-black block mt-1">
                {formatMoney(loan.currentPrincipal)}
              </span>
              <span className="text-[11px] text-dhanya-muted font-mono block mt-0.5">
                Orig: {formatMoney(loan.originalPrincipal)}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-dhanya-border">
              <span className="text-xs text-dhanya-secondary font-medium block">Contractual Monthly EMI</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-dhanya-emerald block mt-1">
                {formatMoney(loan.monthlyEmi)}
              </span>
              <span className="text-[11px] text-dhanya-muted font-mono block mt-0.5">
                {loan.paymentFrequency || 'MONTHLY'}
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-dhanya-border">
              <span className="text-xs text-dhanya-secondary font-medium block">Interest Rate (APR)</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-dhanya-black block mt-1">
                {loan.interestRate}%
              </span>
              <span className="text-[11px] text-dhanya-muted font-mono block mt-0.5">
                Fixed Annual
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-dhanya-border">
              <span className="text-xs text-dhanya-secondary font-medium block">Installments Progress</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-dhanya-black block mt-1">
                {paidInstallments} / {totalInstallments}
              </span>
              <span className="text-[11px] text-dhanya-muted font-mono block mt-0.5">
                {remainingInstallments} remaining
              </span>
            </div>
          </div>

          {/* Repayment Progress Bar & Breakdown */}
          <div className="p-6 bg-white rounded-2xl border border-dhanya-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-dhanya-black">Principal Repayment Status</h4>
                <p className="text-xs text-dhanya-secondary">
                  Started {loan.startDate} • Next Contractual Due Date: <strong>{loan.nextDueDate}</strong>
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-dhanya-emerald px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
                {progressPct}% Paid
              </span>
            </div>

            <div className="w-full bg-dhanya-border-soft rounded-full h-3 overflow-hidden">
              <div
                className="bg-dhanya-emerald h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs font-mono">
              <div>
                <span className="text-dhanya-muted block">Principal Repaid</span>
                <span className="font-bold text-dhanya-black">{formatMoney(principalRepaid)}</span>
              </div>
              <div>
                <span className="text-dhanya-muted block">Remaining Principal</span>
                <span className="font-bold text-dhanya-black">{formatMoney(loan.currentPrincipal)}</span>
              </div>
              <div>
                <span className="text-dhanya-muted block">Total Lifetime Interest</span>
                <span className="font-bold text-dhanya-secondary">{formatMoney(amortizationResult.totalInterest)}</span>
              </div>
            </div>
          </div>

          {/* Payment Tracking & Action Box */}
          <div className="p-6 bg-deep-ink text-white rounded-2xl border border-deep-surface shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-dhanya-champagne" />
                  <span className="text-xs font-mono font-bold text-dhanya-champagne uppercase tracking-wider">
                    Payment Ledger Tracking
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">Record Monthly Installment</h4>
                <p className="text-xs text-slate-300 max-w-lg">
                  Next due payment of <strong className="text-white font-mono">{formatMoney(nextPaymentBreakdown.emi)}</strong> is scheduled for <strong className="text-white font-mono">{loan.nextDueDate}</strong>.
                </p>
              </div>

              {!isPaidOff && (
                <button
                  onClick={handleRecordPayment}
                  className="px-6 py-3 bg-dhanya-emerald hover:bg-dhanya-emerald-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record Installment Paid</span>
                </button>
              )}
            </div>

            {/* Next Payment Estimated Split */}
            {!isPaidOff && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-deep-surface/80 rounded-xl border border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Principal Portion</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatMoney(nextPaymentBreakdown.principalPortion)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Interest Portion</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {formatMoney(nextPaymentBreakdown.interestPortion)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[11px]">Post-Payment Balance</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatMoney(Math.max(0, loan.currentPrincipal - nextPaymentBreakdown.principalPortion))}
                  </span>
                </div>
              </div>
            )}

            {paymentSuccessMessage && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Payment successfully recorded! Outstanding principal updated and next due date advanced.</span>
              </div>
            )}

            {/* Data Honesty Notice */}
            <div className="flex items-start gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/10">
              <Info className="w-4 h-4 shrink-0 text-dhanya-champagne mt-0.5" />
              <span>
                <strong>Data Honesty Notice:</strong> Payment provider integration required for automated banking debit. This button records a client-side ledger entry and calculates exact reducing balance math locally.
              </span>
            </div>
          </div>

          {/* Amortization Schedule Table */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-bold text-dhanya-black">Amortization Schedule</h4>
                <p className="text-xs text-dhanya-secondary">
                  Deterministic month-by-month principal and interest breakdown
                </p>
              </div>

              <button
                onClick={handleExportScheduleCsv}
                className="px-4 py-2 bg-white hover:bg-warm-surface text-dhanya-black border border-dhanya-border rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer w-fit"
              >
                <Download className="w-3.5 h-3.5 text-dhanya-secondary" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-dhanya-border overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono" role="table">
                  <thead className="bg-warm-surface border-b border-dhanya-border text-dhanya-secondary font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Principal</th>
                      <th className="px-4 py-3">Interest</th>
                      <th className="px-4 py-3 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dhanya-border-soft">
                    {displayedSchedule.map((row) => {
                      const isCurrent = row.month === paidInstallments + 1;
                      return (
                        <tr
                          key={row.month}
                          className={`hover:bg-warm-surface/60 transition-colors ${
                            isCurrent ? 'bg-emerald-50/50 font-bold' : ''
                          }`}
                        >
                          <td className="px-4 py-2.5 text-dhanya-black">
                            {row.month}
                            {isCurrent && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-dhanya-emerald text-white font-sans">
                                Current
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-dhanya-secondary">{row.year}</td>
                          <td className="px-4 py-2.5 text-dhanya-black">{formatMoney(row.payment)}</td>
                          <td className="px-4 py-2.5 text-dhanya-emerald font-semibold">{formatMoney(row.principalPaid)}</td>
                          <td className="px-4 py-2.5 text-dhanya-secondary">{formatMoney(row.interestPaid)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-dhanya-black">
                            {formatMoney(row.remainingBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-3 bg-warm-surface border-t border-dhanya-border flex items-center justify-between text-xs">
                  <span className="text-dhanya-secondary font-mono text-[11px]">
                    Showing months {(schedulePage - 1) * rowsPerPage + 1}–
                    {Math.min(schedulePage * rowsPerPage, amortizationResult.schedule.length)} of {amortizationResult.schedule.length}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                      disabled={schedulePage === 1}
                      className="p-1.5 bg-white rounded-lg border border-dhanya-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warm-ivory cursor-pointer"
                      aria-label="Previous schedule page"
                    >
                      <ChevronLeft className="w-4 h-4 text-dhanya-black" />
                    </button>
                    <span className="px-2 font-mono font-bold text-dhanya-black text-xs">
                      {schedulePage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setSchedulePage((p) => Math.min(totalPages, p + 1))}
                      disabled={schedulePage === totalPages}
                      className="p-1.5 bg-white rounded-lg border border-dhanya-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warm-ivory cursor-pointer"
                      aria-label="Next schedule page"
                    >
                      <ChevronRight className="w-4 h-4 text-dhanya-black" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Card */}
          {loan.notes && (
            <div className="p-4 bg-white rounded-2xl border border-dhanya-border space-y-1">
              <span className="text-xs font-bold text-dhanya-secondary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Loan Terms & Notes
              </span>
              <p className="text-xs text-dhanya-black leading-relaxed">{loan.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-dhanya-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-deep-ink hover:bg-deep-surface text-white rounded-2xl text-xs font-bold cursor-pointer transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
