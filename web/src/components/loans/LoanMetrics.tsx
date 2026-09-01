/**
 * Dhanya Loan Portfolio Metrics Component
 * Application: web
 * Displays portfolio-wide aggregates: outstanding debt, monthly outflow, weighted APR, upcoming payment, and progress.
 */

import React from 'react';
import { Lock, Calendar, AlertCircle, ArrowUpRight, CheckCircle2, DollarSign } from 'lucide-react';
import { UserTrackedLoan } from '@dhanya/types';
import { PortfolioSummaryMetrics } from '@dhanya/finance-engine';

interface LoanMetricsProps {
  summary: PortfolioSummaryMetrics;
  formatMoney: (amount: number, maxDecimals?: number) => string;
  onAddLoanClick: () => void;
}

export const LoanMetrics: React.FC<LoanMetricsProps> = ({
  summary,
  formatMoney,
  onAddLoanClick,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Debt Outstanding */}
        <div className="p-5 bg-white rounded-2xl border border-dhanya-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-dhanya-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Outstanding</span>
            <DollarSign className="w-4 h-4 text-dhanya-muted" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-dhanya-black tracking-tight pt-1">
            {formatMoney(summary.totalOutstanding)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-dhanya-muted font-mono pt-1">
            <span>{summary.activeLoanCount} active {summary.activeLoanCount === 1 ? 'liability' : 'liabilities'}</span>
            {summary.paidOffLoanCount > 0 && (
              <span className="text-dhanya-emerald font-semibold">{summary.paidOffLoanCount} paid off</span>
            )}
          </div>
        </div>

        {/* Metric 2: Total Monthly Outflow */}
        <div className="p-5 bg-white rounded-2xl border border-dhanya-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-dhanya-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Monthly EMI</span>
            <ArrowUpRight className="w-4 h-4 text-dhanya-muted" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-dhanya-emerald tracking-tight pt-1">
            {formatMoney(summary.totalMonthlyEmi)}
            <span className="text-xs font-sans text-dhanya-secondary font-normal"> /mo</span>
          </div>
          <div className="text-[11px] text-dhanya-muted font-mono pt-1">
            Contractual monthly outflow
          </div>
        </div>

        {/* Metric 3: Weighted Avg Rate */}
        <div className="p-5 bg-white rounded-2xl border border-dhanya-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-dhanya-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Weighted Avg APR</span>
            <span className="text-xs font-mono font-bold text-dhanya-secondary">%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-dhanya-black tracking-tight pt-1">
            {summary.weightedAvgRate}%
          </div>
          <div className="text-[11px] text-dhanya-muted font-mono pt-1">
            Principal-weighted interest rate
          </div>
        </div>

        {/* Metric 4: Next Upcoming Payment */}
        <div className="p-5 bg-white rounded-2xl border border-dhanya-border shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-dhanya-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Payment</span>
            <Calendar className="w-4 h-4 text-dhanya-muted" />
          </div>
          {summary.nextPaymentDue ? (
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-dhanya-black tracking-tight pt-1">
                {formatMoney(summary.nextPaymentDue.amount)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-dhanya-secondary font-mono pt-1">
                <span className="truncate max-w-[130px]" title={summary.nextPaymentDue.loanName}>
                  {summary.nextPaymentDue.loanName}
                </span>
                <span className="font-bold text-dhanya-black">{summary.nextPaymentDue.date}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-lg font-bold text-dhanya-muted pt-2">No due payments</div>
              <div className="text-[11px] text-dhanya-muted font-mono pt-1">All loans settled</div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Progress & Privacy Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Repayment Progress */}
        <div className="md:col-span-2 p-5 bg-white rounded-2xl border border-dhanya-border shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-dhanya-emerald" />
              <span className="text-xs font-bold text-dhanya-black uppercase tracking-wider">
                Portfolio Repayment Progress
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-dhanya-emerald">
              {summary.portfolioRepaidPct}% Settled
            </span>
          </div>

          <div className="w-full bg-dhanya-border-soft rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-dhanya-emerald h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.portfolioRepaidPct))}%` }}
              role="progressbar"
              aria-valuenow={summary.portfolioRepaidPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Portfolio repayment percentage"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-dhanya-secondary font-mono">
            <span>Original Portfolio: {formatMoney(summary.totalOriginalPrincipal)}</span>
            <span>Repaid to Date: {formatMoney(Math.max(0, summary.totalOriginalPrincipal - summary.totalOutstanding))}</span>
          </div>
        </div>

        {/* Local Storage Privacy Card */}
        <div className="p-5 bg-white rounded-2xl border border-dhanya-emerald/30 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-dhanya-emerald">
              <Lock className="w-3.5 h-3.5" /> Client-Side Encrypted
            </div>
            <p className="text-xs text-dhanya-secondary mt-1.5 leading-relaxed">
              100% deterministic local calculation. Zero personal liability telemetry transmitted.
            </p>
          </div>
          <div className="text-[11px] font-mono text-dhanya-muted pt-2 border-t border-dhanya-border-soft mt-2">
            Local Browser Storage • No Cloud Sync
          </div>
        </div>
      </div>
    </div>
  );
};
