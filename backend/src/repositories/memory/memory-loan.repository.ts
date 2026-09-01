/**
 * Dhanya In-Memory Loan Repository (Isolated Tenant Map)
 * Application: backend
 */

import { UserTrackedLoan } from '@dhanya/types';
import { ILoanRepository } from '../interfaces';

export class MemoryLoanRepository implements ILoanRepository {
  // Map of userId -> Map of loanId -> UserTrackedLoan
  private userLoans: Map<string, Map<string, UserTrackedLoan>> = new Map();

  private getUserMap(userId: string): Map<string, UserTrackedLoan> {
    let map = this.userLoans.get(userId);
    if (!map) {
      map = new Map();
      this.userLoans.set(userId, map);
    }
    return map;
  }

  public async findAllByUserId(userId: string): Promise<UserTrackedLoan[]> {
    const map = this.getUserMap(userId);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }

  public async findById(id: string, userId: string): Promise<UserTrackedLoan | null> {
    const map = this.getUserMap(userId);
    const loan = map.get(id);
    return loan ? { ...loan } : null;
  }

  public async save(loan: UserTrackedLoan, userId: string): Promise<UserTrackedLoan> {
    const map = this.getUserMap(userId);
    const scopedLoan: UserTrackedLoan = {
      ...loan,
      userId,
      lastUpdated: new Date().toISOString(),
    };
    map.set(scopedLoan.id, scopedLoan);
    return { ...scopedLoan };
  }

  public async update(
    id: string,
    updates: Partial<UserTrackedLoan>,
    userId: string
  ): Promise<UserTrackedLoan | null> {
    const map = this.getUserMap(userId);
    const existing = map.get(id);
    if (!existing) return null;

    const updated: UserTrackedLoan = {
      ...existing,
      ...updates,
      id, // protect ID
      userId, // protect ownership
      lastUpdated: new Date().toISOString(),
    };

    map.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const map = this.getUserMap(userId);
    return map.delete(id);
  }
}
