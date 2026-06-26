import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import {
  Wallet,
  Building2,
  ArrowDownToLine,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
  BadgeCheck,
} from 'lucide-react';

// ─ Helpers ─
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n ?? 0);

const STATUS_META = {
  PENDING: { label: 'Pending', color: 'text-amber-600   bg-amber-50   border-amber-200', Icon: Clock },
  PROCESSING: { label: 'Processing', color: 'text-blue-600    bg-blue-50    border-blue-200', Icon: RefreshCw },
  SUCCESS: { label: 'Credited', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', Icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-red-600     bg-red-50     border-red-200', Icon: XCircle },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  const { label, color, Icon } = meta;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─ Main Component ─
export default function Payouts() {
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bank' | 'withdraw'

  // Bank form
  const [bankForm, setBankForm] = useState({ account_number: '', ifsc_code: '', account_name: '', bank_name: '' });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState(null); // { type: 'success'|'error', text }

  // Withdraw form
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState(null);

  // ── Fetch wallet ─
  const fetchWallet = useCallback(async () => {
    try {
      const res = await api.get('/payouts/wallet');
      setWallet(res.data.wallet);
      setHistory(res.data.history);
      // Pre-fill bank form if account already exists
      if (res.data.wallet?.bank_account?.account_number) {
        const ba = res.data.wallet.bank_account;
        setBankForm({
          account_number: ba.account_number ?? '',
          ifsc_code: ba.ifsc_code ?? '',
          account_name: ba.account_name ?? '',
          bank_name: ba.bank_name ?? '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // ── Auto-poll PROCESSING withdrawals ────────────────────────────────────────
  // Polls every 4 s for any withdrawal in PROCESSING state.
  // Calls the dedicated status endpoint which checks Cashfree (or simulation)
  // and updates the DB. Stops automatically once nothing is PROCESSING.
  useEffect(() => {
    const processingRows = history.filter((w) => w.status === 'PROCESSING');
    if (processingRows.length === 0) return; // nothing to poll

    const timer = setInterval(async () => {
      let anyStillProcessing = false;

      await Promise.all(
        processingRows.map(async (w) => {
          try {
            const res = await api.get(`/payouts/withdrawal/${w._id}/status`);
            const updated = res.data.withdrawal;

            if (updated.status !== 'PROCESSING') {
              // Update just this row in state — no full reload
              setHistory((prev) =>
                prev.map((row) => (row._id === updated._id ? updated : row))
              );
              // If it's now SUCCESS, also refresh wallet balance
              if (updated.status === 'SUCCESS') fetchWallet();
            } else {
              anyStillProcessing = true;
            }
          } catch (_) {
            anyStillProcessing = true; // keep polling on error
          }
        })
      );

      if (!anyStillProcessing) clearInterval(timer);
    }, 4_000);

    return () => clearInterval(timer);
  }, [history, fetchWallet]);

  // ── Save bank account ───────────────────────────────────────────────────────
  const handleSaveBank = async (e) => {
    e.preventDefault();
    setBankSaving(true);
    setBankMsg(null);
    try {
      await api.put('/payouts/bank-account', bankForm);
      setBankMsg({ type: 'success', text: 'Bank account saved successfully!' });
      fetchWallet();
    } catch (err) {
      setBankMsg({ type: 'error', text: err.response?.data?.message ?? 'Failed to save bank account.' });
    } finally {
      setBankSaving(false);
    }
  };

  // ── Request withdrawal ──────────────────────────────────────────────────────
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawMsg(null);
    try {
      const res = await api.post('/payouts/withdraw', { amount: Number(withdrawAmt) });
      setWithdrawMsg({ type: 'success', text: res.data.message });
      setWithdrawAmt('');
      fetchWallet();
    } catch (err) {
      setWithdrawMsg({ type: 'error', text: err.response?.data?.message ?? 'Withdrawal failed.' });
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#2a7d5f]" />
      </div>
    );
  }

  const hasBankAccount = !!wallet?.bank_account?.account_number;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">

      {/* ── Earnings Summary Cards ─*/}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Available Balance',
            value: fmt(wallet?.available_balance),
            Icon: Wallet,
            accent: '#2a7d5f',
            bg: 'bg-[#f0f7f4]',
          },
          {
            label: 'Total Earned',
            value: fmt(wallet?.total_earned),
            Icon: TrendingUp,
            accent: '#7c3aed',
            bg: 'bg-purple-50',
          },
          {
            label: 'Total Withdrawn',
            value: fmt(wallet?.total_withdrawn),
            Icon: ArrowDownToLine,
            accent: '#0369a1',
            bg: 'bg-sky-50',
          },
        ].map(({ label, value, Icon, accent, bg }) => (
          <div key={label} className={`${bg} border border-[#c5e3d8] rounded-xl p-4 flex items-center gap-4`}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
              <Icon className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#4a7a67]">{label}</p>
              <p className="text-[20px] font-bold text-[#1a3d30] leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Tab Navigation ────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-[#f0f7f4] rounded-xl border border-[#c5e3d8] w-fit">
        {[
          { key: 'overview', label: 'Transaction History' },
          { key: 'bank', label: 'Bank Account' },
          { key: 'withdraw', label: 'Withdraw' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${activeTab === key
                ? 'bg-white text-[#1a3d30] shadow-sm border border-[#c5e3d8]'
                : 'text-[#4a7a67] hover:text-[#1a3d30]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Transaction History ──────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <section className="bg-white border border-[#c5e3d8] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#c5e3d8]">
            <h2 className="text-[14px] font-semibold text-[#1a3d30]">Withdrawal History</h2>
            <button
              onClick={fetchWallet}
              className="flex items-center gap-1.5 text-[12px] text-[#4a7a67] hover:text-[#1a3d30] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Wallet className="w-8 h-8 text-[#c5e3d8] mx-auto" />
              <p className="text-[13px] text-[#4a7a67]">No withdrawals yet. Your earnings will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0f7f4]">
              {history.map((w) => (
                <div key={w._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#fafffe] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f0f7f4] flex items-center justify-center">
                      <ArrowDownToLine className="w-4 h-4 text-[#2a7d5f]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a3d30]">{fmt(w.amount)}</p>
                      <p className="text-[11px] text-[#4a7a67] mt-0.5">
                        {new Date(w.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {w.utr && <span className="ml-2 font-mono">· UTR: {w.utr}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={w.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Bank Account ─────────────────────────────────────────────── */}
      {activeTab === 'bank' && (
        <section className="bg-white border border-[#c5e3d8] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[#2a7d5f]" />
            <div>
              <h2 className="text-[14px] font-semibold text-[#1a3d30]">Bank Account Details</h2>
              <p className="text-[12px] text-[#4a7a67] mt-0.5">Earnings will be transferred to this account</p>
            </div>
            {hasBankAccount && wallet.bank_account.is_verified && (
              <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBank} className="space-y-4">
            {[
              { key: 'account_number', label: 'Account Number', placeholder: 'Enter account number', type: 'text' },
              { key: 'ifsc_code', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234', type: 'text' },
              { key: 'account_name', label: 'Account Holder Name', placeholder: 'As per bank records', type: 'text' },
              { key: 'bank_name', label: 'Bank Name', placeholder: 'e.g. State Bank of India', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-[12px] font-medium text-[#1a3d30] mb-1.5">{label}</label>
                <input
                  id={`bank-${key}`}
                  type={type}
                  value={bankForm[key]}
                  onChange={(e) => setBankForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={key !== 'bank_name'}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#c5e3d8] text-[13px] text-[#1a3d30] placeholder-[#9abfb2] focus:outline-none focus:ring-2 focus:ring-[#2a7d5f]/20 focus:border-[#2a7d5f] transition-all bg-[#fafffe]"
                />
              </div>
            ))}

            {bankMsg && (
              <div className={`flex items-center gap-2 text-[12px] font-medium p-3 rounded-lg border ${bankMsg.type === 'success'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                {bankMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {bankMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={bankSaving}
              className="flex items-center gap-2 bg-[#2a7d5f] hover:bg-[#236b50] disabled:opacity-60 text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {bankSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              {hasBankAccount ? 'Update Bank Account' : 'Save Bank Account'}
            </button>
          </form>
        </section>
      )}

      {/* ── Tab: Withdraw ─────────────────────────────────────────────────── */}
      {activeTab === 'withdraw' && (
        <section className="bg-white border border-[#c5e3d8] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-5 h-5 text-[#2a7d5f]" />
            <div>
              <h2 className="text-[14px] font-semibold text-[#1a3d30]">Withdraw Earnings</h2>
              <p className="text-[12px] text-[#4a7a67] mt-0.5">Minimum withdrawal: ₹100 · Processed within 24 hours</p>
            </div>
          </div>

          {/* Balance display */}
          <div className="flex items-center justify-between bg-[#f0f7f4] rounded-xl px-5 py-4 border border-[#c5e3d8]">
            <div>
              <p className="text-[11px] font-medium text-[#4a7a67]">Available to withdraw</p>
              <p className="text-[26px] font-bold text-[#1a3d30] leading-tight mt-0.5">
                {fmt(wallet?.available_balance)}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-[#2a7d5f] opacity-40" />
          </div>

          {!hasBankAccount && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Please add a bank account first before requesting a withdrawal.{' '}
                <button onClick={() => setActiveTab('bank')} className="font-semibold underline">
                  Add bank account →
                </button>
              </span>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#1a3d30] mb-1.5">
                Amount to Withdraw (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a7a67] text-[13px] font-semibold">₹</span>
                <input
                  id="withdraw-amount"
                  type="number"
                  min={100}
                  max={wallet?.available_balance ?? 0}
                  step={1}
                  value={withdrawAmt}
                  onChange={(e) => setWithdrawAmt(e.target.value)}
                  placeholder="0"
                  disabled={!hasBankAccount}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-[#c5e3d8] text-[13px] text-[#1a3d30] focus:outline-none focus:ring-2 focus:ring-[#2a7d5f]/20 focus:border-[#2a7d5f] transition-all bg-[#fafffe] disabled:opacity-50"
                />
              </div>
              {/* Quick-fill shortcuts */}
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={!hasBankAccount || (wallet?.available_balance ?? 0) < amt}
                    onClick={() => setWithdrawAmt(String(amt))}
                    className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[#c5e3d8] text-[#4a7a67] hover:bg-[#f0f7f4] disabled:opacity-40 transition-all"
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={!hasBankAccount || !wallet?.available_balance}
                  onClick={() => setWithdrawAmt(String(wallet?.available_balance ?? 0))}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[#2a7d5f] text-[#2a7d5f] hover:bg-[#f0f7f4] disabled:opacity-40 transition-all"
                >
                  All
                </button>
              </div>
            </div>

            {/* Bank account preview */}
            {hasBankAccount && (
              <div className="bg-[#f0f7f4] rounded-xl px-4 py-3 border border-[#c5e3d8]">
                <p className="text-[11px] font-medium text-[#4a7a67] mb-1">Sending to</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2a7d5f]" />
                  <p className="text-[13px] font-semibold text-[#1a3d30]">
                    {wallet.bank_account.account_name} · ····{wallet.bank_account.account_number.slice(-4)} · {wallet.bank_account.ifsc_code}
                  </p>
                </div>
              </div>
            )}

            {withdrawMsg && (
              <div className={`flex items-center gap-2 text-[12px] font-medium p-3 rounded-lg border ${withdrawMsg.type === 'success'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                {withdrawMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {withdrawMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={withdrawing || !hasBankAccount || !withdrawAmt || Number(withdrawAmt) < 100}
              className="flex items-center gap-2 bg-[#2a7d5f] hover:bg-[#236b50] disabled:opacity-50 text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-colors w-full justify-center"
            >
              {withdrawing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                : <><ArrowDownToLine className="w-4 h-4" /> Withdraw {withdrawAmt ? fmt(Number(withdrawAmt)) : ''}</>
              }
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
