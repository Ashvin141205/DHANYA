/**
 * Dhanya Durable Loan Repository (Multi-Tenant Scoped)
 * Application: backend
 */

import { UserTrackedLoan } from '@dhanya/types';
import { ILoanRepository } from '../interfaces';
import { DurableDatabaseEngine } from './durable-db';

export class DurableLoanRepository implements ILoanRepository {
  private engine: DurableDatabaseEngine;

  constructor(engine: DurableDatabaseEngine) {
    this.engine = engine;
  }

  public async findAllByUserId(userId: string): Promise<UserTrackedLoan[]> {
    const schema = this.engine.getSchema();
    return Object.values(schema.loans)
      .filter((loan) => loan.userId === userId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  public async findById(id: string, userId: string): Promise<UserTrackedLoan | null> {
    const schema = this.engine.getSchema();
    const loan = schema.loans[id];
    if (!loan || loan.userId !== userId) {
      return null;
    }
    return { ...loan };
  }

  public async save(loan: UserTrackedLoan, userId: string): Promise<UserTrackedLoan> {
    const schema = this.engine.getSchema();
    const scopedLoan: UserTrackedLoan = {
      ...loan,
      userId,
      lastUpdated: new Date().toISOString(),
    };

    schema.loans[scopedLoan.id] = scopedLoan;
    this.engine.persist();

    return { ...scopedLoan };
  }

  public async update(
    id: string,
    updates: Partial<UserTrackedLoan>,
    userId: string
  ): Promise<UserTrackedLoan | null> {
    const schema = this.engine.getSchema();
    const existing = schema.loans[id];
    if (!existing || existing.userId !== userId) {
      return null;
    }

    const updated: UserTrackedLoan = {
      ...existing,
      ...updates,
      id,
      userId,
      lastUpdated: new Date().toISOString(),
    };

    schema.loans[id] = updated;
    this.engine.persist();

    return { ...updated };
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const schema = this.engine.getSchema();
    const existing = schema.loans[id];
    if (!existing || existing.userId !== userId) {
      return false;
    }

    delete schema.loans[id];
    this.engine.persist();
    return true;
  }
}
