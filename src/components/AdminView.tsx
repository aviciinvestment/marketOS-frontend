import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Phone, 
  Search, 
  Terminal, 
  CheckCircle,
  Copy,
  ChevronRight,
  Mail,
  UserCheck,
  Trash2,
  CreditCard,
  Save,
  Lock,
  TrendingUp,
  BadgeCheck
} from 'lucide-react';
import { ADMIN_EMAIL, API_ENDPOINTS } from '../config/api';

interface ServerLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string;
  ip?: string;
  detail?: string;
}

interface UserInfo {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  productsCount?: number;
  salesCount?: number;
  totalVolume?: number;
  lastActive: string;
}

interface AdminStats {
  adminEmail: string;
  totalUsers: number;
  userList: UserInfo[];
  statusCounts: { [code: string]: number };
  pendingComplaints: number;
  serverUptimeSec: number;
  serverTime: string;
}

interface Complaint {
  id: string;
  userId: string;
  userEmail: string;
  phoneNumber: string;
  category: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

interface PaywallPayment {
  reference: string;
  userId?: string;
  email?: string;
  amountKobo: number;
  currency: string;
  status: string;
  channel?: string;
  paidAt?: string;
  createdAt: string;
}

interface PaywallAccess {
  userId: string;
  email?: string;
  reference?: string;
  amountKobo: number;
  paidAt?: string;
  expiresAt: string;
}

interface PaywallOverview {
  settings: {
    enabled: boolean;
    amountKobo: number;
    amount: number;
    durationDays: number;
    currency: string;
    updatedAt?: string;
  };
  configured: boolean;
  stats: {
    totalPayments: number;
    successfulPayments: number;
    activeSubscribers: number;
    revenueKobo: number;
    revenue: number;
  };
  payments: PaywallPayment[];
  access: PaywallAccess[];
}

interface AdminViewProps {
  currentUserEmail?: string;
  onBackToApp: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUserEmail, onBackToApp }) => {
  const isFounder = currentUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logFilter, setLogFilter] = useState<'all' | 'errors' | '200' | '401' | '500'>('all');
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [showPaidOnly, setShowPaidOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs' | 'complaints' | 'paywall'>('dashboard');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Paywall / Paystack configuration state
  const [paywall, setPaywall] = useState<PaywallOverview | null>(null);
  const [paywallForm, setPaywallForm] = useState<{ enabled: boolean; amount: string; durationDays: string }>({
    enabled: true,
    amount: '',
    durationDays: '30'
  });
  const [paywallSaving, setPaywallSaving] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const fetchPaywall = useCallback(async () => {
    if (!isFounder) return;
    try {
      const res = await fetch(API_ENDPOINTS.adminPaywall);
      if (res.ok) {
        const data: PaywallOverview = await res.json();
        setPaywall(data);
        setPaywallForm({
          enabled: data.settings.enabled,
          amount: String(data.settings.amount ?? ''),
          durationDays: String(data.settings.durationDays ?? 30)
        });
      }
    } catch (e) {
      console.error('Error fetching paywall data:', e);
    }
  }, [isFounder]);

  const savePaywall = async () => {
    setPaywallSaving(true);
    setPaywallMessage(null);
    try {
      const amountNum = Number(paywallForm.amount);
      const daysNum = Number(paywallForm.durationDays);
      if (!Number.isFinite(amountNum) || amountNum < 0) {
        throw new Error('Enter a valid price (₦).');
      }
      if (!Number.isFinite(daysNum) || daysNum < 1) {
        throw new Error('Enter a valid duration in days.');
      }
      const res = await fetch(API_ENDPOINTS.adminPaywall, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: paywallForm.enabled,
          amount: amountNum,
          durationDays: Math.round(daysNum)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save paywall settings.');
      setPaywallMessage({ type: 'ok', text: 'Paywall settings saved.' });
      await fetchPaywall();
    } catch (e: any) {
      setPaywallMessage({ type: 'error', text: e?.message || 'Failed to save paywall settings.' });
    } finally {
      setPaywallSaving(false);
      setTimeout(() => setPaywallMessage(null), 4000);
    }
  };

  const fetchAdminData = useCallback(async () => {
    if (!isFounder) return;
    setIsRefreshing(true);
    try {
      const [statsRes, logsRes, compRes] = await Promise.all([
        fetch(API_ENDPOINTS.adminStats).catch(() => null),
        fetch(API_ENDPOINTS.adminLogs).catch(() => null),
        fetch(API_ENDPOINTS.adminComplaints).catch(() => null),
      ]);

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
      if (compRes && compRes.ok) {
        const compData = await compRes.json();
        setComplaints(compData.complaints || []);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [isFounder]);

  useEffect(() => {
    fetchAdminData();
    if (!autoRefresh || !isFounder) return;

    const interval = setInterval(() => {
      fetchAdminData();
    }, 4000); // 4-second live poll for real-time telemetry

    return () => clearInterval(interval);
  }, [fetchAdminData, autoRefresh, isFounder]);

  useEffect(() => {
    fetchPaywall();
  }, [fetchPaywall]);

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.adminComplaints}/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      if (res.ok) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, status: 'resolved' } : c))
        );
      }
    } catch (err) {
      console.error('Failed to resolve complaint:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [isClearingLogs, setIsClearingLogs] = useState(false);
  const [clearSuccessMessage, setClearSuccessMessage] = useState<string | null>(null);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all server interaction logs? This cannot be undone.')) {
      return;
    }
    setIsClearingLogs(true);
    try {
      const res = await fetch(API_ENDPOINTS.adminLogs, { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        setClearSuccessMessage('All server logs cleared successfully.');
        setTimeout(() => setClearSuccessMessage(null), 3500);
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsClearingLogs(false);
    }
  };

  // If user is not the configured founder email, reject access immediately
  if (!isFounder) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0E1118] border border-red-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Access Denied: Founder Clearance Required</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            This administrative control system is restricted strictly to the founder email{' '}
            <span className="text-amber-400 font-mono font-medium">{ADMIN_EMAIL}</span>. 
            Your current authenticated account is{' '}
            <span className="text-slate-300 font-mono">{currentUserEmail || 'Unauthenticated'}</span>.
          </p>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 mb-6 text-left space-y-1">
            <div className="text-slate-300 font-medium">To change admin email in production:</div>
            <div>Update <code className="text-amber-300 font-mono">VITE_ADMIN_EMAIL</code> in <code className="text-slate-300 font-mono">web/.env</code> and restart frontend.</div>
          </div>
          <button
            onClick={onBackToApp}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
          >
            Return to App Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Filtered Logs - No ellipses, full paths
  const filteredLogs = logs.filter((log) => {
    const matchesQuery = searchLogQuery
      ? log.path.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        log.method.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
        (log.userId && log.userId.toLowerCase().includes(searchLogQuery.toLowerCase())) ||
        (log.detail && log.detail.toLowerCase().includes(searchLogQuery.toLowerCase())) ||
        log.status.toString().includes(searchLogQuery)
      : true;

    if (!matchesQuery) return false;

    if (logFilter === 'errors') return log.status >= 400;
    if (logFilter === '200') return log.status === 200 || log.status === 201;
    if (logFilter === '401') return log.status === 401;
    if (logFilter === '500') return log.status === 500;
    return true;
  });

  // Filtered Users
  const filteredUsers = (stats?.userList || []).filter((u) => {
    if (!searchUserQuery) return true;
    const q = searchUserQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  // Users with an active paid Insight subscription, keyed by their user id, so
  // the admin can spot who has paid at a glance.
  const paidAccessByUser = new Map((paywall?.access || []).map((a) => [a.userId, a]));
  const paidUserCount = (stats?.userList || []).filter((u) => paidAccessByUser.has(u.userId)).length;
  const visibleUsers = showPaidOnly
    ? filteredUsers.filter((u) => paidAccessByUser.has(u.userId))
    : filteredUsers;

  const recentErrors = logs.filter((l) => l.status >= 400).slice(0, 5);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#10141D] to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-100">
                marketOS Founder Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Founder: <span className="text-slate-200 font-mono font-medium">{ADMIN_EMAIL}</span> • Live telemetry for merchants & active server interactions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-colors ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{autoRefresh ? 'Live Stream (4s)' : 'Polling Paused'}</span>
          </button>

          <button
            onClick={fetchAdminData}
            disabled={isRefreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh now"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-amber-400' : ''} />
          </button>

          <button
            onClick={onBackToApp}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <span>Back to Store</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Critical Issue / Real-time Alert Banner */}
      {recentErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-300 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <div className="font-semibold text-sm text-red-200 flex items-center gap-2">
                <span>Active User End Incident ({recentErrors.length} recent error logs)</span>
                <span className="px-2 py-0.5 bg-red-500/30 text-red-300 rounded-lg text-[10px] font-bold">Immediate Alert</span>
              </div>
              <p className="text-xs text-red-300/90 mt-1 leading-relaxed">
                Latest error: HTTP {recentErrors[0].status} on path <code className="font-mono bg-red-950/60 px-1.5 py-0.5 rounded text-red-200">{recentErrors[0].path}</code> from user <code className="font-mono text-red-200">{recentErrors[0].userId || recentErrors[0].ip || 'Anonymous'}</code>.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('logs');
              setLogFilter('errors');
            }}
            className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-xl text-xs font-semibold shrink-0 transition-colors"
          >
            Inspect Incident Logs
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Users */}
        <div 
          onClick={() => setActiveTab('users')}
          className="bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-sm cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Registered Users</span>
            <Users size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {stats ? stats.totalUsers : '...'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>Active merchant accounts</span>
          </div>
        </div>

        {/* Successful Requests (200 / 201) */}
        <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">HTTP 200 / 201 OK</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {stats ? (stats.statusCounts['200'] || 0) + (stats.statusCounts['201'] || 0) : '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Healthy client sync requests</div>
        </div>

        {/* 401 / Auth / Client Errors */}
        <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">HTTP 401 / Auth Warns</span>
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {stats ? stats.statusCounts['401'] || 0 : '0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Token expires or auth mismatches</div>
        </div>

        {/* Pending User Complaints */}
        <div 
          onClick={() => setActiveTab('complaints')}
          className="bg-[#0E1118] border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-sm cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pending Complaints</span>
            <Phone size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">
            {complaints.filter((c) => c.status === 'pending').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Requiring founder phone callback</div>
        </div>

        {/* Paystack Revenue */}
        <div 
          onClick={() => setActiveTab('paywall')}
          className="bg-[#0E1118] border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-sm cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Insight Revenue</span>
            <TrendingUp size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            ₦{(paywall?.stats.revenue || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {paywall?.stats.successfulPayments || 0} successful payments
          </div>
        </div>

        {/* Active Subscribers */}
        <div 
          onClick={() => setActiveTab('paywall')}
          className="bg-[#0E1118] border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-sm cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Subscribers</span>
            <CreditCard size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {paywall?.stats.activeSubscribers ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {paywall ? (paywall.settings.enabled ? 'Paywall enabled' : 'Paywall disabled') : 'Loading…'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Modern Sleek Pill Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900/60 border border-slate-800'
          }`}
        >
          Mission Overview
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Users size={14} />
          <span>Registered Users ({stats?.userList?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Terminal size={14} />
          <span>Real-time Interaction Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'complaints'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Phone size={14} />
          <span>Merchant Complaints Desk</span>
          {complaints.filter((c) => c.status === 'pending').length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500 text-white font-black">
              {complaints.filter((c) => c.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('paywall')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'paywall'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 bg-slate-900/60 border border-slate-800'
          }`}
        >
          <CreditCard size={14} />
          <span>Payments & Paywall</span>
          {paywall && !paywall.settings.enabled && (
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-500 text-white font-black">OFF</span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Status Distribution */}
            <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity size={16} className="text-amber-400" />
                <span>Live Server Telemetry Status</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                {/* 200 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-slate-300">200 OK (Sync & Records)</span>
                  </span>
                  <span className="font-bold text-slate-100">
                    {stats?.statusCounts['200'] || 0}
                  </span>
                </div>
                {/* 201 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-300">201 Created (Tickets/Data)</span>
                  </span>
                  <span className="font-bold text-slate-100">
                    {stats?.statusCounts['201'] || 0}
                  </span>
                </div>
                {/* 401 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-semibold text-slate-300">401 Auth Expired / Mismatch</span>
                  </span>
                  <span className="font-bold text-amber-400">
                    {stats?.statusCounts['401'] || 0}
                  </span>
                </div>
                {/* 500 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="font-semibold text-slate-300">500 Server Error</span>
                  </span>
                  <span className="font-bold text-red-400">
                    {stats?.statusCounts['500'] || 0}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Server Uptime</span>
                <span className="font-mono text-slate-200 font-bold">
                  {stats?.serverUptimeSec ? `${Math.floor(stats.serverUptimeSec / 3600)}h ${Math.floor((stats.serverUptimeSec % 3600) / 60)}m` : 'Online'}
                </span>
              </div>
            </div>

            {/* Quick Live Logs Feed */}
            <div className="lg:col-span-2 bg-[#0E1118] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Terminal size={16} className="text-amber-400" />
                  <span>Real-time Interaction Feed</span>
                </h3>
                <button
                  onClick={() => setActiveTab('logs')}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Full Log Console</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {logs.slice(0, 7).map((log) => (
                  <div
                    key={log.id}
                    className="px-3.5 py-2.5 bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    {/* Left: Status, Method, Path */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                          log.status >= 500
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : log.status === 401
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : log.status >= 400
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-slate-400 font-mono font-bold text-[11px] shrink-0 w-11">
                        {log.method}
                      </span>
                      <span 
                        className="text-slate-200 font-mono text-xs truncate min-w-0" 
                        title={log.path}
                      >
                        {log.path}
                      </span>
                    </div>

                    {/* Right: User, Latency, Time */}
                    <div className="flex items-center gap-2.5 sm:gap-3 text-slate-400 text-[11px] shrink-0 font-mono">
                      {log.userId && log.userId !== 'anonymous' && (
                        <span 
                          className="hidden md:inline-block max-w-[130px] truncate text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md text-[10px]" 
                          title={log.userId}
                        >
                          {log.userId}
                        </span>
                      )}
                      <span className="text-slate-500 hidden sm:inline">{log.durationMs}ms</span>
                      <span className="text-slate-400 font-sans text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No logs captured yet. Triggering sync in any user session will populate this stream in real-time.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Registered Users Summary Preview */}
          <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck size={16} className="text-amber-400" />
                  <span>Recently Active Merchants & Stores</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real store names, registered emails, stock counts, and sales volumes
                </p>
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>View All Users ({stats?.userList?.length || 0})</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(stats?.userList || []).slice(0, 6).map((u, i) => (
                <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-100 text-sm break-words">{u.name}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 break-words">{u.email}</span>
                        {paidAccessByUser.has(u.userId) && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <BadgeCheck size={10} />
                            PAID
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div>
                      <div className="text-slate-500">Stock</div>
                      <div className="font-bold text-slate-200">{u.productsCount || 0} items</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Sales</div>
                      <div className="font-bold text-slate-200">{u.salesCount || 0} sales</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Volume</div>
                      <div className="font-bold text-amber-400">₦{(u.totalVolume || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED USER DIRECTORY (Shows Full Names, Emails, Phone, Stock, Sales) */}
      {activeTab === 'users' && (
        <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users size={18} className="text-amber-400" />
                <span>Registered Merchant Directory</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Full names of signed up users, emails, active phones, inventory count, and revenue volumes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <div className="text-xs text-slate-300 font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                Total Accounts: <span className="text-amber-400">{filteredUsers.length}</span>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <BadgeCheck size={13} />
                Paid: <span>{paidUserCount}</span>
              </div>
            </div>
          </div>

          {/* Search + Paid filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Search by merchant name, email, phone number, or UID..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowPaidOnly((v) => !v)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
                showPaidOnly
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <BadgeCheck size={14} />
              {showPaidOnly ? 'Showing Paid Users' : 'Paid Users Only'}
            </button>
          </div>

          {/* Users List / Cards */}
          <div className="space-y-3.5">
            {visibleUsers.map((u, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* User Identity Column */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-lg shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-100">
                        {u.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active Account
                      </span>
                      {paidAccessByUser.has(u.userId) && (
                        <span
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1"
                          title={
                            paidAccessByUser.get(u.userId)?.expiresAt
                              ? `Paid · access expires ${new Date(paidAccessByUser.get(u.userId)!.expiresAt).toLocaleDateString()}`
                              : 'Paid subscriber'
                          }
                        >
                          <BadgeCheck size={11} />
                          PAID
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-500" />
                        <span className="text-slate-300 font-medium">{u.email}</span>
                      </span>

                      {u.phone ? (
                        <a
                          href={`tel:${u.phone}`}
                          className="flex items-center gap-1.5 text-emerald-400 hover:underline font-medium"
                        >
                          <Phone size={12} />
                          <span>{u.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">No phone filed</span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-slate-500">
                      UID: <span className="text-slate-400 break-all">{u.userId}</span>
                    </div>
                  </div>
                </div>

                {/* Activity & Metrics Badges */}
                <div className="flex flex-wrap items-center gap-3 md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  {/* Products */}
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Stock Items</div>
                    <div className="text-sm font-extrabold text-slate-200 mt-0.5">
                      {u.productsCount || 0}
                    </div>
                  </div>

                  {/* Sales */}
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Total Sales</div>
                    <div className="text-sm font-extrabold text-slate-200 mt-0.5">
                      {u.salesCount || 0}
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-amber-500/20 text-center min-w-[100px]">
                    <div className="text-[10px] uppercase font-bold text-amber-500/80">Revenue Vol.</div>
                    <div className="text-sm font-extrabold text-amber-400 mt-0.5">
                      ₦{(u.totalVolume || 0).toLocaleString()}
                    </div>
                  </div>

                  {/* Copy UID Button */}
                  <button
                    onClick={() => copyToClipboard(u.userId, `user-${u.userId}`)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                    title="Copy User ID"
                  >
                    {copiedId === `user-${u.userId}` ? (
                      <CheckCircle size={15} className="text-emerald-400" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {visibleUsers.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                {showPaidOnly
                  ? 'No paid users yet.'
                  : `No users found matching "${searchUserQuery}".`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REAL-TIME INTERACTION LOG CONSOLE (No clipped ellipses) */}
      {activeTab === 'logs' && (
        <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Server Real-Time Interaction Logs
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setLogFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  logFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                All ({logs.length})
              </button>
              <button
                onClick={() => setLogFilter('errors')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  logFilter === 'errors' ? 'bg-red-500 text-white' : 'bg-slate-900 text-red-400 border border-slate-800'
                }`}
              >
                Errors ({logs.filter((l) => l.status >= 400).length})
              </button>
              <button
                onClick={() => setLogFilter('200')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  logFilter === '200' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-emerald-400 border border-slate-800'
                }`}
              >
                200 OK
              </button>
              <button
                onClick={() => setLogFilter('401')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  logFilter === '401' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400 border border-slate-800'
                }`}
              >
                401 Unauthorized
              </button>
              <button
                onClick={() => setLogFilter('500')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  logFilter === '500' ? 'bg-red-600 text-white' : 'bg-slate-900 text-red-400 border border-slate-800'
                }`}
              >
                500 Error
              </button>

              <button
                onClick={handleClearLogs}
                disabled={isClearingLogs || logs.length === 0}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                title="Clear all recorded server interaction logs"
              >
                <Trash2 size={13} />
                <span>{isClearingLogs ? 'Clearing...' : 'Clear Log History'}</span>
              </button>
            </div>
          </div>

          {clearSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={15} />
              <span>{clearSuccessMessage}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchLogQuery}
              onChange={(e) => setSearchLogQuery(e.target.value)}
              placeholder="Filter logs by endpoint path, error detail, IP, or user..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Logs List - Full paths and details without ellipses */}
          <div className="border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="max-h-[550px] overflow-y-auto divide-y divide-slate-800/70 font-mono text-xs">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 ${
                        log.status >= 500
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : log.status === 401
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : log.status >= 400
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-slate-400 font-bold shrink-0">{log.method}</span>
                    <span className="text-slate-100 font-medium break-all">{log.path}</span>
                    {log.detail && (
                      <span className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-lg break-words">
                        {log.detail}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs shrink-0 pl-6 sm:pl-0">
                    {log.userId && (
                      <span className="text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg text-[10px] break-all">
                        {log.userId}
                      </span>
                    )}
                    <span>{log.durationMs}ms</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="p-10 text-center text-slate-500 text-xs">
                  No interaction logs matching filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MERCHANT COMPLAINTS DESK */}
      {activeTab === 'complaints' && (
        <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Phone size={18} className="text-purple-400" />
                <span>Urgent Merchant Support & Complaint Tickets</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Each complaint ticket includes the merchant's active phone number for immediate call/WhatsApp follow-up.
              </p>
            </div>
            <div className="text-xs text-slate-300 font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              Total Tickets: <span className="text-amber-400">{complaints.length}</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {complaints.map((comp) => (
              <div
                key={comp.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  comp.status === 'resolved'
                    ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                    : 'bg-slate-900/90 border-purple-500/40 text-slate-200 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        comp.status === 'resolved'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {comp.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                      {comp.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(comp.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions: Call, Copy Phone, Mark Resolved */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`tel:${comp.phoneNumber}`}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Call Merchant Now"
                    >
                      <Phone size={13} />
                      <span>{comp.phoneNumber}</span>
                    </a>

                    <button
                      onClick={() => copyToClipboard(comp.phoneNumber, comp.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                      title="Copy phone number"
                    >
                      {copiedId === comp.id ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>

                    {comp.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolveComplaint(comp.id)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Complaint Message Body */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-200 mt-2 font-sans leading-relaxed break-words">
                  {comp.message}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2.5">
                  <span>Merchant Account: <span className="text-slate-200 font-mono font-medium">{comp.userEmail}</span></span>
                  <span>Ticket ID: <span className="font-mono text-slate-500">{comp.id}</span></span>
                </div>
              </div>
            ))}

            {complaints.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                No user complaints registered yet. Incoming merchant tickets will appear here with phone numbers for rapid resolution.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS & PAYWALL (Paystack) */}
      {activeTab === 'paywall' && (
        <div className="space-y-6">
          {/* Configuration Card */}
          <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Lock size={18} className="text-amber-400" />
                  <span>Insight Paywall Configuration</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Set the price and duration merchants pay to unlock the Insights page. Switch test/live by
                  changing only <code className="text-amber-300 font-mono">PAYSTACK_SECRET_KEY</code> on the server.
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border self-start sm:self-auto ${
                  paywall?.configured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}
              >
                {paywall?.configured ? 'Paystack Connected' : 'Paystack Not Configured'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Enable/Disable toggle */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-[11px] uppercase font-bold text-slate-500">Paywall Status</div>
                <button
                  onClick={() => setPaywallForm((f) => ({ ...f, enabled: !f.enabled }))}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                    paywallForm.enabled
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${paywallForm.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {paywallForm.enabled ? 'Enabled (Users Must Pay)' : 'Disabled (Free Access)'}
                </button>
              </div>

              {/* Amount */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <label className="text-[11px] uppercase font-bold text-slate-500">Price (₦ Naira)</label>
                <input
                  type="number"
                  min={0}
                  value={paywallForm.amount}
                  onChange={(e) => setPaywallForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Duration */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <label className="text-[11px] uppercase font-bold text-slate-500">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  value={paywallForm.durationDays}
                  onChange={(e) => setPaywallForm((f) => ({ ...f, durationDays: e.target.value }))}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={savePaywall}
                disabled={paywallSaving}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-60"
              >
                <Save size={14} />
                <span>{paywallSaving ? 'Saving…' : 'Save Settings'}</span>
              </button>

              {paywallMessage && (
                <span
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    paywallMessage.type === 'ok' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {paywallMessage.text}
                </span>
              )}
            </div>
          </div>

          {/* Payment KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="text-xs font-semibold text-slate-400 mb-2">Total Revenue</div>
              <div className="text-2xl font-extrabold text-emerald-400">₦{(paywall?.stats.revenue || 0).toLocaleString()}</div>
            </div>
            <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="text-xs font-semibold text-slate-400 mb-2">Successful Payments</div>
              <div className="text-2xl font-extrabold text-slate-100">{paywall?.stats.successfulPayments ?? 0}</div>
            </div>
            <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="text-xs font-semibold text-slate-400 mb-2">Active Subscribers</div>
              <div className="text-2xl font-extrabold text-amber-400">{paywall?.stats.activeSubscribers ?? 0}</div>
            </div>
            <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="text-xs font-semibold text-slate-400 mb-2">Total Attempts</div>
              <div className="text-2xl font-extrabold text-slate-300">{paywall?.stats.totalPayments ?? 0}</div>
            </div>
          </div>

          {/* Active Subscribers */}
          <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users size={16} className="text-emerald-400" />
              <span>Active Subscribers ({paywall?.access.length || 0})</span>
            </h3>
            <div className="space-y-2.5">
              {(paywall?.access || []).map((a) => (
                <div key={a.userId} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-100 break-words">{a.email || 'No email'}</div>
                    <div className="text-[11px] font-mono text-slate-500 break-all">{a.userId}</div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 shrink-0">
                    <span className="text-emerald-400 font-bold">₦{((a.amountKobo || 0) / 100).toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Expires {new Date(a.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {(paywall?.access.length || 0) === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">No active subscribers yet.</div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-[#0E1118] border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CreditCard size={16} className="text-amber-400" />
              <span>Recent Payment Transactions ({paywall?.payments.length || 0})</span>
            </h3>
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden">
              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-800/70 font-mono text-xs">
                {(paywall?.payments || []).map((p) => (
                  <div key={p.reference} className="p-3.5 hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                          p.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                      <span className="text-slate-100 font-medium break-all">{p.reference}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                      <span className="text-slate-300 break-all max-w-[160px] truncate">{p.email}</span>
                      <span className="text-emerald-400 font-bold">₦{((p.amountKobo || 0) / 100).toLocaleString()}</span>
                      <span className="text-slate-500">{new Date(p.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {(paywall?.payments.length || 0) === 0 && (
                  <div className="p-10 text-center text-slate-500 text-xs">No payment transactions yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
