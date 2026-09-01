/**
 * Dhanya Individual Loan Card Component
 * Application: web
 * Displays individual loan summary, repayment progress, due date, and quick actions.
 */

import React, { useState } from 'react';
import {
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { UserTrackedLoan } from '@dhanya/types';

interface LoanCardProps {
  loan: UserTrackedLoan;
  formatMoney: (amount: number, maxDecimals?: number) => string;
  onOpenDetails: (loan: UserTrackedLoan) => void;
  onEdit: (loan: UserTrackedLoan) => void;
  onDelete: (id: string) => void;
  onRecordPayment: (id: string) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  formatMoney,
  onOpenDetails,
  onEdit,
  onDelete,
  onRecordPayment,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [justRecorded, setJustRecorded] = useState(false);

  const isPaidOff = loan.status === 'PAID_OFF' || loan.currentPrincipal <= 0.01;
  const paidPrincipal = Math.max(0, loan.originalPrincipal - loan.currentPrincipal);
  const progressPct = Math.min(
    100,
    Math.max(0, Number(((paidPrincipal / (loan.originalPrincipal || 1)) * 100).toFixed(1)))
  );

  const totalInstallments = loan.totalInstallments || loan.tenureMonths;
  const paidInstallments = loan.paidInstallments !== undefined
    ? loan.paidInstallments
    : Math.min(totalInstallments, Math.max(0, Math.round(((loan.originalPrincipal - loan.currentPrincipal) / (loan.originalPrincipal || 1)) * totalInstallments)));
  const remainingInstallments = loan.remainingInstallments !== undefined
    ? loan.remainingInstallments
    : Math.max(0, totalInstallments - paidInstallments);

  const handleRecordPayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRecordPayment(loan.id);
    setJustRecorded(true);
    setTimeout(() => setJustRecorded(false), 2200);
  };

  const getStatusBadge = () => {
    if (isPaidOff) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-dhanya-emerald border border-dhanya-emerald/30">
          <CheckCircle2 className="w-3 h-3" /> PAID IN FULL
        </span>
      );
    }
    if (loan.status === 'DELINQUENT') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
          OVERDUE
        </span>
      );
    }
    if (loan.status === 'REFINANCED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
          REFINANCED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-dhanya-border text-dhanya-black">
        ACTIVE
      </span>
    );
  };

  const getLoanTypeLabel = () => {
    switch (loan.loanType) {
      case 'MORTGAGE': return 'Mortgage';
      case 'AUTO': return 'Auto Loan';
      case 'STUDENT': return 'Student Debt';
      case 'PERSONAL': return 'Personal Loan';
      case 'BUSINESS': return 'Business';
      default: return loan.loanType;
    }
  };

  return (
    <div
      className={`bg-warm-surface rounded-3xl p-5 sm:p-7 border transition-all duration-200 flex flex-col justify-between space-y-5 ${
        isPaidOff
          ? 'border-dhanya-emerald/40 bg-emerald-50/10'
          : 'border-dhanya-border hover:border-dhanya-black/70 shadow-2xs'
      }`}
    >
      {/* Top Header: Category, Lender & Actions */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-dhanya-border text-dhanya-secondary">
                {getLoanTypeLabel()}
              </span>
              {getStatusBadge()}
              <span className="text-xs text-dhanya-secondary font-medium truncate max-w-[150px]" title={loan.lender}>
                {loan.lender}
              </span>
            </div>
            <h4
              onClick={() => onOpenDetails(loan)}
              className="text-lg font-extrabold text-dhanya-black tracking-tight cursor-pointer hover:text-dhanya-emerald transition-colors"
            >
              {loan.name}
            </h4>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(loan)}
              className="p-2 text-dhanya-muted hover:text-dhanya-black rounded-xl hover:bg-white transition-colors cursor-pointer"
              title="Edit loan parameters"
              aria-label={`Edit ${loan.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 text-dhanya-muted hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete loan"
              aria-label={`Delete ${loan.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loan.notes && (
          <p className="text-xs text-dhanya-muted italic line-clamp-1">
            "{loan.notes}"
          </p>
        )}
      </div>

      {/* Financial Numbers Grid */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dhanya-border">
        <div>
          <span className="text-[11px] text-dhanya-secondary block font-medium">Outstanding Balance</span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-dhanya-black block mt-0.5 tracking-tight">
            {formatMoney(loan.currentPrincipal)}
          </span>
          <span className="text-[10px] text-dhanya-muted font-mono block mt-0.5">
            Orig: {formatMoney(loan.originalPrincipal)}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-dhanya-secondary block font-medium">Monthly Installment (EMI)</span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-dhanya-emerald block mt-0.5 tracking-tight">
            {formatMoney(loan.monthlyEmi)}
          </span>
          <span className="text-[10px] text-dhanya-muted font-mono block mt-0.5">
            {loan.paymentFrequency || 'MONTHLY'} • {loan.interestRate}% APR
          </span>
        </div>
      </div>

      {/* Repayment Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-dhanya-secondary">
          <span className="font-mono text-[11px]">
            {paidInstallments} of {totalInstallments} paid ({remainingInstallments} remaining)
          </span>
          <span className="font-mono font-bold text-dhanya-black">{progressPct}% Repaid</span>
        </div>
        <div className="w-full bg-dhanya-border-soft rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isPaidOff ? 'bg-dhanya-emerald' : 'bg-dhanya-emerald'
            }`}
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${loan.name} repayment progress`}
          />
        </div>
      </div>

      {/* Footer Details & Quick Payment Button */}
      <div className="pt-3 border-t border-dhanya-border space-y-3">
        <div className="flex items-center justify-between text-xs text-dhanya-secondary">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-dhanya-muted" />
            {isPaidOff ? 'Completed' : `Due: ${loan.nextDueDate}`}
          </span>

          <button
            onClick={() => onOpenDetails(loan)}
            className="text-xs font-bold text-dhanya-black hover:text-dhanya-emerald flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Schedule & Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Button Row */}
        {!isPaidOff && (
          <div className="pt-1">
            <button
              onClick={handleRecordPayment}
              disabled={justRecorded}
              className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                justRecorded
                  ? 'bg-dhanya-emerald text-white shadow-xs'
                  : 'bg-white hover:bg-warm-surface text-dhanya-black border border-dhanya-border shadow-2xs hover:border-dhanya-black'
              }`}
              title="Record that the contractual monthly installment was paid (Client-side tracking)"
            >
              {justRecorded ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Installment Recorded ({formatMoney(loan.monthlyEmi)})</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-dhanya-secondary" />
                  <span>Record Payment ({formatMoney(loan.monthlyEmi)})</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-dhanya-muted block text-center mt-1">
              Local tracking action • No bank debit initiated
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-dhanya-border space-y-4 shadow-xl">
            <h5 className="text-base font-bold text-dhanya-black">Delete Liability Record?</h5>
            <p className="text-xs text-dhanya-secondary leading-relaxed">
              Are you sure you want to remove <strong>{loan.name}</strong> ({loan.lender}) from your local debt portfolio? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dhanya-border">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-warm-surface hover:bg-warm-ivory text-dhanya-secondary rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(loan.id);
                  setShowConfirmDelete(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
