import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle,
  UserPlus,
  Heart,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

/*
  Admin Overview
  ==============
  The console home. Surfaces the same counts the sidebar badges use (from the
  shared <Outlet context>), rendered as clickable stat cards that deep-link into
  the relevant module, plus a small work-queue "quick actions" row so the admin
  lands on what needs attention.
*/

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { stats, statsLoading } = useOutletContext();

  const cards = [
    {
      title: 'All Devotees',
      value: stats.totalUsers,
      Icon: Users,
      accent: 'text-[#FBDB8C]',
      to: '/admin/devotees?filter=ALL',
    },
    {
      title: 'KYC Review',
      value: stats.submittedKYC,
      Icon: FileText,
      accent: 'text-amber-400',
      to: '/admin/devotees?filter=SUBMITTED',
    },
    {
      title: 'Verified',
      value: stats.approvedKYC,
      Icon: CheckCircle,
      accent: 'text-emerald-400',
      to: '/admin/devotees?filter=APPROVED',
    },
    {
      title: 'Total Invited',
      value: stats.totalInvited,
      Icon: UserPlus,
      accent: 'text-purple-400',
      to: '/admin/devotees?filter=ALL',
    },
    {
      title: 'Pending Seva',
      value: stats.pendingDonations,
      Icon: Heart,
      accent: 'text-[#FBDB8C]',
      to: '/admin/seva?status=PENDING',
    },
  ];

  const quickActions = [
    {
      label: 'Review pending KYC',
      hint: `${statsLoading ? '…' : stats.submittedKYC ?? 0} awaiting verification`,
      Icon: ShieldCheck,
      to: '/admin/devotees?filter=SUBMITTED',
    },
    {
      label: 'Confirm Seva offerings',
      hint: `${statsLoading ? '…' : stats.pendingDonations ?? 0} pending confirmation`,
      Icon: Heart,
      to: '/admin/seva?status=PENDING',
    },
  ];

  return (
    <section className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-lg md:text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">
          Console Overview
        </h2>
        <p className="text-[11px] text-white/40 font-medium tracking-wide mt-1">
          A snapshot of the sangha — tap any card to manage.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {cards.map((card) => {
          const { title, value, Icon, accent, to } = card;
          return (
          <button
            key={title}
            type="button"
            onClick={() => navigate(to)}
            className="group text-left bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(251,219,140,0.1)] hover:-translate-y-1 hover:border-[#FBDB8C]/40"
          >
            <div className="absolute top-0 left-0 w-[1px] h-full bg-[#FBDB8C] opacity-30" />
            <div className="relative z-10">
              <h3 className="text-[9px] md:text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3">
                {title}
              </h3>
              <p className="text-3xl md:text-4xl font-sans font-bold text-white tabular-nums tracking-tight leading-none">
                {statsLoading ? '…' : (value ?? 0)}
              </p>
            </div>
            <div className={`absolute top-3 right-3 md:top-5 md:right-5 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl bg-white/5 transition-all group-hover:bg-[#FBDB8C]/10 ${accent}`}>
              <Icon size={22} />
            </div>
          </button>
          );
        })}
      </div>

      {/* Quick actions / work queue */}
      <div>
        <p className="text-[9px] font-black text-[#FBDB8C]/30 uppercase tracking-[0.3em] mb-3">
          Needs Attention
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const { label, hint, Icon, to } = action;
            return (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className="group flex items-center gap-4 bg-white/5 border border-[#FBDB8C]/10 rounded-2xl p-5 text-left transition-all hover:bg-white/[0.07] hover:border-[#FBDB8C]/30"
            >
              <div className="h-11 w-11 rounded-2xl bg-[#FBDB8C]/10 text-[#FBDB8C] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(251,219,140,0.15)]">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white tracking-wide">{label}</p>
                <p className="text-[11px] text-white/40 font-medium mt-0.5">{hint}</p>
              </div>
              <ArrowRight
                size={18}
                className="text-white/20 group-hover:text-[#FBDB8C] group-hover:translate-x-1 transition-all flex-shrink-0"
              />
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
