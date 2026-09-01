# DHANYA SYSTEM AUDIT & ARCHITECTURAL TRANSITION PLAN
**Document ID:** `DHANYA-AUDIT-v1.0`  
**Target Domain:** `dhanya.com`  
**System Classification:** Global Financial Intelligence & Decision-Support Platform  
**Audit Date:** August 2026  
**Auditor:** Principal Software Architect & Senior Product Engineer  

---

## 1. Executive Summary & Current Architecture
The current Dhanya workspace represents a fast, high-fidelity monolithic prototype built on React 19, TypeScript, Vite, Tailwind CSS, and Express. It contains high-precision client-side deterministic financial engines and initial views for multi-country calculations, intelligence feeds, debt command, and an admin workspace.

However, the codebase currently operates largely in a hybrid in-memory state model:
* The backend (`server.ts` + `src/backend/store.ts`) relies on an ephemeral in-memory singleton class (`DhanyaDataEngine`).
* The frontend relies on React context (`FinancialContext.tsx`) syncing against the in-memory backend without durable database persistence, session isolation, or authentic role-based access control (RBAC).
* The directory structure is partially co-located under `/src` without clean isolation between the public web client (`/web`), the secure enterprise backend API (`/backend`), and the restricted back-office actuarial control plane (`/admin`).

---

## 2. What Is Working (Preserve & Protect)
1. **Deterministic Calculation Core (`src/core/engine/deterministic-math.ts`)**:
   - High-precision, zero-hallucination math implementations:
     - Equated Monthly Installment (EMI) & full amortization schedule with prepayment acceleration.
     - Systematic Investment Plan (SIP) with annual Step-Up and inflation discounting.
     - Multi-bracket Progressive Income Tax engine with deduction offsets.
     - Refinance / Balance Transfer breakeven and net lifetime interest savings.
     - FIRE (Financial Independence, Retire Early) milestone projection with Lean/Standard/Fat FIRE numbers.
   - Pure, stateless functions completely free of AI hallucinations.
2. **Jurisdiction & Source Metadata Schema (`src/core/jurisdictions/registry.ts`)**:
   - Multi-country profiles (US, CA, IN, GB, AU, SG, DE, AE) with currency formats, central bank references, and tax authority links.
   - Real institutional provenance records (Federal Reserve, IRS, Bank of Canada, RBI, HMRC, Monetary Authority of Singapore, European Central Bank).
3. **Interactive Calculator Views (`src/web/pages/calculators/`)**:
   - `MortgageLoanCalculator.tsx`, `SIPWealthCalculator.tsx`, `ProgressiveTaxCalculator.tsx`, `FireRetirementCalculator.tsx`.
   - Rich interactive sliders, tabular amortization views, and SVG/Recharts visual breakdowns.
4. **Loan Command Center (`src/web/pages/LoanCommandCenterPage.tsx`)**:
   - Multi-loan portfolio tracker, debt snowball/avalanche prioritization, and monthly cash flow obligations.
5. **Universal Intent & Navigation Modals (`src/shared/components/`)**:
   - Universal search dialog with instant keyword matching and quick jumping across calculators, intelligence, and sources.

---

## 3. What Is Incomplete / Ephemeral / Prototype-Level
1. **Persistence Layer**: Data in `src/backend/store.ts` resides solely in Node process memory. Server restarts wipe loan records, custom rules, and audit logs.
2. **User Authentication & Tenant Isolation**: Currently, loan data is shared globally across whoever accesses the `/api/v1/loans` endpoint. There is no multi-tenant isolation or authenticated user session.
3. **Admin Security Gate**: Admin actions (`x-admin-user` header) are completely spoofable; no signature, token validation, or RBAC permission gates exist.
4. **Export & Simulation Engines**: Amortization schedules and tax reports lack PDF/CSV export generation endpoints.
5. **Explain & Decision Layer**: Calculators provide mathematical outputs but lack the full "Calculate → Explain → Compare → Current Data → What Changed → Personalize → Recommend → Act" recommendation flow.

---

## 4. Architectural Flaws
1. **Monolithic Directory Coupling**: Frontend and backend types share direct imports into `src/core`, but frontend components directly import mock fixtures and backend router files are mixed into frontend bundle chains.
2. **Lack of Tier Isolation**: The Admin dashboard (`/src/admin`) is bundled alongside the public web app, increasing bundle size and leaking administrative interfaces to unauthenticated clients.
3. **No Schema Validation Layer**: API endpoints accept arbitrary JSON bodies without Zod / strict type validator boundaries.
4. **No Rate Limiting or Audit Tamper-Resistance**: In-memory audit logs have a fixed length cap (200) and can be overwritten or lost on restart.

---

## 5. Security, Privacy & Dhanya Policy Compliance Audit
* **Privacy Violation Risk**: Sensitive financial balances, loan numbers, and household income must adhere to a strict Local-First / Zero-Knowledge Encryption standard or isolated user databases with strict row-level security.
* **Administrative Impersonation**: Header `x-admin-user` allows any client to publish intelligence updates or alter regulatory benchmarks.
* **AI Separation Guarantee**: The deterministic engine must remain strictly isolated from LLM output. Gemini should only be invoked for natural language explanations or summaries, never for mathematical calculation.

---

## 6. Database & Persistence Audit
* **Current State**: Single in-memory JavaScript class (`DhanyaDataEngine`).
* **Target Architecture**:
  - Structured storage with repository interfaces (`IRulesRepository`, `ISourceRepository`, `ILoanRepository`, `IAuditRepository`).
  - Durable schema with versioned migrations, timestamps, and relational integrity.
  - Browser local-first encrypted cache fallback for offline and privacy-first calculation sessions.

---

## 7. Deterministic Calculation Engine Audit
* **Precision**: Uses standard floating point numbers; requires verification with monetary round-off standards (e.g. `Intl.NumberFormat` rounding and exact cents tracking) to prevent penny discrepancies in 30-year amortizations.
* **Completeness**: All 5 core calculation models match exact banking and actuarial formulas.
* **Zero Hallucination Compliance**: 100% deterministic code paths without AI involvement in numerical computations.

---

## 8. Exact Correction Plan
1. **Restructure Directory Structure**: Formally separate the workspace into `/src/web`, `/src/backend`, `/src/admin`, `/src/core`, and `/src/shared`.
2. **Fortify Core Types & Contracts**: Establish clear immutable contracts in `/src/core/contracts/` and Zod validation schemas.
3. **Implement Robust API Layer**: Upgrade `/src/backend` with structured controllers, route handlers, error handling middlewares, and strict security headers.
4. **Local-First & Durable Storage Layer**: Implement persistent storage adapters with browser IndexedDB / localStorage fallback and server database storage.
5. **Implement Real Authentication & Role-Based Access Control**: Secure `/admin` with role verification and isolate user financial records with secure tenant IDs.
6. **Deploy the 8-Step Financial Intelligence Flow**:
   - `Calculate` (Deterministic engine)
   - `Explain` (Plain-language breakdowns of math)
   - `Compare` (Side-by-side scenarios: 15-yr vs 30-yr, Old vs New Tax, Lump Sum vs SIP)
   - `Current Data` (Verified live benchmarks from Central Banks)
   - `What Changed` (Chronological policy timeline)
   - `Personalize` (Contextual user persona adjustments)
   - `Recommend` (Actionable, objective mathematical optimizations)
   - `Act` (Prepayment schedule generator, tax checklists, exportable reports)

---

## 9. Proposed Target Folder Structure
```
/
├── package.json
├── server.ts                       # Unified Express server & API Gateway
├── metadata.json
├── docs/
│   └── DHANYA-AUDIT.md             # This comprehensive audit document
├── src/
│   ├── core/                       # Shared Zero-Hallucination Core
│   │   ├── engine/                 # Deterministic mathematical formulas
│   │   │   ├── deterministic-math.ts
│   │   │   ├── loan-engine.ts
│   │   │   ├── tax-engine.ts
│   │   │   ├── wealth-engine.ts
│   │   │   └── fire-engine.ts
│   │   ├── jurisdictions/          # Country data, tax brackets, sources
│   │   │   ├── registry.ts
│   │   │   ├── us.ts
│   │   │   ├── in.ts
│   │   │   ├── ca.ts
│   │   │   ├── gb.ts
│   │   │   └── global.ts
│   │   ├── types.ts                # Domain types & interfaces
│   │   └── validation/             # Request payload schemas
│   │
│   ├── backend/                    # Server-Side Engine & REST APIs
│   │   ├── middleware/             # Auth, error handling, validation, logging
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── controllers/            # Calculation, Rule, Source, Loan controllers
│   │   ├── repositories/           # Persistence abstraction layer
│   │   │   ├── in-memory.repository.ts
│   │   │   └── storage.interface.ts
│   │   ├── routes/                 # Versioned router definitions (/api/v1/*)
│   │   │   ├── index.ts
│   │   │   ├── calculations.routes.ts
│   │   │   ├── intelligence.routes.ts
│   │   │   ├── loans.routes.ts
│   │   │   └── admin.routes.ts
│   │   └── services/               # Provenance verification & intelligence
│   │
│   ├── web/                        # Public Financial Intelligence Web App
│   │   ├── components/             # Reusable UI widgets, charts, sliders
│   │   │   ├── CalculationExplanation.tsx
│   │   │   ├── ScenarioComparator.tsx
│   │   │   ├── ActionPlanModal.tsx
│   │   │   └── ProvenanceBadge.tsx
│   │   ├── pages/                  # Top-level views
│   │   │   ├── CalculatorsHubPage.tsx
│   │   │   ├── IntelligenceFeedPage.tsx
│   │   │   ├── LoanCommandCenterPage.tsx
│   │   │   ├── SourcesRegistryPage.tsx
│   │   │   └── calculators/
│   │   │       ├── MortgageLoanCalculator.tsx
│   │   │       ├── SIPWealthCalculator.tsx
│   │   │       ├── ProgressiveTaxCalculator.tsx
│   │   │       ├── FireRetirementCalculator.tsx
│   │   │       └── RefinanceBreakevenCalculator.tsx
│   │   └── hooks/                  # Financial calculation and sync hooks
│   │
│   ├── admin/                      # Back-Office & Actuarial Control Plane
│   │   ├── components/             # Rule editors, provenance auditors
│   │   ├── pages/                  # Audit trail, rate updates, source review
│   │   └── AdminDashboard.tsx
│   │
│   └── shared/                     # Cross-cutting UI context & navigation
│       ├── components/
│       │   ├── Navigation.tsx
│       │   ├── UniversalSearchModal.tsx
│       │   └── DecisionFlowSteps.tsx
│       └── context/
│           ├── FinancialContext.tsx
│           └── AuthContext.tsx
```

---

## 10. Migration Strategy (Zero Loss of Existing Work)
1. **Preserve Current Functionality**: Keep all calculation components and navigation active without breaking UI during refactoring.
2. **Extract & Modularize**: Gradually break down large files into dedicated controller/service modules.
3. **Upgrade In-Place**: Elevate the API contract with full `/api/v1` routes and robust data synchronization.
4. **Add Comprehensive Decision Pipeline**: Introduce the 8-step decision system across all calculators.

---

## 11. Phase-by-Phase Implementation Plan (Phases 1 to 15)
* **Phase 1: Architecture & Directory Separation**: Establish the `/web`, `/backend`, `/admin`, `/core`, `/shared` structural boundaries.
* **Phase 2: Mathematical Engine Hardening**: Verify precision, add edge-case unit guards, and formalize deterministic benchmarks.
* **Phase 3: Jurisdiction & Provenance Core**: Expand institutional data for US, CA, IN, UK, AU, SG, DE, AE with official government citations.
* **Phase 4: Backend API & Service Layer**: Complete REST endpoints for calculations, versioned rules, intelligence events, and audit logs.
* **Phase 5: Persistence & Local-First Storage**: Provide local encrypted persistence with cloud database sync adapters.
* **Phase 6: Multi-Country Loan & Mortgage Suite**: Amortization schedules, prepayment impact models, and refinance breakeven analysis.
* **Phase 7: Systematic Wealth & FIRE Suite**: SIP, step-up accumulation, inflation modeling, and retirement milestone planning.
* **Phase 8: Progressive Multi-Jurisdiction Tax Suite**: Multi-bracket calculation, standard deduction toggles, and marginal rate breakdowns.
* **Phase 9: Loan Command Center**: Multi-debt aggregation, snowball vs avalanche payoffs, and cash-flow impact forecasts.
* **Phase 10: "What Changed" Regulatory Feed**: Timeline of tax laws, policy shifts, and central bank benchmark movements.
* **Phase 11: Authoritative Source Registry**: Verification status badges, official gazette links, and last-audited timestamps.
* **Phase 12: The 8-Step Decision Engine**: Integrate `Calculate → Explain → Compare → Current Data → What Changed → Personalize → Recommend → Act` across all financial tools.
* **Phase 13: Universal Search & Financial Intent Router**: Fast keyboard-driven command palette (Cmd+K) with instant keyword indexing.
* **Phase 14: Actuarial Admin & Governance Console**: Rule editor, source auditor, intelligence publisher, and cryptographic audit log view.
* **Phase 15: Polishing, Performance & Production Readiness**: Verify responsiveness, zero-defect compilation, accessible contrast, and zero-hallucination compliance.
