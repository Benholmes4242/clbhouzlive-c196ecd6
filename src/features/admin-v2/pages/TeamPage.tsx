import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { Shield, UserMinus, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useAdminV2Team, type TeamMember } from '../hooks/useAdminV2Access';
import {
  AdminPageHeader, AdminButton, AdminStatusPill,
  AdminSectionHeader, AdminKpiCard,
} from '../components/ui';

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  full:          { bg: '#FEF3C7', color: '#D97706', label: 'Admin' },
  admin:         { bg: '#FEF3C7', color: '#D97706', label: 'Admin' },
  moderator:     { bg: '#EFF6FF', color: '#1D6FF5', label: 'Moderator' },
  limited_admin: { bg: '#F5F3FF', color: '#7C3AED', label: 'Limited' },
  limited:       { bg: '#F5F3FF', color: '#7C3AED', label: 'Limited' },
};

function RoleBadge({ role }: { role: string }) {
  const styles = ROLE_STYLES[role] ?? ROLE_STYLES['limited'];
  return (
    <span style={{ background: styles.bg, color: styles.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
      {styles.label}
    </span>
  );
}

// ─── Expiry pill ──────────────────────────────────────────────────────────────

function ExpiryPill({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const expDate = new Date(expiresAt);
  const now = Date.now();
  if (expDate.getTime() < now) {
    return <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Expired</span>;
  }
  if (expDate.getTime() - now < 7 * 86_400_000) {
    return <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Expiring soon</span>;
  }
  return null;
}

// ─── Confirm revoke modal ─────────────────────────────────────────────────────

function ConfirmRevokeModal({
  member,
  onConfirm,
  onCancel,
  isPending,
}: {
  member: TeamMember | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  if (!member) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card border border-border/60 shadow-2xl p-6 space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Revoke access</p>
              <p className="text-sm text-muted-foreground">This cannot be undone</p>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground text-center">
            Remove admin access for <span className="font-medium text-foreground">{member.displayName ?? member.userId}</span>?
            They will immediately lose all admin permissions.
          </p>
          <div className="flex gap-2">
            <AdminButton variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </AdminButton>
            <AdminButton variant="danger" icon={UserMinus} loading={isPending} onClick={onConfirm} className="flex-1">
              Revoke
            </AdminButton>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Team member card ─────────────────────────────────────────────────────────

function TeamMemberCard({
  member,
  lastSeenAt,
  onRevoke,
}: {
  member: TeamMember;
  lastSeenAt: string | null;
  onRevoke: (member: TeamMember) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors">
      <SquircleAvatar src={member.avatarUrl} alt={member.displayName ?? 'User'} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold text-foreground truncate">
            {member.displayName ?? 'Unknown'}
          </span>
          <RoleBadge role={member.role} />
          <ExpiryPill expiresAt={member.expiresAt} />
        </div>
        {member.username && (
          <p className="text-[12px] text-muted-foreground">@{member.username}</p>
        )}
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-[11px] text-muted-foreground/70">
            Added {member.createdAt
              ? formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })
              : '—'
            }
            {member.expiresAt && (
              <span>
                {' '}· Expires {format(new Date(member.expiresAt), 'd MMM yyyy')}
              </span>
            )}
          </p>
          {lastSeenAt && (
            <span className="text-[11px] text-slate-400">
              · Last seen {formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
      <AdminButton variant="ghost" icon={UserMinus} size="sm" onClick={() => onRevoke(member)} className="flex-shrink-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400">
        Revoke
      </AdminButton>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { data, isLoading, refetch, revokeMutation } = useAdminV2Team();
  const [revokeTarget, setRevokeTarget] = useState<TeamMember | null>(null);

  // Fetch last seen for team members
  const memberIds = useMemo(() => data.map(m => m.userId), [data]);
  const { data: lastSeenMap = new Map<string, string>() } = useQuery({
    queryKey: ['admin-v2', 'team-last-seen', memberIds],
    queryFn: async () => {
      if (memberIds.length === 0) return new Map<string, string>();
      const { data: events } = await supabase
        .from('analytics_events')
        .select('user_id, created_at')
        .in('user_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(500);
      const map = new Map<string, string>();
      for (const e of events ?? []) {
        if (e.user_id && !map.has(e.user_id)) map.set(e.user_id, e.created_at);
      }
      return map;
    },
    enabled: memberIds.length > 0,
    staleTime: 60_000,
  });

  const fullAdmins    = data.filter(m => m.role === 'full');
  const limitedAdmins = data.filter(m => m.role !== 'full');
  const expiringSoon  = data.filter(m => {
    if (!m.expiresAt) return false;
    const d = new Date(m.expiresAt).getTime() - Date.now();
    return d > 0 && d < 7 * 86_400_000;
  });

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-3xl mx-auto space-y-6">

      <AdminPageHeader
        title="Team & Roles"
        description="Manage admin access and permissions"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />

      {/* Summary line */}
      <p style={{ fontSize: 13, color: '#64748B' }}>
        {data.length} active member{data.length !== 1 ? 's' : ''}
        {expiringSoon.length > 0 && <> · <span style={{ color: '#DC2626' }}>{expiringSoon.length} expiring soon</span></>}
        {' '}· {fullAdmins.length} admin{fullAdmins.length !== 1 ? 's' : ''}
      </p>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4">
        <AdminKpiCard title="Full Admins"    value={fullAdmins.length}    icon={Shield} iconColor="#f59e0b" isLoading={isLoading} />
        <AdminKpiCard title="Limited Admins" value={limitedAdmins.length} icon={Shield} isLoading={isLoading} />
      </div>

      {/* Members list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border/60 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded-md" />
                <div className="h-3 w-24 bg-muted rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {fullAdmins.length > 0 && (
            <div className="space-y-3">
              <AdminSectionHeader title="Full Admins" />
              <div className="space-y-2">
                {fullAdmins.map(m => (
                  <TeamMemberCard key={m.userId} member={m} lastSeenAt={lastSeenMap.get(m.userId) ?? null} onRevoke={setRevokeTarget} />
                ))}
              </div>
            </div>
          )}

          {limitedAdmins.length > 0 && (
            <div className="space-y-3">
              <AdminSectionHeader title="Limited Admins" />
              <div className="space-y-2">
                {limitedAdmins.map(m => (
                  <TeamMemberCard key={m.userId} member={m} lastSeenAt={lastSeenMap.get(m.userId) ?? null} onRevoke={setRevokeTarget} />
                ))}
              </div>
            </div>
          )}

          {data.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No team members yet</p>
              <p className="text-sm text-muted-foreground">Send invites to add admins</p>
            </div>
          )}
        </>
      )}

      <ConfirmRevokeModal
        member={revokeTarget}
        onConfirm={() => {
          if (revokeTarget) revokeMutation.mutate(revokeTarget.userId);
          setRevokeTarget(null);
        }}
        onCancel={() => setRevokeTarget(null)}
        isPending={revokeMutation.isPending}
      />

    </div>
  );
}
