/**
 * Dhanya Verified Sources & Provenance Registry
 * Application: web
 * 
 * Strict Design System:
 * - Font: Manrope
 * - Palette: Warm Ivory , Deep Ink , Emerald , Champagne 
 * - Transparent citation index of regulatory authorities, central banks, and tax gazettes.
 */

import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, CheckCircle2, Clock, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import { SourceBadge, SEOHead } from '@dhanya/ui';
import { useSources } from '../hooks/useSources';
import { useAuth } from '../context/AuthContext';

export const SourcesRegistryPage: React.FC = () => {
  const { sources, loading, error, isLive, refetch, verifySource } = useSources();
  const { currentUser } = useAuth();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await verifySource(id, 'VERIFIED');
    } catch {
      // error handled by hook
    } finally {
      setVerifyingId(null);
    }
  };

  const canVerify = currentUser && (currentUser.role === 'CHIEF_ACTUARY' || currentUser.role === 'OWNER' || currentUser.role === 'ADMIN');

  return (
    <div className="space-y-10">
      <SEOHead
        title="Authoritative Financial Sources & Provenance Registry — Dhanya"
        description="Public registry of primary statutory revenue bodies, central banks, and government gazette citations powering the Dhanya financial intelligence engine."
        canonicalUrl="https://dhanya.app/sources"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Dhanya Verified Sources Registry",
          "description": "Directory of primary regulatory authorities and gazette publications.",
        }}
      />
      {/* Header Banner Card */}
      <div className="bg-warm-surface rounded-3xl p-6 sm:p-10 border border-dhanya-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-dhanya-emerald uppercase tracking-wider">
                TRANSPARENCY & PROVENANCE STANDARD
              </span>
              <span className="text-dhanya-border">•</span>
              <span className="text-xs font-mono text-dhanya-secondary">Zero Third-Party Scraping</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dhanya-black tracking-tight">
              Verified Regulatory Sources Directory
            </h1>
            <p className="text-sm text-dhanya-secondary max-w-2xl">
              Every financial computation and tax bracket in Dhanya links directly to official statutory bodies, central banks, and government gazette indexations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-dhanya-border text-xs font-mono">
              <Radio className={`w-3 h-3 ${isLive ? 'text-dhanya-emerald animate-pulse' : 'text-dhanya-muted'}`} />
              <span className="font-bold text-dhanya-black">
                {loading ? 'Connecting...' : isLive ? 'Live Verified Registry' : 'Offline'}
              </span>
            </div>
            <SourceBadge
              sourceName="Primary Gazettes Only"
              verifiedDate="Aug 2026"
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4 text-rose-800 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Sources Registry Unavailable</p>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Sources Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border animate-pulse space-y-4"
            >
              <div className="flex justify-between">
                <div className="h-5 w-24 bg-dhanya-border/50 rounded-lg" />
                <div className="h-5 w-20 bg-dhanya-border/50 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-dhanya-border/50 rounded-lg" />
              <div className="h-16 bg-white rounded-2xl border border-dhanya-border" />
            </div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-warm-surface rounded-3xl p-12 text-center border border-dhanya-border space-y-2">
          <ShieldCheck className="w-8 h-8 text-dhanya-muted mx-auto" />
          <h3 className="text-base font-bold text-dhanya-black">No authoritative sources found</h3>
          <p className="text-xs text-dhanya-secondary">The statutory source registry is currently empty or unreachable.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sources.map((source) => (
            <div
              key={source.id}
              className="bg-warm-surface rounded-3xl p-6 sm:p-8 border border-dhanya-border shadow-2xs space-y-5 hover:border-dhanya-black transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white border border-dhanya-border text-dhanya-black">
                    {source.organizationType.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-extrabold text-dhanya-black mt-2">{source.name}</h3>
                  <span className="text-xs text-dhanya-secondary font-semibold">{source.organization}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-dhanya-emerald bg-dhanya-emerald/10 border border-dhanya-emerald/20 px-2.5 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-dhanya-emerald" /> {source.verificationStatus || 'VERIFIED'}
                  </span>
                  {canVerify && (
                    <button
                      onClick={() => handleVerify(source.id)}
                      disabled={verifyingId === source.id}
                      className="text-[11px] font-mono px-2 py-1 bg-white border border-dhanya-border hover:border-dhanya-black rounded-lg text-dhanya-black font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {verifyingId === source.id ? 'Verifying...' : 'Re-verify'}
                    </button>
                  )}
                </div>
              </div>

              {source.notes && (
                <p className="text-xs text-dhanya-secondary bg-white p-4 rounded-2xl border border-dhanya-border leading-relaxed">
                  {source.notes}
                </p>
              )}

              <div className="pt-3 border-t border-dhanya-border flex items-center justify-between text-xs text-dhanya-secondary">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-dhanya-muted" />
                  Audit: {new Date(source.lastVerifiedAt).toLocaleDateString()}
                  {source.verifiedBy && ` (${source.verifiedBy})`}
                </span>

                <a
                  href={source.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dhanya-emerald hover:text-deep-ink font-semibold inline-flex items-center gap-1 hover:underline"
                >
                  Official Gazette <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

