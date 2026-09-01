/**
 * Dhanya Simple Email Authentication Modal
 * Application: web
 * 
 * Clean, simple email authentication:
 * - Enter email -> Server determines ADMIN vs USER role
 * - Displays active user email and assigned role (ADMIN or USER)
 */

import React, { useState } from 'react';
import {
  UserCheck,
  Lock,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    loginWithCustom,
    logout,
    authError,
    clearAuthError,
  } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    await loginWithCustom(emailInput.trim());
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-ink/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => {
          clearAuthError();
          setIsAuthModalOpen(false);
        }}
      />

      <div className="relative w-full max-w-md bg-warm-ivory rounded-3xl shadow-2xl border border-dhanya-border z-10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-deep-ink text-white px-6 py-4 border-b border-deep-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block">Identity Authentication</span>
              <p className="text-[11px] text-slate-400 font-medium">Simple Email Login</p>
            </div>
          </div>

          <button
            onClick={() => {
              clearAuthError();
              setIsAuthModalOpen(false);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-deep-surface transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Current Session Indicator if logged in */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-dhanya-border rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-dhanya-emerald font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Currently Signed In</span>
                </div>
                <div className="flex items-center justify-between border-t border-dhanya-border/60 pt-2 text-xs">
                  <span className="text-dhanya-secondary">Email:</span>
                  <span className="font-mono font-bold text-dhanya-black">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dhanya-secondary">Assigned Role:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      currentUser.role === 'ADMIN' || currentUser.role === 'OWNER'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {currentUser.role === 'OWNER' ? 'ADMIN' : currentUser.role}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => logout()}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-full py-2.5 bg-deep-ink hover:bg-deep-surface text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[11px]">{authError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-dhanya-black font-mono">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. owner@dhanya.internal or user@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-dhanya-border rounded-xl text-xs text-dhanya-black focus:outline-none focus:ring-1 focus:ring-dhanya-black font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !emailInput.trim()}
                className="w-full py-2.5 bg-deep-ink hover:bg-deep-surface text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-warm-surface px-6 py-3 border-t border-dhanya-border text-center text-[10px] text-dhanya-muted font-mono">
          Server-Authoritative Authentication • HMAC-SHA256
        </div>
      </div>
    </div>
  );
};
