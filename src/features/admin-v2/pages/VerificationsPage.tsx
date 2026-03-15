import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  CheckCircle, XCircle, Clock, Building2,
  User, RefreshCw, ExternalLink, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminV2Verifications, type VerificationRow } from '../hooks/useAdminV2Access';
import {
  AdminPageHeader, AdminFilterBar, AdminStatusPill,
  AdminButton, AdminSectionHeader, AdminDrawer, AdminKpiCard,
} from '../components/ui';

// ─── Type pill ────────────────────────────────────────────────────────────────

function TypePill({ type }: { type: 'business' | 'golfer' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
      type === 'business'
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
        : 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    )}>
      {type === 'business'
        ? <Building2 className="h-3 w-3" />
        : <User className="h-3 w-3" />
      }
      {type === 'business' ? 'Business' : 'Golfer'}
    </span>
  );
}

// ─── Verification detail drawer ───────────────────────────────────────────────

function VerificationDrawer({
  item,
  onClose,
  onDecide,
  isPending,
}: {
  item: VerificationRow | null;
  onClose: () => void;
  onDecide: (id: string, type: 'business' | 'golfer', decision: 'approved' | 'rejected', note: string) => void;
  isPending: boolean;
}) {
  const [adminNote, setAdminNote] = useState('');
  const [confirming, setConfirming] = useState<'approved' | 'rejected' | null>(null);

  const handleDecide = (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !adminNote.trim()) {
      setConfirming('rejected');
      return;
    }
    if (!item) return;
    onDecide(item.id, item.type, decision, adminNote);
    setAdminNote('');
    setConfirming(null);
    // Do not close here — onDecide's mutation calls onClose on success
  };

  const isPendingItem = item?.status === 'pending';

  return (
    <AdminDrawer
      open={!!item}
      onClose={() => { onClose(); setAdminNote(''); setConfirming(null); }}
      title="Verification Request"
      subtitle={item ? `${item.type === 'business' ? 'Business' : 'Golfer'} · ${item.status}` : undefined}
    >
      {!item ? null : (
        <div className="space-y-6">

          {/* Status + type */}
          <div className="flex items-center gap-2 flex-wrap">
            <TypePill type={item.type} />
            <AdminStatusPill
              status={
                item.status === 'approved' ? 'active' :
                item.status === 'pending'  ? 'pending' : 'error'
              }
              label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            />
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Submitted</span>
              <span className="text-foreground">
                {format(new Date(item.createdAt), 'd MMM yyyy, HH:mm')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Requested by</span>
              <span className="font-mono text-foreground text-[12px]">
                {item.requestedBy?.slice(0, 8)}…
              </span>
            </div>
            {item.reviewedAt && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Reviewed</span>
                <span className="text-foreground">
                  {format(new Date(item.reviewedAt), 'd MMM yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Type-specific content */}
          {item.type === 'business' && item.domain && (
            <div className="space-y-3">
              <AdminSectionHeader title="Domain" />
              <div className="rounded-lg border border-border/60 px-4 py-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Domain</span>
                  <a
                    href={`https://${item.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground flex items-center gap-1 hover:opacity-70"
                  >
                    {item.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {item.type === 'golfer' && (
            <div className="space-y-3">
              <AdminSectionHeader title="Evidence" />
              {item.inviteReason && (
                <div className="rounded-lg border border-border/60 px-4 py-3">
                  <p className="text-[12px] text-muted-foreground mb-1">Reason</p>
                  <p className="text-[13px] text-foreground">{item.inviteReason}</p>
                </div>
              )}
              {item.evidenceUrl && (
                <a
                  href={item.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 text-[13px] text-foreground hover:bg-muted/60 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Evidence
                </a>
              )}
            </div>
          )}

          {/* Applicant's note */}
          {item.note && (
            <div className="space-y-2">
              <AdminSectionHeader title="Applicant Note" />
              <p className="text-[13px] text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
                {item.note}
              </p>
            </div>
          )}

          {/* Admin note (existing) */}
          {item.adminNote && (
            <div className="space-y-2">
              <AdminSectionHeader title="Admin Note" />
              <p className="text-[13px] text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
                {item.adminNote}
              </p>
            </div>
          )}

          {/* Decision area */}
          {isPendingItem && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <AdminSectionHeader title="Decision" />
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add an admin note (required for rejection)…"
                rows={3}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-border/40"
              />
              {confirming === 'rejected' && !adminNote.trim() && (
                <p className="text-[12px] text-red-500 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  A note is required when rejecting a request.
                </p>
              )}
              <div className="flex gap-2">
                <AdminButton
                  variant="primary"
                  icon={CheckCircle}
                  loading={isPending}
                  onClick={() => handleDecide('approved')}
                  className="flex-1"
                >
                  Approve
                </AdminButton>
                <AdminButton
                  variant="danger"
                  icon={XCircle}
                  loading={isPending}
                  onClick={() => handleDecide('rejected')}
                  className="flex-1"
                >
                  Reject
                </AdminButton>
              </div>
            </div>
          )}

        </div>
      )}
    </AdminDrawer>
  );
}

// ─── Verification card (list item) ───────────────────────────────────────────

function VerificationCard({
  item,
  onClick,
}: {
  item: VerificationRow;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors active:bg-muted/60"
    >
      {/* Icon */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
        item.type === 'business'
          ? 'bg-blue-50 dark:bg-blue-500/15'
          : 'bg-purple-50 dark:bg-purple-500/15',
      )}>
        {item.type === 'business'
          ? <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          : <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <TypePill type={item.type} />
          <AdminStatusPill
            status={
              item.status === 'approved' ? 'active' :
              item.status === 'pending'  ? 'pending' : 'error'
            }
            label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </p>
      </div>

      <ChevronDown className="h-4 w-4 text-muted-foreground/40 -rotate-90 flex-shrink-0" />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VerificationsPage() {
  const { data, isLoading, refetch, counts, reviewMutation } = useAdminV2Verifications();
  const [activeFilter, setActiveFilter] = useState('pending');
  const [drawerItem, setDrawerItem] = useState<VerificationRow | null>(null);

  const filtered = data.filter(v => {
    if (activeFilter === 'pending')  return v.status === 'pending';
    if (activeFilter === 'approved') return v.status === 'approved' || v.status === 'accepted';
    if (activeFilter === 'rejected') return v.status === 'rejected' || v.status === 'declined';
    if (activeFilter === 'business') return v.type === 'business';
    if (activeFilter === 'golfer')   return v.type === 'golfer';
    return true;
  });

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-4xl mx-auto space-y-6">

      <AdminPageHeader
        title="Verification Queue"
        description="Review pending verification requests"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard title="Pending"  value={counts.pending}  icon={Clock}       iconColor="#f59e0b" isLoading={isLoading} />
        <AdminKpiCard title="Approved" value={counts.approved} icon={CheckCircle} iconColor="#22c55e" isLoading={isLoading} />
        <AdminKpiCard title="Rejected" value={counts.rejected} icon={XCircle}     iconColor="hsl(var(--destructive))" isLoading={isLoading} />
        <AdminKpiCard title="Total"    value={counts.all}      icon={Building2}   isLoading={isLoading} />
      </div>

      {/* Filters */}
      <AdminFilterBar
        filters={[
          { id: 'all',      label: 'All',      count: counts.all },
          { id: 'pending',  label: 'Pending',  count: counts.pending,  variant: 'warning' },
          { id: 'approved', label: 'Approved', count: counts.approved, variant: 'success' },
          { id: 'rejected', label: 'Rejected', count: counts.rejected, variant: 'danger'  },
          { id: 'business', label: 'Business', count: counts.business },
          { id: 'golfer',   label: 'Golfer',   count: counts.golfer   },
        ]}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      {/* List */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/30">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded-md" />
                  <div className="h-3 w-20 bg-muted rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Queue is clear</p>
            <p className="text-sm text-muted-foreground">
              No {activeFilter === 'all' ? '' : activeFilter} verification requests
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(item => (
              <VerificationCard
                key={item.id}
                item={item}
                onClick={() => setDrawerItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      <VerificationDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onDecide={(id, type, decision, note) =>
          reviewMutation.mutate(
            { id, type, decision, adminNote: note },
            { onSuccess: () => setDrawerItem(null) }
          )
        }
        isPending={reviewMutation.isPending}
      />

    </div>
  );
}
