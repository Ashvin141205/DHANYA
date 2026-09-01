import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

type Loan = {
  id: string;
  userId: string;
  name: string;
  lender: string;
  loanType: string;
  countryCode: string;
  currencyCode: string;
  originalPrincipal: number;
  currentPrincipal: number;
  interestRate: number;
  startDate: string;
  tenureMonths: number;
  monthlyEmi: number;
  nextDueDate: string;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  paymentFrequency: string;
  status: string;
  notes: string;
  lastUpdated: string;
};

type Ledger = {
  loans: Record<string, Loan>;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const ledgerPath = path.resolve(process.cwd(), 'data', 'dhanya_ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) as Ledger;

const loans = Object.values(ledger.loans ?? {});

const pool = new Pool({
  connectionString: databaseUrl,
});

async function main(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const loan of loans) {
      await client.query(
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
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
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
        `,
        [
          loan.id,
          loan.userId,
          loan.name,
          loan.lender,
          loan.loanType,
          loan.countryCode,
          loan.currencyCode,
          loan.originalPrincipal,
          loan.currentPrincipal,
          loan.interestRate,
          loan.startDate,
          loan.tenureMonths,
          loan.monthlyEmi,
          loan.nextDueDate,
          loan.totalInstallments,
          loan.paidInstallments,
          loan.remainingInstallments,
          loan.paymentFrequency,
          loan.status,
          loan.notes,
          loan.lastUpdated,
        ],
      );
    }

    await client.query('COMMIT');

    console.log(`Successfully migrated ${loans.length} loans.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Loan migration failed:', error);
  process.exit(1);
});