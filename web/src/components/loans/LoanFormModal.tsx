/**
 * Dhanya Add/Edit Loan Form Modal
 * Application: web
 * Form modal with strict validation, real-time EMI calculation preview, and accessible controls.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, ShieldCheck, AlertCircle, Save, Plus } from 'lucide-react';
import { UserTrackedLoan, LoanType, LoanStatus, PaymentFrequency } from '@dhanya/types';
import { calculateEmi } from '@dhanya/finance-engine';
import { validateUserTrackedLoanInput, LoanValidationErrors } from '@dhanya/validation';

interface LoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loan: UserTrackedLoan) => void;
  editingLoan?: UserTrackedLoan | null;
  currencyCode: string;
  countryCode: string;
  formatMoney: (amount: number, maxDecimals?: number) => string;
}

export const LoanFormModal: React.FC<LoanFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLoan,
  currencyCode,
  countryCode,
  formatMoney,
}) => {
  const isEditing = Boolean(editingLoan);

  // Form Field States
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('MORTGAGE');
  const [originalPrincipal, setOriginalPrincipal] = useState<string>('300000');
  const [currentPrincipal, setCurrentPrincipal] = useState<string>('280000');
  const [interestRate, setInterestRate] = useState<string>('6.5');
  const [tenureMonths, setTenureMonths] = useState<string>('360');
  const [paidInstallments, setPaidInstallments] = useState<string>('24');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('MONTHLY');
  const [status, setStatus] = useState<LoanStatus>('ACTIVE');
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [nextDueDate, setNextDueDate] = useState<string>('2026-09-01');
  const [notes, setNotes] = useState('');

  // Validation State
  const [errors, setErrors] = useState<LoanValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Populate or reset when editingLoan changes or modal opens
  useEffect(() => {
    if (editingLoan) {
      setName(editingLoan.name);
      setLender(editingLoan.lender);
      setLoanType(editingLoan.loanType);
      setOriginalPrincipal(String(editingLoan.originalPrincipal));
      setCurrentPrincipal(String(editingLoan.currentPrincipal));
      setInterestRate(String(editingLoan.interestRate));
      setTenureMonths(String(editingLoan.tenureMonths));
      setPaidInstallments(String(editingLoan.paidInstallments ?? 0));
      setPaymentFrequency(editingLoan.paymentFrequency || 'MONTHLY');
      setStatus(editingLoan.status || 'ACTIVE');
      setStartDate(editingLoan.startDate || new Date().toISOString().split('T')[0]);
      setNextDueDate(editingLoan.nextDueDate || new Date().toISOString().split('T')[0]);
      setNotes(editingLoan.notes || '');
    } else {
      setName('');
      setLender('');
      setLoanType('MORTGAGE');
      setOriginalPrincipal('350000');
      setCurrentPrincipal('350000');
      setInterestRate('6.5');
      setTenureMonths('360');
      setPaidInstallments('0');
      setPaymentFrequency('MONTHLY');
      setStatus('ACTIVE');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setNextDueDate(today);
      setNotes('');
    }
    setErrors({});
    setTouched({});
  }, [editingLoan, isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Live Deterministic Monthly EMI Preview
  const computedLiveEmi = useMemo(() => {
    const p = parseFloat(originalPrincipal) || 0;
    const r = parseFloat(interestRate) || 0;
    const n = parseInt(tenureMonths, 10) || 1;
    return calculateEmi(p, r, n);
  }, [originalPrincipal, interestRate, tenureMonths]);

  if (!isOpen) return null;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      id: editingLoan?.id,
      name,
      lender,
      loanType,
      countryCode: editingLoan?.countryCode || countryCode,
      currencyCode: editingLoan?.currencyCode || currencyCode,
      originalPrincipal: parseFloat(originalPrincipal),
      currentPrincipal: parseFloat(currentPrincipal),
      interestRate: parseFloat(interestRate),
      tenureMonths: parseInt(tenureMonths, 10),
      paidInstallments: parseInt(paidInstallments, 10),
      paymentFrequency,
      status,
      startDate,
      nextDueDate,
      monthlyEmi: computedLiveEmi,
      notes,
    };

    const validation = validateUserTrackedLoanInput(payload);

    if (!validation.isValid || !validation.sanitized) {
      setErrors(validation.errors);
      // Mark all error fields as touched
      const newTouched: Record<string, boolean> = {};
      Object.keys(validation.errors).forEach((k) => {
        newTouched[k] = true;
      });
      setTouched((prev) => ({ ...prev, ...newTouched }));
      return;
    }

    onSave(validation.sanitized as UserTrackedLoan);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-deep-ink/75 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-form-title"
    >
      <div className="w-full max-w-2xl bg-warm-surface rounded-3xl shadow-2xl border border-dhanya-border my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-white border-b border-dhanya-border flex items-center justify-between">
          <div>
            <h3 id="loan-form-title" className="text-xl font-extrabold text-dhanya-black tracking-tight">
              {isEditing ? 'Edit Liability Parameters' : 'Track New Loan Liability'}
            </h3>
            <p className="text-xs text-dhanya-secondary mt-0.5">
              Deterministic amortization parameters stored in your private local ledger.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dhanya-secondary hover:text-dhanya-black rounded-2xl hover:bg-warm-surface transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* General Errors Banner if any */}
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Section 1: Identifier & Type */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dhanya-secondary">
              1. Basic Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-name-input" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Loan Title / Nickname *
                </label>
                <input
                  id="loan-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="e.g. Primary Residence Mortgage"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all ${
                    touched.name && errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-dhanya-border'
                  }`}
                  required
                />
                {touched.name && errors.name && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.name}</span>
                )}
              </div>

              <div>
                <label htmlFor="loan-lender-input" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Lender / Provider Institution *
                </label>
                <input
                  id="loan-lender-input"
                  type="text"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  onBlur={() => handleBlur('lender')}
                  placeholder="e.g. Chase, Wells Fargo, SBI"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all ${
                    touched.lender && errors.lender ? 'border-rose-400 bg-rose-50/20' : 'border-dhanya-border'
                  }`}
                  required
                />
                {touched.lender && errors.lender && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.lender}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-type-select" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Loan Category
                </label>
                <select
                  id="loan-type-select"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as LoanType)}
                  className="w-full px-3.5 py-2.5 bg-white border border-dhanya-border rounded-xl text-xs text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all"
                >
                  <option value="MORTGAGE">Home Mortgage</option>
                  <option value="AUTO">Automobile Loan</option>
                  <option value="STUDENT">Student / Education Debt</option>
                  <option value="PERSONAL">Personal Unsecured Loan</option>
                  <option value="BUSINESS">Commercial / Business Loan</option>
                </select>
              </div>

              <div>
                <label htmlFor="loan-status-select" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Current Status
                </label>
                <select
                  id="loan-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LoanStatus)}
                  className="w-full px-3.5 py-2.5 bg-white border border-dhanya-border rounded-xl text-xs text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all"
                >
                  <option value="ACTIVE">Active (In Repayment)</option>
                  <option value="PAID_OFF">Paid in Full (Settled)</option>
                  <option value="REFINANCED">Refinanced</option>
                  <option value="DELINQUENT">Delinquent / Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Terms */}
          <div className="space-y-4 pt-4 border-t border-dhanya-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dhanya-secondary">
              2. Principal, Interest & Amortization
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-orig-principal-input" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Original Principal Amount ({currencyCode}) *
                </label>
                <input
                  id="loan-orig-principal-input"
                  type="number"
                  step="any"
                  min="1"
                  value={originalPrincipal}
                  onChange={(e) => setOriginalPrincipal(e.target.value)}
                  onBlur={() => handleBlur('originalPrincipal')}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-mono text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all ${
                    touched.originalPrincipal && errors.originalPrincipal ? 'border-rose-400 bg-rose-50/20' : 'border-dhanya-border'
                  }`}
                  required
                />
                {touched.originalPrincipal && errors.originalPrincipal && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.originalPrincipal}</span>
                )}
              </div>

              <div>
                <label htmlFor="loan-curr-principal-input" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Current Outstanding Principal ({currencyCode}) *
                </label>
                <input
                  id="loan-curr-principal-input"
                  type="number"
                  step="any"
                  min="0"
                  value={currentPrincipal}
                  onChange={(e) => setCurrentPrincipal(e.target.value)}
                  onBlur={() => handleBlur('currentPrincipal')}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-mono text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all ${
                    touched.currentPrincipal && errors.currentPrincipal ? 'border-rose-400 bg-rose-50/20' : 'border-dhanya-border'
                  }`}
                  required
                />
                {touched.currentPrincipal && errors.currentPrincipal && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.currentPrincipal}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-rate-input" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Annual Interest Rate (% APR) *
                </label>
                <input
                  id="loan-rate-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  onBlur={() => handleBlur('interestRate')}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-mono text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all ${
                    touched.interestRate && errors.interestRate ? 'border-rose-400 bg-rose-50/20' : 'border-dhanya-border'
                  }`}
                  required
                />
                {touched.interestRate && errors.interestRate && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.interestRate}</span>
                )}
              </div>

              <div>
                <label htmlFor="loan-tenure-input" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Total Loan Tenure (Months) *
                </label>
                <div className="flex gap-2">
                  <input
                    id="loan-tenure-input"
                    type="number"
                    min="1"
                    max="600"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    onBlur={() => handleBlur('tenureMonths')}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-mono text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black transition-all ${
                      touched.tenureMonths && errors.tenureMonths ? 'border-rose-400 bg-rose-50/20' : 'border-dhanya-border'
                    }`}
                    required
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTenureMonths('60')}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white border border-dhanya-border rounded-lg hover:bg-warm-surface"
                      title="5 Years"
                    >
                      5Y
                    </button>
                    <button
                      type="button"
                      onClick={() => setTenureMonths('180')}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white border border-dhanya-border rounded-lg hover:bg-warm-surface"
                      title="15 Years"
                    >
                      15Y
                    </button>
                    <button
                      type="button"
                      onClick={() => setTenureMonths('360')}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white border border-dhanya-border rounded-lg hover:bg-warm-surface"
                      title="30 Years"
                    >
                      30Y
                    </button>
                  </div>
                </div>
                {touched.tenureMonths && errors.tenureMonths && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.tenureMonths}</span>
                )}
              </div>
            </div>

            {/* Live EMI Preview Box */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-dhanya-emerald" />
                <div>
                  <span className="text-xs font-bold text-dhanya-black block">
                    Estimated Monthly EMI Outflow
                  </span>
                  <span className="text-[11px] text-dhanya-secondary">
                    Calculated deterministically via standard reducing balance
                  </span>
                </div>
              </div>
              <span className="text-xl font-extrabold font-mono text-dhanya-emerald">
                {formatMoney(computedLiveEmi)}
                <span className="text-xs font-sans text-dhanya-secondary font-normal"> /mo</span>
              </span>
            </div>
          </div>

          {/* Section 3: Schedule Dates & Ledger Progress */}
          <div className="space-y-4 pt-4 border-t border-dhanya-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dhanya-secondary">
              3. Schedule & Due Dates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="loan-start-date" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Start Date
                </label>
                <input
                  id="loan-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-dhanya-border rounded-xl text-xs font-mono text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black"
                />
              </div>

              <div>
                <label htmlFor="loan-due-date" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Next Due Date
                </label>
                <input
                  id="loan-due-date"
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-dhanya-border rounded-xl text-xs font-mono text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black"
                />
              </div>

              <div>
                <label htmlFor="loan-paid-installments" className="block text-xs font-semibold text-dhanya-black mb-1">
                  Paid Installments Count
                </label>
                <input
                  id="loan-paid-installments"
                  type="number"
                  min="0"
                  max={tenureMonths || 360}
                  value={paidInstallments}
                  onChange={(e) => setPaidInstallments(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-dhanya-border rounded-xl text-xs font-mono text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black"
                />
              </div>
            </div>

            <div>
              <label htmlFor="loan-notes-input" className="block text-xs font-semibold text-dhanya-black mb-1">
                Loan Terms / Custom Notes (Optional)
              </label>
              <textarea
                id="loan-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Conforming loan, prepayment penalty clause, fixed until 2030"
                className="w-full px-3.5 py-2.5 bg-white border border-dhanya-border rounded-xl text-xs text-dhanya-black focus:outline-none focus:ring-2 focus:ring-dhanya-black"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-dhanya-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-warm-surface border border-dhanya-border text-dhanya-black rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-deep-ink hover:bg-deep-surface text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isEditing ? 'Save Liability Changes' : 'Add to Debt Portfolio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
