import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2, ShieldCheck, Mail, KeyRound, Trash2, Ban, X,
  UserPlus, MoreVertical, Search,
} from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useUserActions } from '@/hooks/admin/useUserDetails';
import { adminTheme as t } from '../theme';
import SectionTabs from '../components/SectionTabs';
import StatusPill from '../components/StatusPill';
import EmptyState from '../components/EmptyState';
import DetailDrawer from '../components/DetailDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import StatTile from '../components/StatTile';
import { useUsers, type AdminUserRow, type UserFilterStatus } from '../hooks/useUsers';
import { useVerifications, type VerificationRow } from '../hooks/useVerifications';
import { useTeam, type TeamMember } from '../hooks/useTeam';
import { useInvites, type InviteRow } from '../hooks/useInvites';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type TabId = 'all' | 'verifications' | 'team' | 'invites';

const TAB_TITLES: Record<TabId, string> = {
  all: 'All Users',
  verifications: 'Verifications',
  team: 'Team & Roles',
  invites: 'Invites',
};

function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch { return '—'; }
}

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabId) ?? 'all';
  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  const verifs = useVerifications();
  const invites = useInvites();

  const tabs = useMemo(() => [
    { id: 'all', label: 'All Users' },
    { id: 'verifications', label: 'Verifications', count: verifs.counts.pending || undefined },
    { id: 'team', label: 'Team & Roles' },
    { id: 'invites', label: 'Invites', count: invites.counts.pending || undefined },
  ], [verifs.counts.pending, invites.counts.pending]);

  // Refetch on header refresh event
  useEffect(() => {
    const handler = () => {
      verifs.refetch();
      invites.refetch();
    };
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [verifs, invites]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <SectionTabs tabs={tabs} activeId={tab} onChange={setTab} />
      {tab === 'all' && <AllUsersTab />}
      {tab === 'verifications' && <VerificationsTab data={verifs.data} loading={verifs.isLoading} review={verifs.reviewMutation} />}
      {tab === 'team' && <TeamTab />}
      {tab === 'invites' && <InvitesTab />}
    </div>
  );
}

/* ─────────────────────── All Users ─────────────────────── */

function AllUsersTab() {
  const {
    users, filteredCount, allCount, isLoading,
    search, setSearch, filter, setFilter, counts,
    page, setPage, pageSize,
    drawerUserId, setDrawerUserId, userDetail, detailLoading,
    updateRole, roleUpdating, refetch,
  } = useUsers();

  const [searchInput, setSearchInput] = useState(search);
  const debounced = useDebouncedValue(searchInput, 220);
  useEffect(() => { setSearch(debounced); }, [debounced]); // eslint-disable-line

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [refetch]);

  const filters: { id: UserFilterStatus; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'verified', label: 'Verified', count: counts.verified },
    { id: 'unverified', label: 'Unverified', count: counts.unverified },
    { id: 'admin', label: 'Admins', count: counts.admin },
    { id: 'new_today', label: 'New Today', count: counts.new_today },
    { id: 'active_24h', label: 'Active 24h' },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: t.inkFaint }} />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by name, @username, club…"
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            borderRadius: t.radius.md,
            border: `1px solid ${t.line}`,
            background: t.surface, color: t.ink, fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Filter chips */}
      <SectionTabs
        tabs={filters.map(f => ({ id: f.id, label: f.label, count: f.count }))}
        activeId={filter}
        onChange={(id) => setFilter(id as UserFilterStatus)}
      />

      {/* List */}
      {isLoading ? (
        <SkeletonCards />
      ) : users.length === 0 ? (
        <EmptyState title="No users match" subtitle={search ? `for "${search}"` : undefined} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => <UserCard key={u.id} user={u} onOpen={() => setDrawerUserId(u.id)} />)}
        </div>
      )}

      {/* Pagination */}
      {filteredCount > pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: t.inkMuted }}>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredCount)} of {filteredCount.toLocaleString()} ({allCount.toLocaleString()} total)
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <PagerBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</PagerBtn>
            <span style={{ fontSize: 13, color: t.ink, padding: '6px 4px' }}>
              {page} / {totalPages}
            </span>
            <PagerBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</PagerBtn>
          </div>
        </div>
      )}

      <UserDetailPanel
        userId={drawerUserId}
        detail={userDetail ?? null}
        loading={detailLoading}
        onClose={() => setDrawerUserId(null)}
        onUpdateRole={updateRole}
        roleUpdating={roleUpdating}
      />
    </div>
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

function UserCard({ user, onOpen }: { user: AdminUserRow; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      style={{
        width: '100%', textAlign: 'left',
        background: t.surface, border: `1px solid ${t.line}`,
        borderRadius: t.radius.md, padding: 12,
        display: 'flex', gap: 12, alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <SquircleAvatar size={40} src={user.avatar_url} alt={user.display_name ?? ''} userId={user.id} hairlineRing />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            color: t.ink, fontSize: 14, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user.display_name ?? '—'}
          </span>
          {user.is_verified && <CheckCircle2 size={14} color={t.ok} style={{ flexShrink: 0 }} />}
          {user.role && <StatusPill tone="warn">{user.role}</StatusPill>}
        </div>
        <div style={{
          color: t.inkMuted, fontSize: 12, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user.username ? `@${user.username}` : ''}{user.country ? ` · ${user.country}` : ''}
          {user.handicap_index != null ? ` · HCP ${user.handicap_index.toFixed(1)}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: t.inkFaint }}>last seen</div>
        <div style={{ fontSize: 12, color: t.ink, fontWeight: 600 }}>{relTime(user.last_seen_at)}</div>
      </div>
    </button>
  );
}

function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 64, background: t.canvas,
            borderRadius: t.radius.md,
            animation: 'admin-pulse 1.4s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes admin-pulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    </div>
  );
}

/* ─────────────────── User detail panel ─────────────────── */

const ROLE_OPTIONS = [
  { value: null,            label: 'No role' },
  { value: 'admin',         label: 'Admin' },
  { value: 'moderator',     label: 'Moderator' },
  { value: 'limited_admin', label: 'Limited Admin' },
];

function UserDetailPanel({
  userId, detail, loading, onClose, onUpdateRole, roleUpdating,
}: {
  userId: string | null;
  detail: import('../hooks/useUsers').AdminUserDetail | null;
  loading: boolean;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string | null) => void;
  roleUpdating: boolean;
}) {
  const navigate = useNavigate();
  const actions = useUserActions();
  const [confirm, setConfirm] = useState<null | 'suspend' | 'delete' | 'reset'>(null);
  const [busy, setBusy] = useState(false);

  const close = () => { setConfirm(null); onClose(); };
  const name = detail?.display_name ?? detail?.username ?? 'user';

  const runConfirmed = async () => {
    if (!detail || !confirm) return;
    setBusy(true);
    try {
      if (confirm === 'suspend') await actions.suspendUser(detail.id);
      if (confirm === 'delete') await actions.deleteUser(detail.id, detail.email ?? `${detail.username ?? detail.id}@user`);
      if (confirm === 'reset')  await actions.resetPassword(detail.id, detail.email ?? `${detail.username ?? detail.id}@user`);
    } finally {
      setBusy(false);
      setConfirm(null);
      if (confirm === 'delete') close();
    }
  };

  return (
    <DetailDrawer
      open={!!userId}
      onClose={onClose}
      title={detail?.display_name ?? (loading ? 'Loading…' : 'User')}
      subtitle={detail?.username ? `@${detail.username}` : undefined}
      footer={
        detail ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DrawerBtn onClick={() => navigate(`/profile/${detail.id}`)}>Public profile</DrawerBtn>
            <DrawerBtn icon={<KeyRound size={14} />} onClick={() => setConfirm('reset')}>Reset password</DrawerBtn>
            <DrawerBtn icon={<Ban size={14} />}  tone="warn"   onClick={() => setConfirm('suspend')}>Suspend</DrawerBtn>
            <DrawerBtn icon={<Trash2 size={14} />} tone="danger" onClick={() => setConfirm('delete')}>Delete</DrawerBtn>
          </div>
        ) : undefined
      }
    >
      {loading || !detail ? (
        <SkeletonCards n={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <SquircleAvatar size={56} src={detail.avatar_url} alt={detail.display_name ?? ''} userId={detail.id} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: t.ink }}>{detail.display_name ?? '—'}</span>
                {detail.is_verified && <CheckCircle2 size={14} color={t.ok} />}
              </div>
              <div style={{ fontSize: 12, color: t.inkMuted }}>
                {detail.username ? `@${detail.username}` : ''}
                {detail.country ? ` · ${detail.country}` : ''}
              </div>
              {detail.home_club && (
                <div style={{ fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{detail.home_club}</div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <StatTile label="Posts" value={detail.posts_count.toLocaleString()} />
            <StatTile label="Reviews" value={detail.reviews_count.toLocaleString()} />
            <StatTile label="Followers" value={detail.followers.toLocaleString()} />
            <StatTile label="Following" value={detail.following.toLocaleString()} />
            <StatTile label="Top 100 played" value={detail.top100_played.toLocaleString()} />
            <StatTile label="Joined" value={relTime(detail.created_at)} />
          </div>

          {/* Role select */}
          <div style={{
            background: t.canvas, border: `1px solid ${t.line}`,
            borderRadius: t.radius.md, padding: 12,
          }}>
            <div style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
              App Role
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
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

          {detail.bio && (
            <div>
              <div style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Bio</div>
              <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.5 }}>{detail.bio}</div>
            </div>
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
        title={`Suspend ${name}?`}
        description="They will be signed out and unable to post or comment until reinstated."
        requireText={detail?.username || detail?.display_name || 'SUSPEND'}
        confirmLabel="Suspend user"
        tone="danger"
        busy={busy}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        title={`Delete ${name}?`}
        description="This permanently deletes the user and their data. This cannot be undone."
        requireText={detail?.username || detail?.display_name || 'DELETE'}
        confirmLabel="Delete user"
        tone="danger"
        busy={busy}
      />
    </DetailDrawer>
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

/* ─────────────────────── Verifications ─────────────────────── */

const PROOF_LABELS: Record<string, string> = {
  official_website: 'Official website',
  business_email: 'Business email',
  registered_business: 'Registered business',
  creator_business: 'Creator / brand',
  golf_course: 'Golf course / facility',
};

function VerificationsTab({
  data, loading, review,
}: {
  data: VerificationRow[];
  loading: boolean;
  review: ReturnType<typeof useVerifications>['reviewMutation'];
}) {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'needs_info' | 'approved' | 'rejected' | 'all'>('pending');
  const [active, setActive] = useState<VerificationRow | null>(null);
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'needs_more_info' | null>(null);
  const [bizDetail, setBizDetail] = useState<{ name?: string; category?: string; location?: string; website?: string; email?: string } | null>(null);

  // Fetch business profile when opening a business request
  useEffect(() => {
    let cancelled = false;
    setBizDetail(null);
    if (active?.type === 'business' && active.businessId) {
      import('@/integrations/supabase/client').then(({ supabase }) =>
        supabase.from('business_accounts')
          .select('name, category, location, website, email')
          .eq('id', active.businessId!)
          .maybeSingle()
          .then(({ data }) => { if (!cancelled && data) setBizDetail(data as any); })
      );
    }
    return () => { cancelled = true; };
  }, [active?.id, active?.businessId, active?.type]);

  const rows = useMemo(() => {
    if (statusFilter === 'all') return data;
    if (statusFilter === 'needs_info') return data.filter(r => r.status === 'needs_more_info');
    if (statusFilter === 'approved') return data.filter(r => r.status === 'approved' || r.status === 'accepted');
    if (statusFilter === 'rejected') return data.filter(r => r.status === 'rejected' || r.status === 'declined');
    return data.filter(r => r.status === 'pending');
  }, [data, statusFilter]);

  const close = () => { setActive(null); setNote(''); setDecision(null); setBizDetail(null); };

  const submit = (d: 'approved' | 'rejected' | 'needs_more_info') => {
    if (!active) return;
    if ((d === 'rejected' || d === 'needs_more_info') && note.trim().length < 3) {
      setDecision(d);
      return;
    }
    if (active.type === 'golfer' && d === 'needs_more_info') return;
    review.mutate(
      { id: active.id, type: active.type, decision: d as any, adminNote: note },
      { onSuccess: close },
    );
  };

  const proofMetaEntries = active?.proofMetadata
    ? Object.entries(active.proofMetadata).filter(([, v]) => v !== null && v !== undefined && v !== '')
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTabs
        tabs={[
          { id: 'pending',   label: 'Pending',    count: data.filter(r => r.status === 'pending').length },
          { id: 'needs_info', label: 'Needs info', count: data.filter(r => r.status === 'needs_more_info').length },
          { id: 'approved',  label: 'Approved' },
          { id: 'rejected',  label: 'Rejected' },
          { id: 'all',       label: 'All',        count: data.length },
        ]}
        activeId={statusFilter}
        onChange={(id) => setStatusFilter(id as any)}
      />

      {loading ? <SkeletonCards /> : rows.length === 0 ? (
        <EmptyState title="No verification requests" subtitle="You're all caught up." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => (
            <VerificationCard key={r.id} row={r} onOpen={() => setActive(r)} onQuick={(d) => {
              setActive(r);
              if (d === 'approved' && r.type === 'business') {
                review.mutate({ id: r.id, type: r.type, decision: 'approved', adminNote: '' }, { onSuccess: close });
              } else {
                setDecision(d);
              }
            }} />
          ))}
        </div>
      )}

      <DetailDrawer
        open={!!active}
        onClose={close}
        title={active ? (bizDetail?.name ?? active.displayName ?? active.username ?? 'Verification request') : ''}
        subtitle={active ? `${active.type === 'business' ? 'Business' : 'Golfer'} · ${relTime(active.createdAt)}` : undefined}
        footer={active && active.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <DrawerBtn icon={<X size={14} />} tone="danger" disabled={review.isPending} onClick={() => submit('rejected')}>Reject</DrawerBtn>
            {active.type === 'business' && (
              <DrawerBtn icon={<Mail size={14} />} tone="warn" disabled={review.isPending} onClick={() => submit('needs_more_info')}>Needs info</DrawerBtn>
            )}
            <DrawerBtn icon={<CheckCircle2 size={14} />} disabled={review.isPending} onClick={() => submit('approved')}>Approve</DrawerBtn>
          </div>
        ) : undefined}
      >
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusPill tone={active.type === 'business' ? 'warn' : 'neutral'}>
                {active.type === 'business' ? 'Business' : 'Golfer'}
              </StatusPill>
              <StatusPill tone={
                active.status === 'pending' ? 'warn' :
                active.status === 'needs_more_info' ? 'warn' :
                active.status === 'approved' || active.status === 'accepted' ? 'ok' :
                active.status === 'rejected' || active.status === 'declined' ? 'danger' : 'neutral'
              }>
                {active.status}
              </StatusPill>
            </div>

            {active.type === 'business' && bizDetail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bizDetail.category && <Field label="Category" value={bizDetail.category} />}
                {bizDetail.location && <Field label="Location" value={bizDetail.location} />}
                {bizDetail.website && (
                  <Field label="Website">
                    <a href={bizDetail.website} target="_blank" rel="noreferrer" style={{ color: t.brandText, fontSize: 13, wordBreak: 'break-all' }}>
                      {bizDetail.website}
                    </a>
                  </Field>
                )}
                {bizDetail.email && <Field label="Business email" value={bizDetail.email} />}
              </div>
            )}

            {active.type === 'business' && active.proofMethod && (
              <Field label="Proof method" value={PROOF_LABELS[active.proofMethod] ?? active.proofMethod} />
            )}
            {active.type === 'business' && active.proofValue && (
              <Field label="Proof value">
                {/^https?:\/\//i.test(active.proofValue) ? (
                  <a href={active.proofValue} target="_blank" rel="noreferrer" style={{ color: t.brandText, fontSize: 13, wordBreak: 'break-all' }}>
                    {active.proofValue}
                  </a>
                ) : (
                  <span style={{ fontSize: 13, color: t.ink, wordBreak: 'break-all' }}>{active.proofValue}</span>
                )}
              </Field>
            )}
            {proofMetaEntries.length > 0 && (
              <Field label="Proof metadata">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {proofMetaEntries.map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12, color: t.ink }}>
                      <span style={{ color: t.inkMuted }}>{k}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              </Field>
            )}
            {active.domain && (
              <Field label="Domain" value={`${active.domain}${active.domainConfirmed ? ' (confirmed)' : ' (unconfirmed)'}`} />
            )}

            {active.note && <Field label="Request note" value={active.note} />}
            {active.evidenceUrl && (
              <Field label="Evidence">
                <a href={active.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: t.brandText, fontSize: 13 }}>
                  {active.evidenceUrl}
                </a>
              </Field>
            )}
            {active.inviteReason && <Field label="Reason" value={active.inviteReason} />}
            {active.adminNote && <Field label="Admin note" value={active.adminNote} />}

            {active.status === 'pending' && (
              <div>
                <label style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase' }}>
                  Admin note {(decision === 'rejected' || decision === 'needs_more_info') && <span style={{ color: t.danger }}>(required, min 3 chars)</span>}
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Optional for approval, required for rejection or 'needs info'…"
                  rows={3}
                  style={{
                    marginTop: 6, width: '100%',
                    padding: 10, borderRadius: t.radius.md,
                    border: `1px solid ${(decision === 'rejected' || decision === 'needs_more_info') && note.trim().length < 3 ? t.danger : t.line}`,
                    background: t.canvas, color: t.ink, fontSize: 13,
                    outline: 'none', resize: 'vertical',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

function VerificationCard({
  row, onOpen, onQuick,
}: { row: VerificationRow; onOpen: () => void; onQuick: (d: 'approved' | 'rejected' | 'needs_more_info') => void }) {
  const tone =
    row.status === 'pending' || row.status === 'needs_more_info' ? 'warn' :
    row.status === 'approved' || row.status === 'accepted' ? 'ok' :
    row.status === 'rejected' || row.status === 'declined' ? 'danger' : 'neutral';
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`,
      borderRadius: t.radius.md, padding: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <button
        onClick={onOpen}
        style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', gap: 10, alignItems: 'center',
        }}
      >
        <SquircleAvatar size={36} src={row.avatarUrl ?? null} alt={row.displayName ?? ''} userId={row.requestedBy} hairlineRing />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
            {row.displayName ?? row.username ?? row.requestedBy?.slice(0, 8) ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: t.inkMuted }}>
            {row.type === 'business' ? 'Business' : 'Golfer'} · {relTime(row.createdAt)}
          </div>
        </div>
        <StatusPill tone={tone}>{row.status}</StatusPill>
      </button>
      {row.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <DrawerBtn icon={<X size={14} />} tone="danger" onClick={() => onQuick('rejected')}>Reject</DrawerBtn>
          {row.type === 'business' && (
            <DrawerBtn icon={<Mail size={14} />} tone="warn" onClick={() => onQuick('needs_more_info')}>Needs info</DrawerBtn>
          )}
          <DrawerBtn icon={<CheckCircle2 size={14} />} onClick={() => onQuick('approved')}>Approve</DrawerBtn>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: t.inkFaint, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      {children ?? <div style={{ fontSize: 13, color: t.ink, lineHeight: 1.45 }}>{value}</div>}
    </div>
  );
}

/* ─────────────────────── Team & Roles ─────────────────────── */

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
          Granted {relTime(member.createdAt)}{member.grantedBy ? ` · by ${member.grantedBy.slice(0, 8)}` : ''}
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

/* ─────────────────────── Invites ─────────────────────── */

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
            {invite.displayName ?? invite.username ?? invite.email ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: t.inkMuted }}>
            {invite.role ?? 'admin'} · sent {relTime(invite.createdAt)}
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
            {creating ? 'Sending…' : 'Send invite'}
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
                placeholder={usersLoading ? 'Loading users…' : 'Search by name or @username…'}
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
