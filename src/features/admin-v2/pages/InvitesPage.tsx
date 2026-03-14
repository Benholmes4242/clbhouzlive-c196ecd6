import React, { useState } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Mail, Send, X, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminV2Invites, type InviteRow } from '../hooks/useAdminV2Access';
import {
  AdminPageHeader, AdminFilterBar, AdminStatusPill,
  AdminButton, AdminKpiCard,
} from '../components/ui';

// ─── New invite form ──────────────────────────────────────────────────────────

function NewInviteForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (email: string, role: string, notes: string) => void;
  isPending: boolean;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'full' | 'limited'>('limited');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) return;
    onSubmit(email.trim(), role, notes);
    setEmail('');
    setNotes('');
    setOpen(false);
  };

  if (!open) {
    return (
      <AdminButton variant="primary" icon={Send} onClick={() => setOpen(true)}>
        Send Invite
      </AdminButton>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-foreground">New Invite</p>
        <button onClick={() => setOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-muted-foreground">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            className="w-full h-10 px-3 rounded-lg border border-border/60 bg-background text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-muted-foreground">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {(['limited', 'full'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  'px-3 py-2.5 rounded-lg border text-[13px] font-medium text-left transition-all',
                  role === r
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <p className="font-semibold">{r === 'full' ? 'Full Admin' : 'Limited Admin'}</p>
                <p className="text-[11px] mt-0.5 opacity-70">
                  {r === 'full' ? 'Full console access' : 'Golf courses only'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-muted-foreground">Note (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Course data manager"
            className="w-full h-10 px-3 rounded-lg border border-border/60 bg-background text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/40"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <AdminButton variant="primary" icon={Send} loading={isPending} onClick={handleSubmit} className="flex-1">
          Send Invite
        </AdminButton>
        <AdminButton variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </AdminButton>
      </div>
    </div>
  );
}

// ─── Invite row ───────────────────────────────────────────────────────────────

function InviteCard({
  invite,
  onCancel,
  onResend,
  isPending,
}: {
  invite: InviteRow;
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
  isPending: boolean;
}) {
  const isExpired = !invite.acceptedAt && isPast(new Date(invite.expiresAt));
  const isAccepted = !!invite.acceptedAt;
  const isCancelled = invite.status === 'cancelled';
  const isPendingInvite = !isAccepted && !isExpired && !isCancelled;

  const statusEl = isAccepted
    ? <AdminStatusPill status="active" label="Accepted" />
    : isExpired
      ? <AdminStatusPill status="error" label="Expired" />
      : isCancelled
        ? <AdminStatusPill status="inactive" label="Cancelled" />
        : <AdminStatusPill status="pending" label="Pending" />;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        isAccepted ? 'bg-green-50 dark:bg-green-500/15' : 'bg-muted',
      )}>
        {isAccepted
          ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          : <Mail className="h-4 w-4 text-muted-foreground" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13.5px] font-semibold text-foreground truncate">{invite.email}</p>
          {statusEl}
          {invite.role && (
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {invite.role === 'full' ? 'Full' : 'Limited'}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {isAccepted && invite.acceptedAt
            ? `Accepted ${formatDistanceToNow(new Date(invite.acceptedAt), { addSuffix: true })}`
            : isExpired
              ? `Expired ${formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}`
              : `Sent ${formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })} · Expires ${format(new Date(invite.expiresAt), 'd MMM')}`
          }
        </p>
      </div>

      {isPendingInvite && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <AdminButton variant="ghost" size="sm" icon={RefreshCw} loading={isPending} onClick={() => onResend(invite.id)}>
            Resend
          </AdminButton>
          <AdminButton variant="ghost" size="sm" icon={X} loading={isPending} onClick={() => onCancel(invite.id)} />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvitesPage() {
  const { data, isLoading, refetch, counts, createMutation, cancelMutation, resendMutation } = useAdminV2Invites();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = data.filter(inv => {
    const isExpired = !inv.acceptedAt && isPast(new Date(inv.expiresAt));
    if (activeFilter === 'pending')   return !inv.acceptedAt && !isExpired && inv.status !== 'cancelled';
    if (activeFilter === 'accepted')  return !!inv.acceptedAt;
    if (activeFilter === 'expired')   return isExpired;
    if (activeFilter === 'cancelled') return inv.status === 'cancelled';
    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <AdminPageHeader
        title="Invites"
        description="Manage admin team invitations"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />

      {/* New invite form */}
      <NewInviteForm
        onSubmit={(email, role, notes) => createMutation.mutate({ email, role, notes })}
        isPending={createMutation.isPending}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="All"       value={counts.all}       icon={Mail}        isLoading={isLoading} />
        <AdminKpiCard title="Pending"   value={counts.pending}   icon={Clock}       iconColor="#f59e0b" isLoading={isLoading} />
        <AdminKpiCard title="Accepted"  value={counts.accepted}  icon={CheckCircle} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Expired"   value={counts.expired}   icon={Clock}       iconColor="hsl(var(--destructive))" isLoading={isLoading} />
      </div>

      {/* Filters */}
      <AdminFilterBar
        filters={[
          { id: 'all',       label: 'All',       count: counts.all },
          { id: 'pending',   label: 'Pending',   count: counts.pending,   variant: 'warning' },
          { id: 'accepted',  label: 'Accepted',  count: counts.accepted,  variant: 'success' },
          { id: 'expired',   label: 'Expired',   count: counts.expired,   variant: 'danger'  },
          { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
        ]}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      {/* List */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/30">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted rounded-md" />
                  <div className="h-3 w-24 bg-muted rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No invites</p>
            <p className="text-sm text-muted-foreground">Send an invite above to add a team member</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(invite => (
              <InviteCard
                key={invite.id}
                invite={invite}
                onCancel={(id) => cancelMutation.mutate(id)}
                onResend={(id) => resendMutation.mutate(id)}
                isPending={cancelMutation.isPending || resendMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
