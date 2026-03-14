import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Shield, UserMinus, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useAdminV2Team, type TeamMember } from '../hooks/useAdminV2Access';
import {
  AdminPageHeader, AdminButton, AdminStatusPill,
  AdminSectionHeader, AdminKpiCard,
} from '../components/ui';

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
  onRevoke,
}: {
  member: TeamMember;
  onRevoke: (member: TeamMember) => void;
}) {
  const isExpiringSoon = member.expiresAt
    ? new Date(member.expiresAt) < new Date(Date.now() + 7 * 86_400_000)
    : false;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors">
      <SquircleAvatar src={member.avatarUrl} alt={member.displayName ?? 'User'} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold text-foreground truncate">
            {member.displayName ?? 'Unknown'}
          </span>
          <AdminStatusPill status={member.role === 'full' ? 'full' : 'limited'} />
          {isExpiringSoon && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Expiring soon
            </span>
          )}
        </div>
        {member.username && (
          <p className="text-[12px] text-muted-foreground">@{member.username}</p>
        )}
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
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

  const fullAdmins    = data.filter(m => m.role === 'full');
  const limitedAdmins = data.filter(m => m.role !== 'full');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <AdminPageHeader
        title="Team & Roles"
        description="Manage admin access and permissions"
        action={
          <AdminButton variant="outline" icon={RefreshCw} size="sm" loading={isLoading} onClick={() => refetch()}>
            Refresh
          </AdminButton>
        }
      />

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
                  <TeamMemberCard key={m.userId} member={m} onRevoke={setRevokeTarget} />
                ))}
              </div>
            </div>
          )}

          {limitedAdmins.length > 0 && (
            <div className="space-y-3">
              <AdminSectionHeader title="Limited Admins" />
              <div className="space-y-2">
                {limitedAdmins.map(m => (
                  <TeamMemberCard key={m.userId} member={m} onRevoke={setRevokeTarget} />
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
