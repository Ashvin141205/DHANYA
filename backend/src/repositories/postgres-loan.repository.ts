import { Pool } from 'pg';
import { UserTrackedLoan } from '@dhanya/types';
import { ILoanRepository } from './interfaces';

export class PostgresLoanRepository implements ILoanRepository {
  constructor(private readonly pool: Pool) {}

  public async findAllByUserId(userId: string): Promise<UserTrackedLoan[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM loans
      WHERE user_id = $1
      ORDER BY last_updated DESC
      `,
      [userId],
    );

    return result.rows.map(this.mapRow);
  }

  public async findById(
    id: string,
    userId: string,
  ): Promise<UserTrackedLoan | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM loans
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  public async save(
    loan: UserTrackedLoan,
    userId: string,
  ): Promise<UserTrackedLoan> {
    const scopedLoan: UserTrackedLoan = {
      ...loan,
      userId,
      lastUpdated: new Date().toISOString(),
    };

    const result = await this.pool.query(
      `
      INSERT INTO loans (
        id,
        user_id,
        name,
        lender,
        loan_type,
        country_code,
        currency_code,
        original_principal,
        current_principal,
        interest_rate,
        start_date,
        tenure_months,
        monthly_emi,
        next_due_date,
        total_installments,
        paid_installments,
        remaining_installments,
        payment_frequency,
        status,
        notes,
        last_updated
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21
      )
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        lender = EXCLUDED.lender,
        loan_type = EXCLUDED.loan_type,
        country_code = EXCLUDED.country_code,
        currency_code = EXCLUDED.currency_code,
        original_principal = EXCLUDED.original_principal,
        current_principal = EXCLUDED.current_principal,
        interest_rate = EXCLUDED.interest_rate,
        start_date = EXCLUDED.start_date,
        tenure_months = EXCLUDED.tenure_months,
        monthly_emi = EXCLUDED.monthly_emi,
        next_due_date = EXCLUDED.next_due_date,
        total_installments = EXCLUDED.total_installments,
        paid_installments = EXCLUDED.paid_installments,
        remaining_installments = EXCLUDED.remaining_installments,
        payment_frequency = EXCLUDED.payment_frequency,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        last_updated = EXCLUDED.last_updated
      RETURNING *
      `,
      [
        scopedLoan.id,
        scopedLoan.userId,
        scopedLoan.name,
        scopedLoan.lender,
        scopedLoan.loanType,
        scopedLoan.countryCode,
        scopedLoan.currencyCode,
        scopedLoan.originalPrincipal,
        scopedLoan.currentPrincipal,
        scopedLoan.interestRate,
        scopedLoan.startDate,
        scopedLoan.tenureMonths,
        scopedLoan.monthlyEmi,
        scopedLoan.nextDueDate,
        scopedLoan.totalInstallments,
        scopedLoan.paidInstallments,
        scopedLoan.remainingInstallments,
        scopedLoan.paymentFrequency,
        scopedLoan.status,
        scopedLoan.notes,
        scopedLoan.lastUpdated,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  public async update(
    id: string,
    updates: Partial<UserTrackedLoan>,
    userId: string,
  ): Promise<UserTrackedLoan | null> {
    const existingResult = await this.pool.query(
      `
      SELECT *
      FROM loans
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      `,
      [id, userId],
    );

    if (existingResult.rows.length === 0) {
      return null;
    }

    const existing = this.mapRow(existingResult.rows[0]);

    const updated: UserTrackedLoan = {
      ...existing,
      ...updates,
      id,
      userId,
      lastUpdated: new Date().toISOString(),
    };

    const result = await this.pool.query(
      `
      UPDATE loans
      SET
        name = $3,
        lender = $4,
        loan_type = $5,
        country_code = $6,
        currency_code = $7,
        original_principal = $8,
        current_principal = $9,
        interest_rate = $10,
        start_date = $11,
        tenure_months = $12,
        monthly_emi = $13,
        next_due_date = $14,
        total_installments = $15,
        paid_installments = $16,
        remaining_installments = $17,
        payment_frequency = $18,
        status = $19,
        notes = $20,
        last_updated = $21
      WHERE id = $1 AND user_id = $2
      RETURNING *
      `,
      [
        id,
        userId,
        updated.name,
        updated.lender,
        updated.loanType,
        updated.countryCode,
        updated.currencyCode,
        updated.originalPrincipal,
        updated.currentPrincipal,
        updated.interestRate,
        updated.startDate,
        updated.tenureMonths,
        updated.monthlyEmi,
        updated.nextDueDate,
        updated.totalInstallments,
        updated.paidInstallments,
        updated.remainingInstallments,
        updated.paymentFrequency,
        updated.status,
        updated.notes,
        updated.lastUpdated,
      ],
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `
      DELETE FROM loans
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  private mapRow(row: any): UserTrackedLoan {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      lender: row.lender,
      loanType: row.loan_type,
      countryCode: row.country_code,
      currencyCode: row.currency_code,
      originalPrincipal: Number(row.original_principal),
      currentPrincipal: Number(row.current_principal),
      interestRate: Number(row.interest_rate),
      startDate: row.start_date instanceof Date
        ? row.start_date.toISOString().slice(0, 10)
        : String(row.start_date),
      tenureMonths: Number(row.tenure_months),
      monthlyEmi: Number(row.monthly_emi),
      nextDueDate: row.next_due_date instanceof Date
        ? row.next_due_date.toISOString().slice(0, 10)
        : String(row.next_due_date),
      totalInstallments: Number(row.total_installments),
      paidInstallments: Number(row.paid_installments),
      remainingInstallments: Number(row.remaining_installments),
      paymentFrequency: row.payment_frequency,
      status: row.status,
      notes: row.notes,
      lastUpdated: new Date(row.last_updated).toISOString(),
    };
  }
}