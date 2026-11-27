import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Coins,
  HeartHandshake,
  Clock,
  IndianRupee,
  Plus,
  Minus,
  History,
  Lock,
  FileText,
  Users,
  X,
  Trash2,
} from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { commonStyles } from '../../styles/index.styles';
import { S3Anchor } from '../../utils/s3Utils.jsx';
import { AdminPageHeader, AdminCard } from './AdminChrome';
import { AuditActionChip } from './auditActions.jsx';
import SevaRemoveModal from './SevaRemoveModal';

/*
  Devotee 360° view
  =================
  Everything about one devotee: profile + KYC, every seva (with who recorded /
  reviewed it), the AVG coin ledger, and the recent audit trail for this devotee.
  ADMINs can manually add or deduct coins (locked 5 years, reason required).
*/

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';
const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
      })
    : '—';
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_CHIP = {
  CONFIRMED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  REJECTED: 'text-red-400 bg-red-400/10 border-red-400/20',
  APPROVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  SUBMITTED: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

const Chip = ({ value }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
      STATUS_CHIP[value] || 'text-white/50 bg-white/5 border-white/10'
    }`}
  >
    {value || '—'}
  </span>
);

const StatCard = ({ icon, label, value, sub }) => {
  const Icon = icon;
  return (
  <div className="bg-[#0A194E]/30 border border-[#FBDB8C]/10 rounded-3xl p-5">
    <div className="flex items-center gap-2 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
      <Icon className="w-3.5 h-3.5 text-[#FBDB8C]/60" /> {label}
    </div>
    <p className="mt-2 text-2xl font-black text-[#FBDB8C] tabular-nums">{value}</p>
    {sub && <p className="mt-1 text-[11px] text-white/40">{sub}</p>}
  </div>
  );
};

const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between px-5 md:px-8 pt-6 pb-3">
    <h3 className="text-[10px] font-black text-[#FBDB8C]/70 uppercase tracking-[0.25em]">{children}</h3>
    {right}
  </div>
);

const Th = ({ children, className = '' }) => (
  <th className={`px-4 md:px-6 py-3 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ${className}`}>
    {children}
  </th>
);
const Td = ({ children, className = '' }) => (
  <td className={`px-4 md:px-6 py-4 text-[12px] text-white/70 align-top ${className}`}>{children}</td>
);

const coinSourceLabel = (e) => {
  if (e.source === 'ADMIN_ADJUSTMENT') return e.amount < 0 ? 'Manual deduction' : 'Manual addition';
  if (e.source === 'STATUE_1_5_FT_DONATION') return '1.5 Ft statue seva';
  return e.source;
};

// ---------------------------------------------------------------------------

const AdjustCoinsModal = ({ devotee, balance, onClose, onDone }) => {
  const [mode, setMode] = useState('ADD');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const n = parseInt(amount, 10);
  const valid = Number.isInteger(n) && n > 0;
  const signed = valid ? (mode === 'ADD' ? n : -n) : 0;
  const newBalance = balance + signed;
  const canSave = valid && reason.trim().length >= 3 && newBalance >= 0 && !saving;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      await api.post(API_ROUTES.ADMIN_USER_COINS(devotee.id), { amount: signed, reason: reason.trim() });
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust coins');
      setSaving(false);
    }
  };

  return (
    <div className={commonStyles.modalOverlay} onClick={onClose}>
      <div
        className="bg-[#060B28] border border-[#FBDB8C]/30 rounded-3xl max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#FBDB8C]/10 flex justify-between items-center bg-white/5 rounded-t-3xl">
          <div>
            <h3 className="text-[#FBDB8C] font-black uppercase tracking-widest text-sm">Adjust AVG coins</h3>
            <p className="text-white/40 text-[11px] mt-1">{devotee.full_name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'ADD', label: 'Add coins', sign: '+' },
              { v: 'DEDUCT', label: 'Deduct coins', sign: '-' },
            ].map(({ v, label, sign }) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  mode === v
                    ? v === 'ADD'
                      ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-300'
                      : 'bg-red-400/15 border-red-400/40 text-red-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                }`}
              >
                {sign === '+' ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />} {label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#FBDB8C]/40 uppercase tracking-[0.2em] mb-2">Coins</label>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-lg font-black tabular-nums focus:outline-none focus:border-[#FBDB8C]/40"
              placeholder="e.g. 100"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#FBDB8C]/40 uppercase tracking-[0.2em] mb-2">
              Reason (required — saved in the audit log)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FBDB8C]/40"
              placeholder="e.g. Second statue seva paid in cash on 12 Nov"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[12px] text-white/60 space-y-1">
            <div className="flex justify-between">
              <span>Current balance</span>
              <span className="tabular-nums text-white">{balance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span className={`tabular-nums ${signed < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {signed > 0 ? '+' : ''}
                {signed.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-black">
              <span>New balance</span>
              <span className={`tabular-nums ${newBalance < 0 ? 'text-red-400' : 'text-[#FBDB8C]'}`}>
                {newBalance.toLocaleString()}
              </span>
            </div>
            <p className="pt-2 text-[10px] text-white/30 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked for 5 years from today, like statue coins.
            </p>
          </div>

          {newBalance < 0 && <p className="text-red-400 text-xs">Balance can't go below 0.</p>}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="p-6 border-t border-[#FBDB8C]/10 flex justify-end gap-3 bg-white/5 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className="px-5 py-2.5 rounded-2xl bg-[#FBDB8C] text-[#060B28] text-[10px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : mode === 'ADD' ? 'Add coins' : 'Deduct coins'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const AdminDevoteeDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [flash, setFlash] = useState('');
  const [removeId, setRemoveId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(API_ROUTES.ADMIN_USER_OVERVIEW(userId));
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load devotee');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const back = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/admin/devotees'))}
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:text-white"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Back
    </button>
  );

  if (loading && !data) {
    return (
      <div className="w-full">
        <AdminPageHeader title="Devotee" subtitle="Loading…" actions={back} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full">
        <AdminPageHeader title="Devotee" subtitle={error} actions={back} />
      </div>
    );
  }

  const { user, sevaSummary, sevas, coins, activity } = data;

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title={user.full_name || user.email}
        subtitle={`${user.email}${user.phone_number ? ` · ${user.phone_number}` : ''} · joined ${fmtDate(user.created_at)}`}
        actions={
          <>
            {back}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdjustOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FBDB8C]/10 border border-[#FBDB8C]/20 text-[#FBDB8C] text-[10px] font-black uppercase tracking-widest hover:bg-[#FBDB8C]/20"
              >
                <Coins className="w-3.5 h-3.5" /> Adjust coins
              </button>
            )}
          </>
        }
      />

      {flash && (
        <div className="px-5 py-3 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs">
          {flash}
        </div>
      )}

      {/* Profile strip */}
      <AdminCard>
        <div className="p-5 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-5 text-[12px]">
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Role</p>
            <Chip value={user.role} />
          </div>
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">KYC</p>
            <Chip value={user.kyc_status} />
            {user.kyc_reviewed_by_name && (
              <p className="text-white/40 mt-1 text-[11px]">by {user.kyc_reviewed_by_name}</p>
            )}
            {user.kyc_status === 'REJECTED' && user.kyc_rejection_reason && (
              <p className="text-red-300/70 mt-1 text-[11px]">{user.kyc_rejection_reason}</p>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Invited by</p>
            {user.invited_by_id ? (
              <Link to={`/admin/devotees/${user.invited_by_id}`} className="text-[#FBDB8C] hover:underline">
                {user.invited_by_name}
              </Link>
            ) : (
              <span className="text-white/50">Organic signup</span>
            )}
          </div>
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Invite code</p>
            <span className="font-mono text-white/80">{user.invite_code || '—'}</span>
            <p className="text-white/40 mt-1 text-[11px] flex items-center gap-1">
              <Users className="w-3 h-3" /> {user.invitees_count} invited
            </p>
          </div>
        </div>
      </AdminCard>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HeartHandshake}
          label="Sevas paid"
          value={sevaSummary.confirmedCount}
          sub={`${sevaSummary.total} total · ${sevaSummary.rejectedCount} rejected`}
        />
        <StatCard
          icon={IndianRupee}
          label="Total offered"
          value={inr(sevaSummary.confirmedAmount)}
          sub={sevaSummary.statueNumbers.length ? `Statue #${sevaSummary.statueNumbers.join(', #')}` : 'No statue seat'}
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={sevaSummary.pendingCount}
          sub={sevaSummary.pendingCount ? `${inr(sevaSummary.pendingAmount)} awaiting review` : 'Nothing pending'}
        />
        <StatCard
          icon={Coins}
          label="AVG coins"
          value={coins.totalBalance.toLocaleString()}
          sub={`${coins.lockedBalance.toLocaleString()} locked${
            coins.nextUnlockAt ? ` · next unlock ${fmtDate(coins.nextUnlockAt)}` : ''
          }`}
        />
      </div>

      {/* Sevas */}
      <AdminCard>
        <SectionTitle>Seva history ({sevas.length})</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <Th>#</Th>
                <Th>Date</Th>
                <Th>Seva</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th>Statue #</Th>
                <Th className="text-right">Coins</Th>
                <Th>Handled by</Th>
                <Th>Proof</Th>
                {isAdmin && <Th />}
              </tr>
            </thead>
            <tbody>
              {sevas.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="px-8 py-10 text-center text-white/30 text-xs">
                    No sevas yet.
                  </td>
                </tr>
              ) : (
                sevas.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <Td className="font-mono text-white/30">{d.id}</Td>
                    <Td className="whitespace-nowrap">{fmtDate(d.created_at)}</Td>
                    <Td className="text-white/90">{d.category_name}</Td>
                    <Td className="text-right tabular-nums text-white">{inr(d.amount)}</Td>
                    <Td>
                      <Chip value={d.status} />
                      {d.status === 'REJECTED' && d.rejection_reason && (
                        <p className="text-red-300/60 text-[10px] mt-1 max-w-[180px]">{d.rejection_reason}</p>
                      )}
                    </Td>
                    <Td className="tabular-nums">{d.statue_number ? `#${d.statue_number}` : '—'}</Td>
                    <Td className="text-right tabular-nums text-[#FBDB8C]">{d.coins != null ? d.coins : '—'}</Td>
                    <Td className="text-[11px] text-white/50">
                      {d.recorded_by_name && <div>Recorded: {d.recorded_by_name}</div>}
                      {d.reviewed_by_name && <div>Reviewed: {d.reviewed_by_name}</div>}
                      {!d.recorded_by_name && !d.reviewed_by_name && '—'}
                    </Td>
                    <Td>
                      {d.payment_proof_path ? (
                        <S3Anchor
                          src={d.payment_proof_path}
                          className="inline-flex items-center gap-1 text-[#FBDB8C]/80 hover:text-[#FBDB8C] text-[11px]"
                        >
                          <FileText className="w-3.5 h-3.5" /> View
                        </S3Anchor>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </Td>
                    {isAdmin && (
                      <Td>
<button
                          type="button"
                          onClick={() => setRemoveId(d.id)}
                          aria-label="Remove seva"
                          title="Remove seva"
                          className="p-2 rounded-xl border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </Td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Coin ledger */}
      <AdminCard>
        <SectionTitle
          right={
            <span className="text-[11px] text-white/40">
              Total {coins.totalBalance.toLocaleString()} · Locked {coins.lockedBalance.toLocaleString()} · Withdrawable{' '}
              {coins.withdrawableBalance.toLocaleString()}
            </span>
          }
        >
          AVG coin ledger
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <Th>Date</Th>
                <Th>Source</Th>
                <Th className="text-right">Coins</Th>
                <Th>Locked until</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody>
              {coins.entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-white/30 text-xs">
                    No AVG coins yet.
                  </td>
                </tr>
              ) : (
                coins.entries.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <Td className="whitespace-nowrap">{fmtDate(e.earnedAt)}</Td>
                    <Td className="text-white/90">
                      {coinSourceLabel(e)}
                      {e.donationId && <span className="text-white/30"> · seva #{e.donationId}</span>}
                    </Td>
                    <Td
                      className={`text-right tabular-nums font-black ${
                        e.amount < 0 ? 'text-red-300' : 'text-[#FBDB8C]'
                      }`}
                    >
                      {e.amount > 0 ? '+' : ''}
                      {e.amount.toLocaleString()}
                    </Td>
                    <Td className="whitespace-nowrap">{e.amount > 0 ? fmtDate(e.lockedUntil) : '—'}</Td>
                    <Td className="text-[11px] text-white/50">
                      {e.note || '—'}
                      {e.grantedByName && <div className="text-white/30">by {e.grantedByName}</div>}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Activity — audit trail is ADMIN-only */}
      {isAdmin && (
      <AdminCard>
        <SectionTitle
          right={
            <Link
              to={`/admin/audit-log?targetUserId=${user.id}`}
              className="text-[10px] font-black uppercase tracking-widest text-[#FBDB8C]/70 hover:text-[#FBDB8C]"
            >
              Full log →
            </Link>
          }
        >
          <span className="inline-flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> Changes made to this devotee
          </span>
        </SectionTitle>
        {activity.length === 0 ? (
          <p className="px-8 pb-8 text-white/30 text-xs">No recorded changes yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {activity.map((a) => (
              <li key={a.id} className="px-5 md:px-8 py-3 flex flex-wrap items-start gap-3 text-[12px]">
                <span className="text-white/40 whitespace-nowrap w-40 shrink-0">{fmtDateTime(a.createdAt)}</span>
                <AuditActionChip action={a.action} />
                <span className="flex-1 min-w-[200px] text-white/80">{a.summary}</span>
                <span className="text-white/40 whitespace-nowrap">
                  {a.actorName || a.actorEmail || 'Unknown'}
                  {a.actorRole && <span className="text-white/20"> · {a.actorRole}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
      )}

      {removeId && (
        <SevaRemoveModal
          donationId={removeId}
          onClose={() => setRemoveId(null)}
          onRemoved={async (message) => {
            setRemoveId(null);
            setFlash(message);
            window.dispatchEvent(new Event('admin:refresh-stats'));
            await load();
          }}
        />
      )}

      {adjustOpen && (
        <AdjustCoinsModal
          devotee={user}
          balance={coins.totalBalance}
          onClose={() => setAdjustOpen(false)}
          onDone={async () => {
            setAdjustOpen(false);
            setFlash('Coins updated and recorded in the audit log.');
            window.dispatchEvent(new Event('admin:refresh-stats'));
            await load();
          }}
        />
      )}
    </div>
  );
};

export default AdminDevoteeDetail;
