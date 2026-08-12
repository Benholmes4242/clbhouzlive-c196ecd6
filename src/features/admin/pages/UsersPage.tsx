import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, ShieldCheck, Mail, KeyRound, Trash2, Ban, X,
  UserPlus, MoreVertical, Search, ShieldAlert, MapPin, Radio, BadgeCheck,
  AtSign,
} from 'lucide-react';
import { LABEL } from '@/lib/tokens/type';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useUserActions } from '@/hooks/admin/useUserDetails';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';
import { formatDurationShort } from '../lib/chartPrimitives';
import SectionTabs from '../components/SectionTabs';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import DetailDrawer from '../components/DetailDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import AdminErrorState from '../components/AdminErrorState';
import AdminSheet from '../components/AdminSheet';
import { useUsers, type AdminUserRow, type UserFilterStatus, type AdminUserDetail } from '../hooks/useUsers';
import { useTeam, type TeamMember } from '../hooks/useTeam';
import { useInvites, type InviteRow } from '../hooks/useInvites';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePanelRole } from '@/hooks/usePanelRole';
import { panelCan } from '@/lib/panelCan';
import { useCreateAdminActionRequest } from '../hooks/useAdminActionRequests';
import MemberActivityCard from '../components/MemberActivityCard';

type TabId = 'members' | 'team' | 'invites';

/** Still used by the WHS sync line, Team grants and Invites copy. */
function relTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); }
  catch { return '-'; }
}

const LABEL_T = { ...LABEL, fontFeatureSettings: '"kern" 1, "liga" 1' } as const;
const FIG_T = { fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums' } as const;

/**
 * The roster's one age format. Absolute and tabular: "now" / "44m" / "31h" /
 * "32d". Shares formatDurationShort with the Dashboard and the Inbox; only the
 * sub-2-minute band differs (that formatter emits seconds, which read as noise
 * on a roster).
 */
function ageShort(iso: string | null | undefined): string {
  if (!iso) return '-';
  const secs = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(secs)) return '-';
  if (secs < 120) return 'now';
  return formatDurationShort(Math.max(0, secs));
}

function ageTone(iso: string | null | undefined): string {
  if (!iso) return t.inkFaint;
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (h < 24) return t.ok;
  if (h < 24 * 14) return t.inkMuted;
  return t.inkFaint;
}

/** 'user' is the default role and distinguishes nothing; suppress it by name. */
const DEFAULT_ROLES = new Set(['user']);
function badgeRole(role: string | null): string | null {
  if (!role) return null;
  return DEFAULT_ROLES.has(role) ? null : role;
}

/** Top-level view switch. Not a filter — active state is ink, like every other
 * active control in the console. SectionTabs stays untouched for its other
 * four consumers. */
function TopTabs({ tabs, activeId, onChange }: {
  tabs: Array<{ id: TabId; label: string; count?: number }>;
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 2px', flexWrap: 'wrap' }}>
      {tabs.map(tab => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              padding: '8px 14px', borderRadius: 999,
              border: `1px solid ${active ? t.ink : t.line}`,
              background: active ? t.ink : t.surface,
              color: active ? t.canvas : t.inkMuted,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span style={{
                ...FIG_T, background: active ? t.canvas : t.line,
                color: active ? t.ink : t.inkMuted,
                fontSize: 11, padding: '0 6px', borderRadius: 999,
                minWidth: 18, textAlign: 'center',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * MembersPage (D4). Route stays /admin-v2/users; edge-function emails deep
 * link here. Tabs: Members / Team / Invites. Members = roster + Member 360
 * bottom sheet with a ?member= deep link.
 */
export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const { role } = usePanelRole();
  const caps = panelCan(role);
  const isFullAdmin = caps.manageAdmins;

  // Legacy ?tab=all is mapped to the new "members" tab.
  const rawTab = (params.get('tab') as string | null) ?? 'members';
  const tab: TabId = rawTab === 'all' ? 'members'
    : rawTab === 'team' || rawTab === 'invites' ? rawTab
    : 'members';

  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const invites = useInvites();

  const tabs = useMemo(() => {
    const base: Array<{ id: TabId; label: string; count?: number }> = [
      { id: 'members', label: 'Members' },
    ];
    if (isFullAdmin) {
      base.push({ id: 'team', label: 'Team & Roles' });
      base.push({ id: 'invites', label: 'Invites', count: invites.counts.pending || undefined });
    }
    return base;
  }, [invites.counts.pending, isFullAdmin]);

  useEffect(() => {
    const handler = () => { invites.refetch(); };
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [invites]);

  const effectiveTab: TabId =
    !isFullAdmin && (tab === 'team' || tab === 'invites') ? 'members' : tab;

  return (
    <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1180, margin: '0 auto' }}>
      <TopTabs tabs={tabs} activeId={effectiveTab} onChange={setTab} />
      {effectiveTab === 'members' && <MembersTab />}
      {effectiveTab === 'team' && isFullAdmin && <TeamTab />}
      {effectiveTab === 'invites' && isFullAdmin && <InvitesTab />}
    </div>
  );
}

/* ─────────────────────── Members (roster) ─────────────────────── */

const LEGACY_FILTER_VALUES = new Set(['unverified', 'new_today']);
const VALID_FILTERS: UserFilterStatus[] = [
  'all', 'new_this_week', 'active_24h', 'dormant_14d', 'eg_issues', 'suspended', 'verified', 'admin',
];

function MembersTab() {
  const [params, setParams] = useSearchParams();
  const {
    users, filteredCount, allCount, isLoading, refetch,
    search, setSearch, filter, setFilter, counts,
    page, setPage, pageSize,
    drawerUserId, setDrawerUserId, userDetail, detailLoading, detailError, refetchDetail,
    updateRole, roleUpdating,
  } = useUsers();

  const [searchInput, setSearchInput] = useState(search);
  const debounced = useDebouncedValue(searchInput, 220);
  useEffect(() => { setSearch(debounced); }, [debounced]); // eslint-disable-line

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [refetch]);

  // URL <-> filter binding. Legacy verified/unverified/new_today are silently
  // remapped to All so old deep links keep working.
  useEffect(() => {
    const raw = params.get('filter');
    if (!raw) {
      if (filter !== 'all') setFilter('all');
      return;
    }
    if (LEGACY_FILTER_VALUES.has(raw)) {
      if (filter !== 'all') setFilter('all');
      return;
    }
    const next = VALID_FILTERS.find(v => v === raw) ?? 'all';
    if (next !== filter) setFilter(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const updateFilterUrl = (id: UserFilterStatus) => {
    setFilter(id);
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('filter');
    else next.set('filter', id);
    setParams(next, { replace: true });
  };

  // ?member= deep link (matches the Inbox ?ticket= pattern).
  useEffect(() => {
    const member = params.get('member');
    if (member && member !== drawerUserId) setDrawerUserId(member);
    if (!member && drawerUserId) setDrawerUserId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const openMember = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('member', id);
    setParams(next, { replace: true });
    setDrawerUserId(id);
  };
  const closeMember = () => {
    const next = new URLSearchParams(params);
    next.delete('member');
    setParams(next, { replace: true });
    setDrawerUserId(null);
  };

  // Cohort board. No 'all' tile: the roster defaults to all members and a tile
  // deselects on a second tap. 'all' stays a valid ?filter= value.
  const cohorts: { id: Exclude<UserFilterStatus, 'all'>; label: string; count: number }[] = [
    { id: 'new_this_week', label: 'New this week',  count: counts.new_this_week },
    { id: 'active_24h',    label: 'Active 24h',     count: counts.active_24h },
    { id: 'dormant_14d',   label: 'Dormant 14d+',   count: counts.dormant_14d },
    { id: 'eg_issues',     label: 'EG issues',      count: counts.eg_issues },
    { id: 'suspended',     label: 'Suspended',      count: counts.suspended },
    { id: 'verified',      label: 'Verified',       count: counts.verified },
    { id: 'admin',         label: 'Admins',         count: counts.admin },
  ];
  const activeCohortLabel = cohorts.find(c => c.id === filter)?.label ?? 'All members';

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.inkFaint }} />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search name, username, email, club"
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            borderRadius: t.radius.md,
            border: `1px solid ${t.line}`,
            background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Cohort board — two columns; labels are too long for three at 390px */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {cohorts.map(c => (
          <CohortTile
            key={c.id}
            label={c.label}
            count={c.count}
            share={allCount > 0 ? c.count / allCount : 0}
            active={filter === c.id}
            onClick={() => updateFilterUrl(filter === c.id ? 'all' : c.id)}
          />
        ))}
      </div>

      {/* Roster list card with caption */}
      <div style={{
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: 18, overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 14px', borderBottom: `1px solid ${t.line}`,
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
        }}>
          <span style={{ ...LABEL_T, color: t.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeCohortLabel}
          </span>
          <span style={{ ...LABEL_T, color: t.inkFaint, flexShrink: 0 }}>
            Index · last seen
          </span>
        </div>
        {isLoading ? (
          <SkeletonCards />
        ) : users.length === 0 ? (
          <EmptyState title="No members match" subtitle={search ? `for "${search}"` : undefined} />
        ) : (
          <div>
            {users.map((u, i) => (
              <RosterRow
                key={u.id}
                user={u}
                divider={i > 0}
                onOpen={() => openMember(u.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredCount > pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: t.inkMuted, fontVariantNumeric: 'tabular-nums' }}>
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredCount)} of {filteredCount.toLocaleString()} ({allCount.toLocaleString()} total)
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PagerBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</PagerBtn>
            <span style={{ fontSize: 13, color: t.ink, padding: '6px 4px', fontVariantNumeric: 'tabular-nums' }}>
              {page} / {totalPages}
            </span>
            <PagerBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</PagerBtn>
          </div>
        </div>
      )}

      <Member360Sheet
        userId={drawerUserId}
        detail={userDetail ?? null}
        loading={detailLoading}
        error={detailError}
        onRetry={() => refetchDetail()}
        onClose={closeMember}
        onUpdateRole={updateRole}
        roleUpdating={roleUpdating}
      />
    </div>
  );
}

/* ─────────────────────── Cohort tile ─────────────────────── */

/**
 * Proportion bar = the cohort's share of allCount (never of the filtered set or
 * of the page). The bar states the proportion and the figure states the count;
 * a percentage would be a third statement of the same fact.
 */
function CohortTile({ label, count, share, active, onClick }: {
  label: string; count: number; share: number; active: boolean; onClick: () => void;
}) {
  const empty = count === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '8px 10px 10px',
        borderRadius: t.radius.lg,
        background: active ? t.neutralSoft : t.surface,
        border: `1px solid ${active ? t.line : t.hairline}`,
        cursor: 'pointer', textAlign: 'left',
        opacity: empty ? 0.55 : 1,
        minWidth: 0,
      }}
    >
      <span aria-hidden style={{ height: 2.5, borderRadius: 2, width: '100%', background: t.line, overflow: 'hidden' }}>
        <span style={{
          display: 'block', height: '100%', borderRadius: 2,
          width: `${Math.min(100, Math.max(0, share * 100))}%`,
          background: t.brand,
        }} />
      </span>
      <span style={{
        ...LABEL_T, color: t.inkMuted,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
      }}>
        {label}
      </span>
      <span style={{ ...FIG_T, fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em', color: t.ink }}>
        {count}
      </span>
    </button>
  );
}

/* ─────────────────────── Roster row ─────────────────────── */

function RosterRow({ user, onOpen, divider }: { user: AdminUserRow; onOpen: () => void; divider: boolean }) {
  const isNew = Date.now() - new Date(user.created_at).getTime() < 7 * 86400_000;
  const role = badgeRole(user.role);
  const hcp = user.handicap_index;
  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left',
        background: 'transparent',
        borderTop: divider ? `1px solid ${t.line}` : 'none',
        borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
        padding: '12px 14px',
        display: 'flex', gap: 12, alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <SquircleAvatar size={38} src={user.avatar_url} alt={user.display_name ?? ''} userId={user.id} hairlineRing />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            color: t.ink, fontSize: 14, fontWeight: 700,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user.display_name ?? user.username ?? '-'}
          </span>
          {user.is_suspended && (
            <span style={{ ...LABEL_T, color: t.danger, flexShrink: 0 }}>Suspended</span>
          )}
          {isNew && !user.is_suspended && (
            <span style={{ ...LABEL_T, color: t.ok, flexShrink: 0 }}>New</span>
          )}
          {role && (
            <span style={{ ...LABEL_T, color: t.brandText, flexShrink: 0 }}>{role}</span>
          )}
        </div>
        <div style={{
          color: t.inkMuted, fontSize: 12, marginTop: 2,
          display: 'flex', alignItems: 'center', gap: 5,
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.username ? `@${user.username}` : ''}
          </span>
          {user.home_club && (
            <>
              {user.username && <span style={{ flexShrink: 0 }}>·</span>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.home_club}</span>
            </>
          )}
        </div>
      </div>
      <div style={{
        flexShrink: 0, minWidth: 52, textAlign: 'right',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      }}>
        {hcp === null || hcp === undefined ? (
          <span style={{ ...FIG_T, fontSize: 13.5, fontWeight: 700, color: t.inkFaint }}>—</span>
        ) : (
          <span style={{ ...FIG_T, fontSize: 13.5, fontWeight: 700, color: t.ink }}>{hcp.toFixed(1)}</span>
        )}
        <span style={{ ...LABEL_T, ...FIG_T, color: ageTone(user.last_seen_at) }}>
          {ageShort(user.last_seen_at)}
        </span>
      </div>
    </button>
  );
}

function PagerBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{
        padding: '6px 12px', borderRadius: t.radius.md,
        border: `1px solid ${t.line}`,
        background: rest.disabled ? t.canvas : t.surface,
        color: rest.disabled ? t.inkFaint : t.ink,
        fontSize: 12, fontWeight: 600,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <div>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          height: 64,
          borderTop: i > 0 ? `1px solid ${t.line}` : 'none',
          background: t.canvas,
          animation: 'admin-pulse 1.4s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes admin-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    </div>
  );
}

/* ─────────────────────── Member 360 sheet ─────────────────────── */

const ROLE_OPTIONS = [
  { value: null,            label: 'No role' },
  { value: 'admin',         label: 'Admin' },
  { value: 'moderator',     label: 'Moderator' },
  { value: 'limited_admin', label: 'Limited Admin' },
];

function egStatusView(conn: { last_sync_status: string | null; last_synced_at: string | null } | null) {
  if (!conn) return { tone: 'muted' as const, label: 'Not linked', when: null as string | null };
  const status = conn.last_sync_status ?? '';
  if (status === 'ok') {
    return {
      tone: 'ok' as const,
      label: 'Linked - syncing',
      when: conn.last_synced_at ? `last synced ${relTime(conn.last_synced_at)}` : null,
    };
  }
  return { tone: 'warn' as const, label: 'Needs re-auth', when: null };
}

function Member360Sheet({
  userId, detail, loading, error, onRetry, onClose, onUpdateRole, roleUpdating,
}: {
  userId: string | null;
  detail: AdminUserDetail | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string | null) => void;
  roleUpdating: boolean;
}) {
  const navigate = useNavigate();
  const actions = useUserActions();
  const { role: panelRole } = usePanelRole();
  const isFullAdmin = panelCan(panelRole).manageAdmins;
  const isLimited = panelRole === 'limited';
  const createRequest = useCreateAdminActionRequest();

  const [confirm, setConfirm] = useState<null | 'suspend' | 'delete' | 'reset' | 'verify' | 'unverify'>(null);
  const [busy, setBusy] = useState(false);
  const [requestMode, setRequestMode] = useState<null | 'delete' | 'ban' | 'role'>(null);
  const [reqReason, setReqReason] = useState('');
  const [reqRoleAction, setReqRoleAction] =
    useState<'grant_limited' | 'grant_full' | 'downgrade' | 'revoke'>('grant_limited');
  const [renameOpen, setRenameOpen] = useState(false);

  const close = () => { setConfirm(null); setRequestMode(null); setReqReason(''); onClose(); };
  const name = detail?.display_name ?? detail?.username ?? 'member';

  const qc = useQueryClient();
  const runConfirmed = async () => {
    if (!detail || !confirm) return;
    setBusy(true);
    try {
      let res: { success: boolean; error?: any } | undefined;
      if (confirm === 'suspend') res = await actions.suspendUser(detail.id);
      if (confirm === 'delete')  res = await actions.deleteUser(detail.id);
      if (confirm === 'reset')   res = await actions.resetPassword(detail.id, detail.email ?? `${detail.username ?? detail.id}@user`);
      if (confirm === 'verify')  res = await actions.verifyGolfer(detail.id);
      if (confirm === 'unverify') res = await actions.unverifyGolfer(detail.id);
      if (res && !res.success) {
        const errAny: any = (res as any).error;
        const msg = errAny instanceof Error ? errAny.message : (typeof errAny === 'string' ? errAny : 'Action failed');
        if (msg === 'already_verified') toast.error('This member is already verified');
        else if (msg === 'already_unverified') toast.error('This member is not verified');
        else toast.error(msg);
      } else if (res?.success) {
        toast.success(
          confirm === 'delete' ? 'User deleted' :
          confirm === 'suspend' ? 'User suspended' :
          confirm === 'verify' ? 'Golfer verified' :
          confirm === 'unverify' ? 'Verification removed' :
          'Password reset email sent'
        );
        if (confirm === 'verify' || confirm === 'unverify') {
          qc.invalidateQueries({ queryKey: ['admin-v2', 'users'] });
          qc.invalidateQueries({ queryKey: ['admin-v2', 'users', 'detail', detail.id] });
          qc.invalidateQueries({ queryKey: ['admin-user-details', detail.id] });
          qc.invalidateQueries({ queryKey: ['user-profile', detail.id] });
        }
      }
    } finally {
      setBusy(false);
      setConfirm(null);
      if (confirm === 'delete') close();
    }
  };

  const submitRequest = () => {
    if (!detail || !requestMode) return;
    if (requestMode === 'delete') {
      createRequest.mutate(
        {
          action_type: 'delete_user',
          target_user_id: detail.id,
          target_email: detail.email ?? null,
          payload: { reason: reqReason.trim() || 'Deletion requested' },
        },
        { onSuccess: () => close() },
      );
    } else if (requestMode === 'ban') {
      createRequest.mutate(
        {
          action_type: 'permanent_ban',
          target_user_id: detail.id,
          payload: { reason: reqReason.trim() || 'Permanent ban requested' },
        },
        { onSuccess: () => close() },
      );
    } else if (requestMode === 'role') {
      createRequest.mutate(
        {
          action_type: 'role_change',
          target_user_id: detail.id,
          payload: { roleAction: reqRoleAction, reason: reqReason.trim() || undefined },
        },
        { onSuccess: () => close() },
      );
    }
  };

  const joinedMonth = detail?.created_at
    ? new Date(detail.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  const egView = detail ? egStatusView(detail.whs_connection) : null;
  const isNew = detail
    ? Date.now() - new Date(detail.created_at).getTime() < 7 * 86400_000
    : false;

  return (
    <DetailDrawer
      open={!!userId}
      onClose={close}
      title={detail?.display_name ?? (loading ? 'Loading...' : 'Member')}
      subtitle={detail?.username ? `@${detail.username}` : undefined}
      footer={
        detail ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DrawerBtn onClick={() => navigate(`/profile/${detail.id}`)}>Public profile</DrawerBtn>
            {isFullAdmin && (
              <>
                <DrawerBtn icon={<KeyRound size={14} />} onClick={() => setConfirm('reset')}>Send password reset</DrawerBtn>
                <DrawerBtn icon={<AtSign size={14} />} onClick={() => setRenameOpen(true)}>Change username</DrawerBtn>
                {detail.is_verified ? (
                  <DrawerBtn icon={<BadgeCheck size={14} />} tone="danger" onClick={() => setConfirm('unverify')}>
                    Remove verification
                  </DrawerBtn>
                ) : (
                  <DrawerBtn icon={<BadgeCheck size={14} />} onClick={() => setConfirm('verify')}>
                    Verify golfer
                  </DrawerBtn>
                )}
                <DrawerBtn
                  icon={<Ban size={14} />}
                  tone={detail.is_suspended ? undefined : 'warn'}
                  onClick={() => setConfirm('suspend')}
                >
                  {detail.is_suspended ? 'Lift suspension' : 'Suspend member'}
                </DrawerBtn>
                <DrawerBtn icon={<Trash2 size={14} />} tone="danger" onClick={() => setConfirm('delete')}>Delete member</DrawerBtn>
              </>
            )}
            {isLimited && (
              <>
                <DrawerBtn icon={<ShieldAlert size={14} />} tone="warn" onClick={() => { setRequestMode('ban'); setReqReason(''); }}>Request permanent ban</DrawerBtn>
                <DrawerBtn icon={<Trash2 size={14} />} tone="danger" onClick={() => { setRequestMode('delete'); setReqReason(''); }}>Request delete</DrawerBtn>
                <DrawerBtn icon={<ShieldCheck size={14} />} onClick={() => { setRequestMode('role'); setReqReason(''); }}>Request role change</DrawerBtn>
              </>
            )}
          </div>
        ) : undefined
      }
    >
      {loading && !detail ? (
        <SkeletonCards n={4} />
      ) : error && !detail ? (
        <AdminErrorState title="Couldn't load member" message="Try again in a moment." onRetry={onRetry} />
      ) : !detail ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Identity header (sticky-ish via top position) */}
          <div style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            paddingBottom: 12, borderBottom: `1px solid ${t.line}`,
          }}>
            <SquircleAvatar size={46} src={detail.avatar_url} alt={detail.display_name ?? ''} userId={detail.id}
              hairlineRing ringColor={LIGHT_HAIRLINE}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: t.ink }}>
                  {detail.display_name ?? '-'}
                </span>
                {detail.is_verified && <CheckCircle2 size={14} color={t.ok} />}
                {detail.is_suspended && <StatusPill tone="danger">Suspended</StatusPill>}
                {isNew && <StatusPill tone="brand">New</StatusPill>}
                {egView?.tone === 'warn' && <StatusPill tone="warn">EG re-auth</StatusPill>}
              </div>
              <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 2 }}>
                {detail.username ? `@${detail.username}` : ''}
                {joinedMonth ? ` - joined ${joinedMonth}` : ''}
              </div>
              {detail.email && (
                <div style={{
                  fontSize: 11, color: t.inkFaint, marginTop: 4,
                  display: 'flex', alignItems: 'center', gap: 4, minWidth: 0,
                }}>
                  {detail.email_confirmed && <BadgeCheck size={12} color={t.ok} style={{ flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {detail.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 1) Engagement rail: one card, four equal stats */}
          <Section title="Engagement">
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
              border: `1px solid ${t.line}`, borderRadius: t.radius.md,
              background: t.surface, overflow: 'hidden',
            }}>
              <Stat label="Posts" value={detail.posts_count} />
              <Stat label="Reviews" value={detail.reviews_count} divider />
              <Stat label="Followers" value={detail.followers} divider />
              <Stat label="Top 100" value={detail.top100_played} divider />
            </div>
          </Section>

          {/* C4-1: Member activity - 30-day event bars + session chips */}
          <MemberActivityCard userId={detail.id} />

          {/* 2) Golf identity */}
          <Section title="Golf identity">
            <div style={{
              border: `1px solid ${t.line}`, borderRadius: t.radius.md,
              background: t.surface,
            }}>
              <IdentityRow icon={<MapPin size={14} color={t.inkMuted} />} label="Home club"
                value={detail.home_club ?? 'Not set'} muted={!detail.home_club} />
              <IdentityRow
                icon={<Radio size={14} color={t.inkMuted} />}
                label="England Golf"
                divider
                value={
                  egView?.tone === 'muted' ? 'Not linked' :
                  egView?.tone === 'warn' ? undefined :
                  egView?.when ? `${egView.label} - ${egView.when}` : egView?.label
                }
                muted={egView?.tone === 'muted'}
                pill={
                  egView?.tone === 'ok'   ? { tone: 'ok', label: 'Linked - syncing' } :
                  egView?.tone === 'warn' ? { tone: 'warn', label: 'Needs re-auth' } :
                  null
                }
              />
            </div>
          </Section>

          {/* 3) Moderation history */}
          <Section title="Moderation">
            <div style={{
              border: `1px solid ${t.line}`, borderRadius: t.radius.md,
              background: t.surface, padding: '10px 14px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: detail.is_suspended ? t.dangerText : t.ink,
              }}>
                {detail.is_suspended ? 'Suspended - active' : 'No suspensions'}
              </div>
              <div style={{ fontSize: 12, color: t.inkMuted, fontVariantNumeric: 'tabular-nums' }}>
                {detail.reports_received > 0
                  ? `${detail.reports_received.toLocaleString()} report${detail.reports_received === 1 ? '' : 's'} received`
                  : 'No reports received'}
              </div>
            </div>
          </Section>

          {/* Role (full-admin direct edit) */}
          {isFullAdmin && (
            <Section title="App role">
              <div style={{
                background: t.canvas, border: `1px solid ${t.line}`,
                borderRadius: t.radius.md, padding: 12,
              }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ROLE_OPTIONS.map(opt => {
                    const active = (detail.role ?? null) === opt.value;
                    return (
                      <button
                        key={opt.value ?? 'none'}
                        disabled={roleUpdating}
                        onClick={() => onUpdateRole(detail.id, opt.value)}
                        style={{
                          padding: '6px 12px', borderRadius: 999,
                          border: `1px solid ${active ? 'transparent' : t.line}`,
                          background: active ? t.brandSoft : t.surface,
                          color: active ? t.brandText : t.inkMuted,
                          fontSize: 12, fontWeight: 600,
                          cursor: roleUpdating ? 'progress' : 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

          {detail.bio && (
            <Section title="Bio">
              <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.5 }}>{detail.bio}</div>
            </Section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title="Send password reset email?"
        description={`A reset link will be emailed to ${name}.`}
        confirmLabel="Send reset"
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'suspend'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={detail?.is_suspended ? `Lift suspension on ${name}?` : `Suspend ${name}?`}
        description={
          detail?.is_suspended
            ? 'They will regain access immediately.'
            : 'They will be signed out and unable to post or comment until reinstated.'
        }
        requireText={detail?.is_suspended ? undefined : (detail?.username || detail?.display_name || 'SUSPEND')}
        confirmLabel={detail?.is_suspended ? 'Lift suspension' : 'Suspend member'}
        tone={detail?.is_suspended ? undefined : 'danger'}
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={`Delete ${name}?`}
        description="This permanently deletes the member and their data. This cannot be undone."
        requireText={detail?.username || detail?.display_name || 'DELETE'}
        confirmLabel="Delete member"
        tone="danger"
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'verify'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={`Verify ${name}?`}
        description="They'll be notified."
        confirmLabel="Verify golfer"
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'unverify'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={`Remove verification from ${name}?`}
        description="They will not be notified."
        confirmLabel="Remove verification"
        tone="danger"
        busy={busy}
      />
      {requestMode !== null && detail && (
        <div
          role="dialog" aria-modal="true"
          onClick={() => !createRequest.isPending && setRequestMode(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface, borderRadius: t.radius.lg, boxShadow: t.shadowPop,
              width: '100%', maxWidth: 460, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.ink }}>
                {requestMode === 'delete' ? 'Request member deletion'
                  : requestMode === 'ban' ? 'Request permanent ban'
                  : 'Request role change'}
              </div>
              <div style={{ fontSize: 13, color: t.inkMuted, marginTop: 6, lineHeight: 1.45 }}>
                A Full admin will review and either approve (which executes the action) or reject.
              </div>
            </div>

            {requestMode === 'role' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['grant_limited', 'grant_full', 'downgrade', 'revoke'] as const).map(ra => {
                  const active = reqRoleAction === ra;
                  return (
                    <button
                      key={ra}
                      onClick={() => setReqRoleAction(ra)}
                      style={{
                        padding: '6px 12px', borderRadius: 999,
                        border: `1px solid ${active ? 'transparent' : t.line}`,
                        background: active ? t.brandSoft : t.surface,
                        color: active ? t.brandText : t.inkMuted,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {ra.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            )}

            <textarea
              autoFocus
              placeholder="Reason (required)"
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: 10, borderRadius: t.radius.md,
                border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
                fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRequestMode(null)}
                disabled={createRequest.isPending}
                style={{
                  padding: '8px 14px', borderRadius: t.radius.md,
                  border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={submitRequest}
                disabled={createRequest.isPending || !reqReason.trim()}
                style={{
                  padding: '8px 14px', borderRadius: t.radius.md,
                  border: 'none', background: t.ink, color: t.surface,
                  fontSize: 13, fontWeight: 700,
                  cursor: (createRequest.isPending || !reqReason.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (createRequest.isPending || !reqReason.trim()) ? 0.55 : 1,
                }}
              >
                {createRequest.isPending ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
      {detail && (
        <ChangeUsernameSheet
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
          userId={detail.id}
          currentUsername={detail.username ?? null}
        />
      )}
    </DetailDrawer>
  );
}

/* ─── Change username sheet (Full admins only) ─── */

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

function ChangeUsernameSheet({
  open, onClose, userId, currentUsername,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentUsername: string | null;
}) {
  const qc = useQueryClient();
  const actions = useUserActions();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [saving, setSaving] = useState(false);
  const checkRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setValue('');
      setStatus('idle');
    }
    return () => { if (checkRef.current) clearTimeout(checkRef.current); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (checkRef.current) clearTimeout(checkRef.current);
    const candidate = value.trim().toLowerCase();
    if (!candidate) { setStatus('idle'); return; }
    if (!USERNAME_RE.test(candidate)) { setStatus('invalid'); return; }
    if (candidate === (currentUsername ?? '')) { setStatus('idle'); return; }
    setStatus('checking');
    checkRef.current = setTimeout(async () => {
      try {
        const escaped = candidate.replace(/[\\%_]/g, '\\$&');
        const { count, error } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .ilike('username', escaped)
          .neq('id', userId);
        if (error) { setStatus('error'); return; }
        setStatus((count ?? 0) > 0 ? 'taken' : 'available');
      } catch {
        setStatus('error');
      }
    }, 400);
  }, [value, open, userId, currentUsername]);

  const canSave = status === 'available' && !saving;

  const onSave = async () => {
    if (!canSave) return;
    const candidate = value.trim().toLowerCase();
    setSaving(true);
    const res = await actions.changeUsername(userId, candidate);
    setSaving(false);
    if (res.success) {
      toast.success('Username changed');
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin-v2', 'users', 'detail', userId] });
      qc.invalidateQueries({ queryKey: ['admin-user-details', userId] });
      qc.invalidateQueries({ queryKey: ['user-profile', userId] });
      onClose();
    } else {
      const err = String((res as any).error ?? '');
      if (err === 'username_taken') {
        toast.error('That username was just taken');
        setStatus('taken');
      } else if (err === 'invalid_format') {
        toast.error('Invalid username format');
        setStatus('invalid');
      } else {
        toast.error(err || 'Failed to change username');
      }
    }
  };

  const hint =
    status === 'invalid' ? 'Use 3–20 characters: lowercase letters, digits, underscores, or dots.'
    : status === 'checking' ? 'Checking availability…'
    : status === 'available' ? 'Available'
    : status === 'taken' ? 'Taken'
    : status === 'error' ? 'Check failed — try again'
    : '3–20 chars: a–z, 0–9, underscore, dot.';
  const hintColor =
    status === 'available' ? t.ok
    : (status === 'taken' || status === 'invalid' || status === 'error') ? t.danger
    : t.inkMuted;

  return (
    <AdminSheet
      open={open}
      onClose={onClose}
      title="Change username"
      subtitle={currentUsername ? `Current: @${currentUsername}` : 'No current username'}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 14px', borderRadius: t.radius.md,
              border: `1px solid ${t.line}`, background: t.surface, color: t.ink,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onSave}
            disabled={!canSave}
            style={{
              padding: '8px 14px', borderRadius: t.radius.md,
              border: 'none', background: t.ink, color: t.surface,
              fontSize: 13, fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              opacity: canSave ? 1 : 0.55,
            }}
          >{saving ? 'Saving…' : 'Save'}</button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: t.inkMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          New username
        </label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: `1px solid ${t.line}`, borderRadius: t.radius.md,
          background: t.surface, padding: '10px 12px',
        }}>
          <span style={{ color: t.inkMuted, fontSize: 14, fontWeight: 600 }}>@</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="new_username"
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: t.ink, fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: hintColor }}>{hint}</div>
      </div>
    </AdminSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11, color: t.inkFaint, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, divider }: { label: string; value: number; divider?: boolean }) {
  return (
    <div style={{
      padding: 12, textAlign: 'center',
      borderLeft: divider ? `1px solid ${t.line}` : 'none',
    }}>
      <div style={{
        fontSize: 18, fontWeight: 700, color: t.ink,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value.toLocaleString()}
      </div>
      <div style={{
        fontSize: 10, color: t.inkFaint, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
      }}>
        {label}
      </div>
    </div>
  );
}

function IdentityRow({
  icon, label, value, muted, divider, pill,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  muted?: boolean;
  divider?: boolean;
  pill?: { tone: 'ok' | 'warn'; label: string } | null;
}) {
  return (
    <div style={{
      padding: '10px 14px',
      borderTop: divider ? `1px solid ${t.line}` : 'none',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, color: t.inkFaint, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {label}
        </div>
        {value && (
          <div style={{
            fontSize: 13, marginTop: 2,
            color: muted ? t.inkFaint : t.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {value}
          </div>
        )}
      </div>
      {pill && <StatusPill tone={pill.tone}>{pill.label}</StatusPill>}
    </div>
  );
}

function DrawerBtn({
  children, onClick, tone, icon, disabled,
}: { children: React.ReactNode; onClick: () => void; tone?: 'warn' | 'danger'; icon?: React.ReactNode; disabled?: boolean }) {
  const bg = tone === 'danger' ? t.dangerSoft : tone === 'warn' ? t.warnSoft : t.surface;
  const fg = tone === 'danger' ? t.dangerText : tone === 'warn' ? t.warnText : t.ink;
  const border = tone ? 'transparent' : t.line;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', borderRadius: t.radius.md,
        background: bg, color: fg,
        border: `1px solid ${border}`,
        fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}{children}
    </button>
  );
}

/* ─────────────────────── Team & Roles (unchanged) ─────────────────────── */

function TeamTab() {
  const team = useTeam();
  const [confirm, setConfirm] = useState<TeamMember | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = () => team.refetch();
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [team]);

  if (team.isLoading) return <SkeletonCards />;
  if (!team.data.length) {
    return <EmptyState title="No team members" subtitle="Grant admin access via the Invites tab." />;
  }

  const onConfirmRevoke = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await team.revoke.mutateAsync(confirm.userId);
      setConfirm(null);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {team.data.map(m => <TeamCard key={m.userId} member={m} hook={team} onRevoke={() => setConfirm(m)} />)}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={onConfirmRevoke}
        title={`Revoke admin access?`}
        description={`This will remove admin access for ${confirm?.displayName ?? confirm?.username ?? 'this user'}.`}
        requireText={confirm?.username || confirm?.displayName || 'REVOKE'}
        confirmLabel="Revoke access"
        tone="danger"
        busy={busy}
      />
    </div>
  );
}

function TeamCard({
  member, hook, onRevoke,
}: { member: TeamMember; hook: ReturnType<typeof useTeam>; onRevoke: () => void }) {
  const [menu, setMenu] = useState(false);
  const expiry = member.expiresAt ? new Date(member.expiresAt) : null;
  const daysLeft = expiry ? Math.floor((expiry.getTime() - Date.now()) / 86400_000) : null;
  const expiryTone: 'ok' | 'warn' | 'danger' | 'neutral' =
    daysLeft == null ? 'neutral' :
    daysLeft < 0 ? 'danger' :
    daysLeft <= 7 ? 'warn' : 'ok';

  const extend = async (days: number) => {
    const next = new Date(Date.now() + days * 86400_000).toISOString();
    await hook.setExpiry.mutateAsync({ userId: member.userId, expiresAt: next });
    setMenu(false);
  };

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: t.radius.md, padding: 12,
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <SquircleAvatar size={40} src={member.avatarUrl} alt={member.displayName ?? ''} userId={member.userId} hairlineRing />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
            {member.displayName ?? member.username ?? member.userId.slice(0, 8)}
          </span>
          <StatusPill tone={member.role === 'full' ? 'ok' : 'warn'}>
            {member.role === 'full' ? 'Full' : 'Limited'}
          </StatusPill>
          {expiry && (
            <StatusPill tone={expiryTone}>
              {daysLeft! < 0 ? `Expired ${Math.abs(daysLeft!)}d` : `Expires in ${daysLeft}d`}
            </StatusPill>
          )}
        </div>
        <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 4 }}>
          Granted {relTime(member.createdAt)}{member.grantedBy ? ` - by ${member.grantedBy.slice(0, 8)}` : ''}
        </div>
        {member.notes && (
          <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 4 }}>{member.notes}</div>
        )}
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenu(v => !v)}
          aria-label="Member actions"
          style={{
            width: 32, height: 32, borderRadius: t.radius.md,
            border: `1px solid ${t.line}`, background: t.surface,
            color: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <MoreVertical size={14} />
        </button>
        {menu && (
          <>
            <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 6,
              zIndex: 50, minWidth: 200,
              background: t.surface, border: `1px solid ${t.line}`,
              borderRadius: t.radius.md, boxShadow: t.shadowPop, padding: 4,
            }}>
              {member.role === 'full' ? (
                <MenuItem onClick={() => { hook.downgrade.mutate(member.userId); setMenu(false); }}>Downgrade to Limited</MenuItem>
              ) : (
                <MenuItem onClick={() => { hook.grantFull.mutate(member.userId); setMenu(false); }}>Upgrade to Full</MenuItem>
              )}
              <MenuItem onClick={() => extend(7)}>Extend expiry +7d</MenuItem>
              <MenuItem onClick={() => extend(30)}>Extend expiry +30d</MenuItem>
              <MenuItem onClick={() => { hook.setExpiry.mutate({ userId: member.userId, expiresAt: null }); setMenu(false); }}>
                Clear expiry
              </MenuItem>
              <MenuItem danger onClick={() => { setMenu(false); onRevoke(); }}>Revoke access</MenuItem>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '8px 12px', borderRadius: t.radius.sm,
        background: 'transparent', border: 'none',
        color: danger ? t.dangerText : t.ink,
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────── Invites (unchanged) ─────────────────────── */

function InvitesTab() {
  const invites = useInvites();
  const users = useUsers();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<InviteRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = () => invites.refetch();
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [invites]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <DrawerBtn icon={<UserPlus size={14} />} onClick={() => setShowCreate(true)}>New invite</DrawerBtn>
      </div>

      {invites.isLoading ? <SkeletonCards /> :
        invites.data.length === 0 ? <EmptyState title="No invites yet" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invites.data.map(inv => (
              <InviteCard
                key={inv.id} invite={inv}
                onResend={() => invites.resend.mutate(inv.id)}
                onCancel={() => setConfirmCancel(inv)}
              />
            ))}
          </div>
        )
      }

      <CreateInviteDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        users={users.allUsers}
        usersLoading={users.isLoading}
        onCreate={(invitedUserId, role) =>
          invites.create.mutate({ invitedUserId, role }, { onSuccess: () => setShowCreate(false) })
        }
        creating={invites.create.isPending}
      />

      <ConfirmDialog
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={async () => {
          if (!confirmCancel) return;
          setBusy(true);
          try {
            await invites.cancel.mutateAsync(confirmCancel.id);
            setConfirmCancel(null);
          } finally { setBusy(false); }
        }}
        title="Cancel invite?"
        description={`This will cancel the invite for ${confirmCancel?.displayName ?? confirmCancel?.email ?? 'this user'}.`}
        confirmLabel="Cancel invite"
        tone="danger"
        busy={busy}
      />
    </div>
  );
}

function inviteStatus(inv: InviteRow): { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' } {
  if (inv.acceptedAt) return { label: 'Accepted', tone: 'ok' };
  if (inv.status === 'cancelled') return { label: 'Cancelled', tone: 'neutral' };
  if (new Date(inv.expiresAt) < new Date()) return { label: 'Expired', tone: 'danger' };
  return { label: 'Pending', tone: 'warn' };
}

function InviteCard({
  invite, onResend, onCancel,
}: { invite: InviteRow; onResend: () => void; onCancel: () => void }) {
  const s = inviteStatus(invite);
  const canMutate = !invite.acceptedAt && invite.status !== 'cancelled';
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: t.radius.md, padding: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <SquircleAvatar size={36} src={invite.avatarUrl} alt={invite.displayName ?? invite.email ?? ''} userId={invite.invitedUserId} hairlineRing />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
            {invite.displayName ?? invite.username ?? invite.email ?? '-'}
          </div>
          <div style={{ fontSize: 12, color: t.inkMuted }}>
            {invite.role ?? 'admin'} - sent {relTime(invite.createdAt)}
          </div>
        </div>
        <StatusPill tone={s.tone}>{s.label}</StatusPill>
      </div>
      {canMutate && (
        <div style={{ display: 'flex', gap: 8 }}>
          <DrawerBtn icon={<Mail size={14} />} onClick={onResend}>Extend +7d</DrawerBtn>
          <DrawerBtn icon={<X size={14} />} tone="danger" onClick={onCancel}>Cancel</DrawerBtn>
        </div>
      )}
    </div>
  );
}

function CreateInviteDrawer({
  open, onClose, users, usersLoading, onCreate, creating,
}: {
  open: boolean; onClose: () => void;
  users: AdminUserRow[]; usersLoading: boolean;
  onCreate: (invitedUserId: string, role: string) => void;
  creating: boolean;
}) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [role, setRole] = useState<'full' | 'limited'>('limited');

  useEffect(() => { if (!open) { setQ(''); setSelected(null); setRole('limited'); } }, [open]);

  const results = useMemo(() => {
    if (selected) return [];
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter(u =>
        u.display_name?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [q, users, selected]);

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Invite admin"
      subtitle="Send an admin invite to an existing user"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <DrawerBtn onClick={onClose}>Cancel</DrawerBtn>
          <DrawerBtn
            icon={<UserPlus size={14} />}
            onClick={() => selected && onCreate(selected.id, role)}
          >
            {creating ? 'Sending...' : 'Send invite'}
          </DrawerBtn>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
            Recipient
          </label>
          {selected ? (
            <div style={{
              marginTop: 6, padding: 10,
              border: `1px solid ${t.line}`, borderRadius: t.radius.md,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <SquircleAvatar size={32} src={selected.avatar_url} alt={selected.display_name ?? ''} userId={selected.id} hairlineRing />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{selected.display_name}</div>
                <div style={{ fontSize: 11, color: t.inkMuted }}>@{selected.username}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  border: 'none', background: 'transparent', color: t.inkMuted,
                  cursor: 'pointer', padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <input
                autoFocus
                placeholder={usersLoading ? 'Loading users...' : 'Search by name or @username...'}
                value={q}
                onChange={e => setQ(e.target.value)}
                style={{
                  marginTop: 6, width: '100%', padding: '10px 12px',
                  borderRadius: t.radius.md, border: `1px solid ${t.line}`,
                  background: t.canvas, color: t.ink, fontSize: 14, outline: 'none',
                }}
              />
              {results.length > 0 && (
                <div style={{
                  marginTop: 6, border: `1px solid ${t.line}`, borderRadius: t.radius.md,
                  background: t.surface, overflow: 'hidden',
                }}>
                  {results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: 10, border: 'none', background: 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <SquircleAvatar size={28} src={u.avatar_url} alt={u.display_name ?? ''} userId={u.id} hairlineRing />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: t.ink }}>{u.display_name}</div>
                        <div style={{ fontSize: 11, color: t.inkMuted }}>@{u.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
            Panel role
          </label>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {(['limited', 'full'] as const).map(r => {
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '10px 12px',
                    borderRadius: t.radius.md,
                    border: `1px solid ${active ? 'transparent' : t.line}`,
                    background: active ? t.brandSoft : t.surface,
                    color: active ? t.brandText : t.ink,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {r === 'full' ? 'Full admin' : 'Limited admin'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DetailDrawer>
  );
}
