import React, { useState, useMemo } from 'react';
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

// ─── Priority helpers ─────────────────────────────────────────────────────────

function getPriority(createdAt: string): 'overdue' | 'pending' | 'new' {
  const age = Date.now() - new Date(createdAt).getTime();
  if (age > 72 * 3600_000) return 'overdue';
  if (age > 24 * 3600_000) return 'pending';
  return 'new';
}

function PriorityPill({ priority }: { priority: 'overdue' | 'pending' | 'new' }) {
  const styles = {
    overdue: { background: '#FEE2E2', color: '#DC2626' },
    pending: { background: '#FEF3C7', color: '#D97706' },
    new:     { background: '#DCFCE7', color: '#16A34A' },
  };
  const labels = { overdue: 'Overdue', pending: 'Pending', new: 'New' };
  return (
    <span style={{ ...styles[priority], fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
      {labels[priority]}
    </span>
  );
}

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
          <div className="flex items-center gap-2 flex-wrap">
            <TypePill type={item.type} />
            <AdminStatusPill
              status={item.status === 'approved' ? 'active' : item.status === 'pending' ? 'pending' : 'error'}
              label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            />
            <PriorityPill priority={getPriority(item.createdAt)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Submitted</span>
              <span className="text-foreground">{format(new Date(item.createdAt), 'd MMM yyyy, HH:mm')}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Requested by</span>
              <span className="font-mono text-foreground text-[12px]">{item.requestedBy?.slice(0, 8)}…</span>
            </div>
            {item.reviewedAt && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Reviewed</span>
                <span className="text-foreground">{format(new Date(item.reviewedAt), 'd MMM yyyy')}</span>
              </div>
            )}
          </div>

          {item.type === 'business' && item.domain && (
            <div className="space-y-3">
              <AdminSectionHeader title="Domain" />
              <div className="rounded-lg border border-border/60 px-4 py-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Domain</span>
                  <a href={`https://${item.domain}`} target="_blank" rel="noopener noreferrer"
                    className="text-foreground flex items-center gap-1 hover:opacity-70">
                    {item.domain}<ExternalLink className="h-3 w-3" />
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
                <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 text-[13px] text-foreground hover:bg-muted/60 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />View Evidence
                </a>
              )}
            </div>
          )}

          {item.note && (
            <div className="space-y-2">
              <AdminSectionHeader title="Applicant Note" />
              <p className="text-[13px] text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">{item.note}</p>
            </div>
          )}

          {item.adminNote && (
            <div className="space-y-2">
              <AdminSectionHeader title="Admin Note" />
              <p className="text-[13px] text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">{item.adminNote}</p>
            </div>
          )}

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
                  <XCircle className="h-3.5 w-3.5" />A note is required when rejecting a request.
                </p>
              )}
              <div className="flex gap-2">
                <AdminButton variant="primary" icon={CheckCircle} loading={isPending} onClick={() => handleDecide('approved')} className="flex-1">
                  Approve
                </AdminButton>
                <AdminButton variant="danger" icon={XCircle} loading={isPending} onClick={() => handleDecide('rejected')} className="flex-1">
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
  onQuickDecide,
  isDeciding,
}: {
  item: VerificationRow;
  onClick: () => void;
  onQuickDecide: (id: string, type: 'business' | 'golfer', decision: 'approved' | 'rejected') => void;
  isDeciding: boolean;
}) {
  const priority = getPriority(item.createdAt);
  const isPending = item.status === 'pending';

  return (
    <div className="group w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
      <button onClick={onClick} className="flex items-center gap-4 flex-1 min-w-0 text-left">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
          item.type === 'business' ? 'bg-blue-50 dark:bg-blue-500/15' : 'bg-purple-50 dark:bg-purple-500/15',
        )}>
          {item.type === 'business'
            ? <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            : <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <TypePill type={item.type} />
            <AdminStatusPill
              status={item.status === 'approved' ? 'active' : item.status === 'pending' ? 'pending' : 'error'}
              label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            />
            {isPending && <PriorityPill priority={priority} />}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
        </div>
      </button>

      {/* Quick actions on hover */}
      {isPending && (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickDecide(item.id, item.type, 'approved'); }}
            disabled={isDeciding}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors"
            style={{ background: '#DCFCE7', color: '#16A34A' }}
            title="Approve"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickDecide(item.id, item.type, 'rejected'); }}
            disabled={isDeciding}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors"
            style={{ background: '#FEE2E2', color: '#DC2626' }}
            title="Reject"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      <ChevronDown className="h-4 w-4 text-muted-foreground/40 -rotate-90 flex-shrink-0" />
    </div>
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

  // Summary stats
  const pendingItems = data.filter(v => v.status === 'pending');
  const overdueCount = pendingItems.filter(v => getPriority(v.createdAt) === 'overdue').length;
  const oldestAge = pendingItems.length > 0
    ? Math.max(...pendingItems.map(v => Date.now() - new Date(v.createdAt).getTime()))
    : 0;
  const oldestDays = Math.floor(oldestAge / (24 * 3600_000));

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

      {/* Summary banner */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {isLoading ? (
          <div className="flex gap-8 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-10 w-24 rounded" style={{ background: '#F1F5F9' }} />)}
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#17C964' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#17C964' }}>All caught up — no pending verifications</p>
          </div>
        ) : (
          <div className="flex items-center gap-8 flex-wrap" style={{ rowGap: 12 }}>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{pendingItems.length}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending</p>
            </div>
            <div style={{ width: 1, height: 28, background: '#F1F5F9' }} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: overdueCount > 0 ? '#DC2626' : '#0F172A' }}>{overdueCount}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overdue (&gt;72h)</p>
            </div>
            <div style={{ width: 1, height: 28, background: '#F1F5F9' }} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{oldestDays}d</p>
              <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Oldest Request</p>
            </div>
          </div>
        )}
      </div>

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
                onQuickDecide={(id, type, decision) =>
                  reviewMutation.mutate({ id, type, decision, adminNote: '' })
                }
                isDeciding={reviewMutation.isPending}
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
