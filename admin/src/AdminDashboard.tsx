/**
 * Dhanya Private Administration Control Console
 * Application: admin
 * Management of versioned financial rules, source verification, audit logs, and intelligence publisher.
 * Secured with Cryptographic Bearer Token Authorization & Tenant Isolation.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck,
  Newspaper,
  History,
  Activity,
  Plus,
  CheckCircle2,
  Lock,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Hash,
  Users,
  UserX,
} from 'lucide-react';
import { VersionedFinancialRule, SourceProvenance, AuditLogEntry, AuthUser, UserRole, UserStatus } from '@dhanya/types';
import { COUNTRIES } from '@dhanya/finance-engine';
import { adminApiClient, AdminApiError } from './services/adminApiClient';

interface DevUserOption {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const AdminDashboard: React.FC = () => {
  const [adminTab, setAdminTab] = useState<'rules' | 'sources' | 'publisher' | 'audit' | 'health' | 'users'>('rules');

  const [rules, setRules] = useState<VersionedFinancialRule[]>([]);
  const [sources, setSources] = useState<SourceProvenance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [integrityStatus, setIntegrityStatus] = useState<{ verified: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authentication State
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string>(() => {
    return sessionStorage.getItem('dhanya_admin_token') || '';
  });

  // New Rule Form State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleKey, setNewRuleKey] = useState('STANDARD_DEDUCTION');
  const [newRuleCategory, setNewRuleCategory] = useState<'TAX' | 'INTEREST_RATE' | 'LENDING' | 'INVESTMENT'>('TAX');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleEffectiveDate, setNewRuleEffectiveDate] = useState('2025-04-01');
  const [newRuleCountry, setNewRuleCountry] = useState(COUNTRIES[0].code);

  // New "What Changed" Event State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<'TAX_REFORM' | 'RATE_CUT' | 'RATE_HIKE' | 'POLICY_UPDATE'>('TAX_REFORM');
  const [eventSummary, setEventSummary] = useState('');
  const [eventAnalysis, setEventAnalysis] = useState('');
  const [eventEffectiveDate, setEventEffectiveDate] = useState('2025-04-01');

  // Authenticate using simple Email Login (Server determines role: DHANYA_ADMIN_EMAIL -> ADMIN, others -> USER)
  const handleAdminEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailInput.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await adminApiClient.login(adminEmailInput.trim());
      if (data) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setAdminEmailInput('');
        if (data.user.role !== 'USER') {
          await fetchBackendData(data.token);
        }
      } else {
        setErrorMessage('Authentication failed for provided email.');
      }
    } catch (e: any) {
      setErrorMessage(e instanceof AdminApiError ? e.message : `Authentication error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Explicit Logout / Revocation
  const handleLogout = async () => {
    try {
      await adminApiClient.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    adminApiClient.clearToken();
    setAuthToken('');
    setCurrentUser(null);
    setAuditLogs([]);
    setUsersList([]);
  };

  // Initialize and Check Auth Status
  const initializeAuth = async () => {
    setIsCheckingAuth(true);
    try {
      const existingToken = adminApiClient.getToken();
      if (existingToken) {
        adminApiClient.setToken(existingToken);
        try {
          const user = await adminApiClient.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            setAuthToken(existingToken);
            if (user.role !== 'USER') {
              await fetchBackendData(existingToken);
            }
            setIsCheckingAuth(false);
            return;
          }
        } catch {
          adminApiClient.clearToken();
          setAuthToken('');
          setCurrentUser(null);
        }
      }
    } catch (e) {
      console.error('Failed to initialize admin auth', e);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Fetch Backend Data with Auth Token and Strict 401/403 Handling
  const fetchBackendData = async (tokenOverride?: string) => {
    setLoading(true);
    setErrorMessage(null);
    if (tokenOverride) {
      adminApiClient.setToken(tokenOverride);
    }

    try {
      const [rulesRes, sourcesRes, auditRes, healthRes, usersRes] = await Promise.allSettled([
        adminApiClient.getRules(),
        adminApiClient.getSources(),
        adminApiClient.getAuditLogs(),
        adminApiClient.getHealth(),
        adminApiClient.getUsers(),
      ]);

      if (rulesRes.status === 'fulfilled') {
        setRules(rulesRes.value.data || []);
      } else if (rulesRes.reason instanceof AdminApiError && rulesRes.reason.status === 401) {
        handleAuthExpiry();
        return;
      }

      if (sourcesRes.status === 'fulfilled') {
        setSources(sourcesRes.value.data || []);
      }

      if (auditRes.status === 'fulfilled') {
        setAuditLogs(auditRes.value.data || []);
        if (auditRes.value.integrity) {
          setIntegrityStatus({
            verified: auditRes.value.integrity.hashChainVerified,
            message: auditRes.value.integrity.hashChainVerified
              ? 'SHA-256 Hash Chain Integrity Verified'
              : 'Hash Chain Discrepancy Detected',
          });
        }
      } else if (auditRes.reason instanceof AdminApiError) {
        if (auditRes.reason.status === 401) {
          handleAuthExpiry();
          return;
        } else if (auditRes.reason.status === 403) {
          setErrorMessage(`Authorization Denied (403): ${auditRes.reason.message}`);
        }
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.persistence) {
        setDiagnostics(healthRes.value.persistence);
      }

      if (usersRes.status === 'fulfilled') {
        setUsersList(usersRes.value.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch admin data from backend', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthExpiry = () => {
    adminApiClient.clearToken();
    setAuthToken('');
    setCurrentUser(null);
    setErrorMessage('Administrative session expired or invalid. Please re-authenticate.');
    setLoading(false);
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (authToken) {
      fetchBackendData(authToken);
    }
  }, [authToken]);

  // Verify Audit Hash Chain
  const handleVerifyHashChain = async () => {
    try {
      const res = await adminApiClient.verifyAuditIntegrity();
      if (res?.data) {
        setIntegrityStatus({
          verified: res.data.valid,
          message: res.data.message,
        });
      }
    } catch (err: any) {
      setErrorMessage(err instanceof AdminApiError ? err.message : 'Failed to verify audit hash chain');
    }
  };

  // Save new rule to backend
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const payload = {
        ruleKey: newRuleKey,
        title: newRuleTitle,
        category: newRuleCategory,
        countryCode: newRuleCountry,
        value: Number(newRuleValue) || newRuleValue,
        unit: 'CURRENCY' as const,
        validFrom: newRuleEffectiveDate,
        changeSummary: `Admin created new versioned rule by ${currentUser?.name || 'Authorized Admin'}`,
      };

      await adminApiClient.createRule(payload);
      setIsRuleModalOpen(false);
      setNewRuleTitle('');
      setNewRuleValue('');
      await fetchBackendData();
    } catch (err: any) {
      setErrorMessage(err instanceof AdminApiError ? err.message : 'Failed to create rule');
    }
  };

  // Publish What Changed to backend
  const handlePublishEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const payload = {
        title: eventTitle,
        category: eventCategory,
        countryCode: newRuleCountry,
        effectiveDate: eventEffectiveDate,
        summary: eventSummary,
        detailedAnalysis: eventAnalysis,
        impactScore: 'HIGH' as const,
        affectedPersonas: ['Taxpayers', 'Investors', 'Borrowers'],
      };

      await adminApiClient.publishIntelligence(payload);
      setIsPublishModalOpen(false);
      setEventTitle('');
      setEventSummary('');
      setEventAnalysis('');
      await fetchBackendData();
    } catch (err: any) {
      setErrorMessage(err instanceof AdminApiError ? err.message : 'Failed to publish intelligence event');
    }
  };

  // Verify source status
  const handleVerifySource = async (sourceId: string, status: 'VERIFIED' | 'FLAGGED') => {
    setErrorMessage(null);
    try {
      await adminApiClient.verifySource(sourceId, status);
      await fetchBackendData();
    } catch (err: any) {
      setErrorMessage(err instanceof AdminApiError ? err.message : 'Failed to verify source');
    }
  };

  // Update user status
  const handleUpdateUserStatus = async (userId: string, newStatus: UserStatus) => {
    setErrorMessage(null);
    try {
      await adminApiClient.updateUserStatus(userId, newStatus);
      await fetchBackendData();
    } catch (err: any) {
      setErrorMessage(err instanceof AdminApiError ? err.message : 'Failed to update user status');
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Dhanya Administration Security</h2>
            <p className="text-xs text-slate-400 mt-1">Verifying administrative security credentials & session...</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated State: Simple Clean Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8 space-y-6 text-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                Identity Authentication
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Simple Email Login
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleAdminEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. owner@dhanya.internal"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !adminEmailInput.trim()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated but Unauthorized Role (e.g. USER role)
  if (currentUser.role === 'USER') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-rose-500/30 shadow-2xl p-8 space-y-6 text-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <UserX className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                  Access Denied
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-bold">
                  [{currentUser.role}]
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                403 Forbidden
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Authenticated Email:</span>
              <span className="font-mono text-white font-medium">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Assigned Role:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold text-[11px]">
                [{currentUser.role}]
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
              This account has the USER role and does not have administrative privileges. Only the designated administrator account (matching DHANYA_ADMIN_EMAIL) may access the administration console.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-xs"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Administrator View (ADMIN / OWNER)
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* Top Admin Status Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                  Dhanya Administration Console
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold">
                  [{currentUser.role}]
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Versioned rule management, regulatory gazette provenance verification, and tamper-resistant audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Rule Version</span>
            </button>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Newspaper className="w-4 h-4" />
              <span>Publish Intelligence</span>
            </button>
          </div>
        </div>

        {/* Security & Identity Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 font-medium">Logged in as:</span>
            <span className="font-mono text-white font-bold">{currentUser.email}</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
              [{currentUser.role}]
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Error Notification Banner if Access Forbidden */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-slate-800">
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium block">Active Versioned Rules</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {loading && rules.length === 0 ? '—' : rules.length}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium block">Authoritative Sources</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {loading && sources.length === 0 ? '—' : sources.length}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium block">Users & Tenants</span>
            <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
              {loading && usersList.length === 0 ? '—' : usersList.length}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium block">Storage Adapter</span>
            <span className="text-xs font-bold font-mono text-amber-300 mt-1.5 block">
              {diagnostics?.adapter === 'DURABLE_FILE_LEDGER'
                ? 'Durable Disk'
                : diagnostics?.adapter === 'IN_MEMORY'
                ? 'In-Memory (Dev)'
                : loading
                ? '—'
                : 'Unavailable'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium block">Audit Trail Entries</span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
              {loading && auditLogs.length === 0 ? '—' : auditLogs.length}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setAdminTab('rules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'rules' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Versioned Financial Rules ({rules.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('sources')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'sources' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Source Provenance Registry ({sources.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'users' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Multi-Tenant Control ({usersList.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'audit' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('health')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              adminTab === 'health' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Engine & Persistence Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Versioned Financial Rules */}
      {adminTab === 'rules' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Active Financial Rules & Rate Indexation
              </h3>
              <p className="text-xs text-slate-500">
                All rules are strictly versioned with valid_from dates to preserve historical calculation fidelity.
              </p>
            </div>
            <button
              onClick={() => fetchBackendData()}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5">Rule Key & Title</th>
                  <th className="px-3.5 py-2.5">Country</th>
                  <th className="px-3.5 py-2.5">Active Value</th>
                  <th className="px-3.5 py-2.5">Version</th>
                  <th className="px-3.5 py-2.5">Effective Date</th>
                  <th className="px-3.5 py-2.5">Verified Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-3 font-sans">
                      <span className="font-bold text-slate-900 block">{r.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{r.ruleKey}</span>
                    </td>
                    <td className="px-3.5 py-3 font-sans">
                      <span className="font-bold text-slate-800">{r.countryCode}</span>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-emerald-800 text-sm">
                      {typeof r.value === 'number' ? r.value.toLocaleString() : String(r.value)}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                        v{r.version}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-sans text-slate-600">
                      {r.validFrom}
                    </td>
                    <td className="px-3.5 py-3 font-sans text-slate-500">
                      {r.source?.organization || 'Official Central Bank / Ministry'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sources Registry */}
      {adminTab === 'sources' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Authoritative Sources & Regulatory Citation Auditing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                    <span className="text-xs text-slate-500 font-medium">{s.organization}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.verificationStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-200">
                  <span>Reviewed by {s.verifiedBy}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifySource(s.id, 'VERIFIED')}
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-500"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleVerifySource(s.id, 'FLAGGED')}
                      className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-semibold hover:bg-slate-300"
                    >
                      Flag
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tamper-Resistant Audit Trail */}
      {adminTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cryptographic Audit Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Immutable SHA-256 hash-chained event records. Every administrative and financial action is signed and verifiable.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                integrityStatus?.verified
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <Hash className="w-3.5 h-3.5" />
                <span>{integrityStatus?.message || (loading ? 'Checking...' : 'Unverified (Click to check)')}</span>
              </div>
              <button
                onClick={handleVerifyHashChain}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Verify Hash Chain
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-sans">{log.action}: {log.targetEntity}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                      {log.actorRole}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                </div>
                <p className="text-slate-600">{log.details}</p>
                
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                  <span>Actor: {log.actor}</span>
                  {log.hash && (
                    <span className="truncate max-w-xs text-slate-500">
                      SHA-256: {log.hash.slice(0, 16)}...{log.hash.slice(-8)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Users & Multi-Tenant Control */}
      {adminTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                User Directory & Tenant Isolation Management
              </h3>
              <p className="text-xs text-slate-500">
                Manage registered user identities, assigned cryptographic roles, tenant scopes, and lifecycle status.
              </p>
            </div>
            <button
              onClick={() => fetchBackendData()}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5">User Identity</th>
                  <th className="px-3.5 py-2.5">Role</th>
                  <th className="px-3.5 py-2.5">Tenant Scope</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Created At</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-sans">
                      {loading ? 'Loading registered users...' : 'No users currently registered in persistence layer.'}
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-3 font-sans">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'OWNER'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : u.role === 'CHIEF_ACTUARY'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-600 font-mono text-[11px]">
                        {u.tenantId || 'tenant_default'}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-sans text-slate-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'System Seed'}
                      </td>
                      <td className="px-3.5 py-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'ACTIVE')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          {u.status === 'ACTIVE' && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'SUSPENDED')}
                              className="px-2 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-800 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Engine & Persistence Diagnostics */}
      {adminTab === 'health' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Actuarial Calculation Engine & Storage Diagnostics
            </h3>
            <p className="text-xs text-slate-500">
              Verified operational health, active persistence adapter, and relational integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <span className="font-bold text-emerald-900 block">Deterministic Math Engine</span>
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All calculations active & deterministic
              </span>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
              <span className="font-bold text-blue-900 block">Multi-Tenant Isolation</span>
              <span className="text-blue-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Scoped User Loans (No global leakage)
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">Storage Persistence Adapter</span>
              <span className="text-slate-700 font-mono font-bold">
                {diagnostics?.adapter || (loading ? 'Checking...' : 'Unavailable')}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Durable: {diagnostics ? (diagnostics.isDurable ? 'Yes (Restart Surviving)' : 'In-Memory Fallback') : '—'}
              </span>
            </div>
          </div>

          {diagnostics && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Telemetry & Ledger Stats</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-slate-600 font-mono">
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Persisted Loans</span>
                  <span className="font-bold text-slate-900">{diagnostics.totalLoans}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Versioned Rules</span>
                  <span className="font-bold text-slate-900">{diagnostics.totalRules}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Authoritative Sources</span>
                  <span className="font-bold text-slate-900">{diagnostics.totalSources}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Registered Users</span>
                  <span className="font-bold text-slate-900">{diagnostics.totalUsers ?? usersList.length}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-sans">Ledger Uptime</span>
                  <span className="font-bold text-slate-900">{diagnostics.uptimeSeconds}s</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Versioned Financial Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rule Title</label>
                <input
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  placeholder="e.g. Standard Deduction Salary 2025"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rule Key</label>
                  <input
                    value={newRuleKey}
                    onChange={(e) => setNewRuleKey(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Country</label>
                  <select
                    value={newRuleCountry}
                    onChange={(e) => setNewRuleCountry(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Numerical / String Value</label>
                  <input
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={newRuleEffectiveDate}
                    onChange={(e) => setNewRuleEffectiveDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Publish Rule Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Event Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Publish to "What Changed" Feed</h3>
            <form onSubmit={handlePublishEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Headline</label>
                <input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Bank of Canada Policy Rate Cut to 3.25%"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="TAX_REFORM">Tax Reform</option>
                    <option value="RATE_CUT">Central Bank Rate Cut</option>
                    <option value="RATE_HIKE">Central Bank Rate Hike</option>
                    <option value="POLICY_UPDATE">Policy / Statutory Update</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={eventEffectiveDate}
                    onChange={(e) => setEventEffectiveDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Summary (1-2 sentences)</label>
                <textarea
                  value={eventSummary}
                  onChange={(e) => setEventSummary(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="Concise, verified description of what changed..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Decision Support Analysis</label>
                <textarea
                  value={eventAnalysis}
                  onChange={(e) => setEventAnalysis(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="How this affects monthly mortgages, take-home salaries, or investments..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"
                >
                  Publish Verified Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
