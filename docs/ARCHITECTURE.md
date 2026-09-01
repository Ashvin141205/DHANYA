# DHANYA — Three-Application System Architecture

## 1. Architectural Overview & Separation of Concerns

Dhanya is engineered as a strictly decoupled three-application architecture with clear boundaries, separate entry points, and independent build pipelines:

```
dhanya/
├── web/                 # [PUBLIC] User-facing React SPA (Calculators, Feed, Loan Command Center)
│   ├── src/
│   │   ├── components/  # Web-specific navigation & modal search
│   │   ├── context/     # FinancialContext (country, currency, pro-mode, local storage)
│   │   ├── pages/       # Calculators, intelligence feed, loans, sources
│   │   ├── App.tsx      # Web Root (<FinancialProvider><WebApp /></FinancialProvider>)
│   │   ├── main.tsx     # Web React DOM Entry Point
│   │   └── index.ts     # Package exports
│   ├── index.html       # Web HTML Entry Point
│   ├── vite.config.ts   # Web Standalone Vite Build Config
│   ├── tsconfig.json    # Web TypeScript Config
│   └── package.json     # @dhanya/web package manifest
│
├── admin/               # [PRIVATE] Internal Control Plane (Rule Versioning, Provenance Auditing)
│   ├── src/
│   │   ├── AdminDashboard.tsx # Governance, audit log, & rule editor
│   │   ├── App.tsx            # Admin Root Shell
│   │   ├── main.tsx           # Admin React DOM Entry Point
│   │   └── index.ts           # Package exports
│   ├── index.html       # Admin HTML Entry Point
│   ├── vite.config.ts   # Admin Standalone Vite Build Config
│   ├── tsconfig.json    # Admin TypeScript Config
│   └── package.json     # @dhanya/admin package manifest
│
├── backend/             # [SERVER] Express REST API & Domain Orchestration
│   ├── src/
│   │   ├── routes/      # Endpoints (/calculations, /rules, /intelligence, /sources, /loans, /admin)
│   │   ├── store/       # In-memory prototype store & immutable audit ledger
│   │   ├── app.ts       # Express app factory
│   │   ├── index.ts     # Backend package entry
│   │   └── server.ts    # Standalone backend server entry point
│   ├── tsconfig.json    # Backend TypeScript Config
│   └── package.json     # @dhanya/backend package manifest
│
├── packages/            # [SHARED] Shared, Reusable Foundation Packages
│   ├── ui/              # Button, MetricCard, ResultCard, ProvenanceBadge, cn
│   ├── types/           # Canonical TypeScript interfaces & domain models
│   ├── validation/      # Pure runtime validators
│   ├── finance-engine/  # Pure deterministic mathematics (Mortgage, SIP, Tax, FIRE)
│   └── config/          # Central system configuration
│
├── docs/                # Architecture specifications & audit reports
├── server.ts            # Multi-App Host & Dev Proxy (Routes /api to Backend, /admin to Admin, /* to Web)
├── tsconfig.json        # Monorepo TypeScript config
└── package.json         # Workspace orchestration & npm lifecycle scripts
```

---

## 2. Independent Startup & Build Commands

### Developer Experience Scripts

| Command | Action | Port / Target |
| :--- | :--- | :--- |
| `npm run dev` | Starts unified container host with Vite middleware for Web & Admin | `http://0.0.0.0:3000` |
| `npm run dev:web` | Runs isolated Web Vite dev server | `http://0.0.0.0:3000` |
| `npm run dev:admin` | Runs isolated Admin Vite dev server | `http://0.0.0.0:3002` |
| `npm run dev:backend` | Runs isolated Backend Express server | `http://0.0.0.0:3001` |
| `npm run build:web` | Compiles Web application independently to `web/dist` | Output: `web/dist/` |
| `npm run build:admin` | Compiles Admin application independently to `admin/dist` | Output: `admin/dist/` |
| `npm run build:backend` | Bundles Backend server independently to `backend/dist` | Output: `backend/dist/server.cjs` |
| `npm run build` | Orchestrates builds for all apps & bundles production `server.cjs` | Output: `dist/server.cjs` |
| `npm run start` | Boots production server serving compiled Web, Admin, and API | `http://0.0.0.0:3000` |

---

## 3. Dependency & Import Boundaries

### Allowed Import Directions
* **Web** $\rightarrow$ `packages/ui`, `packages/types`, `packages/validation`, `packages/finance-engine`, `packages/config`
* **Admin** $\rightarrow$ `packages/ui`, `packages/types`, `packages/validation`, `packages/config`, `packages/finance-engine`
* **Backend** $\rightarrow$ `packages/types`, `packages/validation`, `packages/finance-engine`, `packages/config`

### Strictly Forbidden Import Boundaries
* ❌ **Web $\rightarrow$ Admin**: Web NEVER imports Admin dashboard or admin components.
* ❌ **Admin $\rightarrow$ Web**: Admin NEVER imports Web components.
* ❌ **Web $\rightarrow$ Backend Internals**: Web communicates with Backend ONLY via HTTP `/api/v1/*` fetch requests.
* ❌ **Admin $\rightarrow$ Backend Internals**: Admin communicates with Backend ONLY via HTTP `/api/v1/*` fetch requests.
* ❌ **Root Frontend App**: There is NO root `App.tsx` conditionally rendering Web or Admin via `if (activeApp === 'admin')`.
* ❌ **Shared Packages $\rightarrow$ Application Code**: Packages never import from `web`, `admin`, or `backend`.

---

## 4. Request Flow & Multi-App Serving

1. **Public Web Traffic (`/*`)**:
   * Routed to `web/index.html` $\rightarrow$ `web/src/main.tsx` $\rightarrow$ `web/src/App.tsx`.
   * Invokes pure mathematical calculation routines from `@dhanya/finance-engine` client-side.
   * Interacts with `/api/v1/intelligence/what-changed` and `/api/v1/sources` for verified data.

2. **Admin Console Traffic (`/admin/*`)**:
   * Routed to `admin/index.html` $\rightarrow$ `admin/src/main.tsx` $\rightarrow$ `admin/src/App.tsx`.
   * Interacts with `/api/v1/rules`, `/api/v1/sources/:id/verify`, and `/api/v1/admin/audit-logs` via authenticated API requests.

3. **Backend API Traffic (`/api/v1/*`)**:
   * Handled by Express routes in `backend/src/routes/` backed by deterministic validation and audit logs.
