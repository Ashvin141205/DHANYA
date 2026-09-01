/**
 * Dhanya Finance Engine Deterministic Math Unit Tests
 */

import assert from 'node:assert';
import test from 'node:test';

// Test EMI Formula directly
function calculateEmi(principal, annualRatePct, tenureMonths) {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return principal / tenureMonths;

  const monthlyRate = annualRatePct / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Number(emi.toFixed(2));
}

test('calculateEmi calculates accurate monthly installment', () => {
  // $100,000 at 6.0% for 360 months should be exactly $599.55
  const emi = calculateEmi(100000, 6.0, 360);
  assert.strictEqual(emi, 599.55);
});

test('calculateEmi handles zero interest rate correctly', () => {
  const emi = calculateEmi(120000, 0, 120);
  assert.strictEqual(emi, 1000);
});
