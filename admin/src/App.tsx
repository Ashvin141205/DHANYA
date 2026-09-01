/**
 * Dhanya Private Administration Control Console Application Root
 * Application: admin
 */

import React from 'react';
import { AdminDashboard } from './AdminDashboard';
import { ShieldCheck, Layers, ExternalLink } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500/20 selection:text-amber-300 font-sans">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white font-sans">DHANYA ADMIN</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  INTERNAL CONTROL PLANE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Rule Versioning & Citation Provenance Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-slate-400 font-mono">
              Cluster: <strong className="text-emerald-400">production-master</strong>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <a
              href="/"
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors px-2 py-1 bg-slate-800 rounded-lg border border-slate-700"
              target="_blank"
              rel="noreferrer"
            >
              <span>Public Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        <AdminDashboard />
      </main>

      {/* Admin Footer */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 py-6 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dhanya Admin Governance & Regulatory Integrity Layer</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Strict Audited Changes • Immutable Ledger Mode
          </div>
        </div>
      </footer>
    </div>
  );
}
