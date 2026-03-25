import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import {
  UserPlus, Users, Shield, CheckCircle,
  Copy, ExternalLink, MoreHorizontal,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import {
  useAdminV2Users,
  useUserActivityTimeline,
  type AdminUserRow,
  type AdminUserDetail,
  type UserFilterStatus,
  type UserActivityEvent,
} from '../hooks/useAdminV2Users';
import {
  AdminTable,
  AdminPageHeader,
  AdminSearchBar,
  AdminFilterBar,
  AdminStatusPill,
  AdminDrawer,
  AdminBulkActionBar,
  AdminButton,
  AdminSectionHeader,
  AdminKpiCard,
} from '../components/ui';
import { AdminMiniCard } from '../components/shared/AdminMiniCard';

// ─── Activity dot helper ──────────────────────────────────────────────────────

function ActivityDot({ lastSeenAt }: { lastSeenAt: string | null }) {
  if (!lastSeenAt) {
    return <div className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />;
  }
  const age = Date.now() - new Date(lastSeenAt).getTime();
  if (age < 24 * 3600_000) {
    return <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />;
  }
  if (age < 7 * 24 * 3600_000) {
    return <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />;
  }
  return <div className="w-2 h-2 rounded-full bg-slate-200 flex-shrink-0" />;
}

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return '30d+ ago';
  const age = Date.now() - new Date(lastSeenAt).getTime();
  if (age > 30 * 24 * 3600_000) return '30d+ ago';
  return formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true });
}

// ─── Column helper ────────────────────────────────────────────────────────────

const col = createColumnHelper<AdminUserRow>();

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({
  role,
  userId,
  onUpdate,
}: {
  role: string | null;
  userId: string;
  onUpdate: (userId: string, role: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const options = [
    { value: null,            label: 'No role' },
    { value: 'admin',         label: 'Admin' },
    { value: 'moderator',     label: 'Moderator' },
    { value: 'limited_admin', label: 'Limited Admin' },
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95',
          role
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 hover:opacity-80'
            : 'bg-muted text-muted-foreground hover:bg-muted/80',
        )}
      >
        {role ? <Shield className="h-3 w-3" /> : null}
        {role ?? 'User'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-lg border border-border/60 bg-card shadow-lg py-1 overflow-hidden">
            {options.map(opt => (
              <button
                key={opt.value ?? 'none'}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(userId, opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-[12.5px] hover:bg-muted/60 transition-colors',
                  opt.value === role ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Row action menu ──────────────────────────────────────────────────────────

function RowMenu({ user, onViewProfile }: { user: AdminUserRow; onViewProfile: () => void }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors active:scale-90"
        aria-label="Row actions"
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 min-w-[160px] rounded-lg border border-border/60 bg-card shadow-lg py-1 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-foreground hover:bg-muted/60 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View details
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/profile/${user.id}`); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-foreground hover:bg-muted/60 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View public profile
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(user.id);
                toast.success('User ID copied');
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-foreground hover:bg-muted/60 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy user ID
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Activity timeline ────────────────────────────────────────────────────────

const EVENT_COLORS: Record<UserActivityEvent['type'], string> = {
  signup:        '#17C964',
  post:          '#1D6FF5',
  review:        '#F5A623',
  follow:        '#7C3AED',
  login:         '#94A3B8',
  page_view:     '#94A3B8',
  message:       '#94A3B8',
  course_played: '#0891B2',
};

function formatEventTime(timestamp: string): string {
  const d = new Date(timestamp);
  const diffMs = Date.now() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 7) {
    return formatDistanceToNow(d, { addSuffix: false }) + ' ago';
  }
  return format(d, 'd MMM');
}

function ActivityTimeline({ userId }: { userId: string }) {
  const { data: events, isLoading, isError } = useUserActivityTimeline(userId);

  if (isError) {
    return (
      <div className="space-y-3">
        <AdminSectionHeader title="Activity (last 90 days)" />
        <p className="text-[12px] text-muted-foreground">Failed to load activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AdminSectionHeader title="Activity (last 90 days)" />
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F1F5F9' }} />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 rounded" style={{ background: '#F1F5F9' }} />
                <div className="h-2.5 w-20 rounded" style={{ background: '#F1F5F9' }} />
              </div>
            </div>
          ))}
        </div>
      ) : !events?.length ? (
        <p className="text-[12px] text-muted-foreground">No recent activity</p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-0.5 pr-1">
          {events.map(event => (
            <div key={event.id} className="flex items-start gap-3 py-2">
              <div
                className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                style={{ background: EVENT_COLORS[event.type] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: '#334155' }}>
                  {event.label}
                </p>
                {event.detail && (
                  <p className="text-[11px] truncate" style={{ color: '#94A3B8' }}>
                    {event.detail}
                  </p>
                )}
              </div>
              <span className="text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: '#94A3B8' }}>
                {formatEventTime(event.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── User detail drawer ───────────────────────────────────────────────────────

function UserDetailDrawer({
  userId,
  detail,
  isLoading,
  onClose,
  onUpdateRole,
}: {
  userId: string | null;
  detail: AdminUserDetail | undefined;
  isLoading: boolean;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string | null) => void;
}) {
  const navigate = useNavigate();

  const StatTile = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value.toLocaleString()}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );

  return (
    <AdminDrawer
      open={!!userId}
      onClose={onClose}
      title={detail?.display_name ?? 'User Detail'}
      subtitle={detail?.username ? `@${detail.username}` : undefined}
      footer={
        detail ? (
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              icon={ExternalLink}
              onClick={() => navigate(`/profile/${detail.id}`)}
            >
              Public Profile
            </AdminButton>
          </div>
        ) : undefined
      }
    >
      {isLoading || !detail ? (
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-muted rounded-lg" />
              <div className="h-4 w-24 bg-muted rounded-lg" />
              <div className="h-3 w-40 bg-muted rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Identity */}
          <div className="flex items-start gap-4">
            <SquircleAvatar size={64} src={detail.avatar_url} alt={detail.display_name ?? ''} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground truncate">
                  {detail.display_name ?? 'Unknown'}
                </h3>
                {detail.is_verified && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              {detail.username && (
                <p className="text-sm text-muted-foreground">@{detail.username}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-muted-foreground">
                {detail.country && (
                  <span>{detail.country}</span>
                )}
                {detail.home_club && (
                  <span>{detail.home_club}</span>
                )}
                {detail.handicap_index != null && (
                  <span className="font-medium">
                    HCP {detail.handicap_index.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40">
            <div className="flex items-center justify-between px-4 py-3 text-[12.5px]">
              <span className="text-muted-foreground">User ID</span>
              <button
                onClick={() => { navigator.clipboard.writeText(detail.id); toast.success('Copied'); }}
                className="font-mono text-foreground hover:opacity-70 transition-opacity flex items-center gap-1.5"
              >
                <Copy className="h-3 w-3" />
                {detail.id.slice(0, 8)}…
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-[12.5px]">
              <span className="text-muted-foreground">Joined</span>
              <span className="text-foreground">{format(new Date(detail.created_at), 'd MMM yyyy')}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-[12.5px]">
              <span className="text-muted-foreground">Role</span>
              <RoleBadge role={detail.role} userId={detail.id} onUpdate={onUpdateRole} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="space-y-3">
            <AdminSectionHeader title="Stats" />
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Posts" value={detail.posts_count} />
              <StatTile label="Reviews" value={detail.reviews_count} />
              <StatTile label="Followers" value={detail.followers} />
              <StatTile label="Following" value={detail.following} />
            </div>
            {detail.top100_played > 0 && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center">
                <AdminKpiCard title="Top 100 Played" value={detail.top100_played} format="number" />
              </div>
            )}
          </div>

          {/* Bio */}
          {detail.bio && (
            <div className="space-y-2">
              <AdminSectionHeader title="Bio" />
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {detail.bio}
              </p>
            </div>
          )}

          {/* Activity Timeline */}
          {userId && <ActivityTimeline userId={userId} />}

        </div>
      )}
    </AdminDrawer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [searchParams] = useSearchParams();
  const initialFilter = (searchParams.get('filter') as UserFilterStatus) || 'all';

  const {
    users, allFilteredUsers, allCount, filteredCount, isLoading,
    search, setSearch,
    filter, setFilter, counts,
    page, setPage, pageSize, setPageSize,
    selectedIds, setSelectedIds,
    drawerUserId, setDrawerUserId,
    userDetail, detailLoading,
    updateRole,
  } = useAdminV2Users();

  // Apply URL filter on mount
  React.useEffect(() => {
    if (initialFilter && initialFilter !== 'all') {
      setFilter(initialFilter);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = React.useMemo(() => [
    col.display({
      id: 'avatar',
      header: '',
      size: 48,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ActivityDot lastSeenAt={row.original.last_seen_at} />
          <SquircleAvatar size={32} src={row.original.avatar_url} alt={row.original.display_name ?? ''} />
        </div>
      ),
    }),
    col.accessor('display_name', {
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">
            {row.original.display_name ?? '—'}
          </p>
          {row.original.username && (
            <p className="text-[11.5px] text-muted-foreground truncate">
              @{row.original.username}
            </p>
          )}
        </div>
      ),
    }),
    col.accessor('country', {
      header: 'Location',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[13px] text-muted-foreground">
          {getValue() ?? '—'}
        </span>
      ),
    }),
    col.accessor('role', {
      header: 'Role',
      cell: ({ row }) => (
        <RoleBadge role={row.original.role} userId={row.original.id} onUpdate={updateRole} />
      ),
    }),
    col.accessor('is_verified', {
      header: 'Status',
      enableSorting: true,
      cell: ({ getValue }) => (
        <AdminStatusPill status={getValue() ? 'verified' : 'inactive'} label={getValue() ? 'Verified' : 'Unverified'} />
      ),
    }),
    col.display({
      id: 'last_seen',
      header: 'Last Seen',
      cell: ({ row }) => (
        <span className="text-[12px] text-slate-400 whitespace-nowrap">
          {formatLastSeen(row.original.last_seen_at)}
        </span>
      ),
    }),
    col.accessor('created_at', {
      header: 'Joined',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[12.5px] text-muted-foreground whitespace-nowrap">
          {format(new Date(getValue()), 'd MMM yyyy')}
        </span>
      ),
    }),
    col.display({
      id: 'actions',
      header: '',
      size: 48,
      cell: ({ row }) => (
        <RowMenu
          user={row.original}
          onViewProfile={() => setDrawerUserId(row.original.id)}
        />
      ),
    }),
  ], [updateRole, setDrawerUserId]);

  const filterOptions = [
    { id: 'all',        label: 'All',        count: counts.all },
    { id: 'verified',   label: 'Verified',   count: counts.verified,   variant: 'success' as const },
    { id: 'unverified', label: 'Unverified', count: counts.unverified },
    { id: 'admin',      label: 'Admins',     count: counts.admin,      variant: 'warning' as const },
    { id: 'new_today',  label: 'New Today',  variant: 'success' as const },
    { id: 'active_24h', label: 'Active 24h', variant: 'success' as const },
  ];

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="space-y-6">

      {/* Header */}
      <AdminPageHeader
        title="Users"
        description="Manage golfer accounts, roles, and verification status"
        action={
          <AdminButton variant="primary" icon={UserPlus}>
            Invite User
          </AdminButton>
        }
      />

      {/* KPI strip with mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMiniCard label="Total Users" value={counts.all} borderColor="#F5A623" isLoading={isLoading} />
        <AdminMiniCard label="Verified" value={counts.verified} borderColor="#17C964" isLoading={isLoading} />
        <AdminMiniCard label="Admins" value={counts.admin} borderColor="#7C3AED" isLoading={isLoading} />
        <AdminMiniCard label="New Today" value={users.filter(u => {
          const t = new Date(); t.setHours(0,0,0,0);
          return new Date(u.created_at) >= t;
        }).length || 0} borderColor="#1D6FF5" isLoading={isLoading} />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Search users..." resultCount={filteredCount} className="flex-1" />
        <AdminFilterBar filters={filterOptions} active={filter} onChange={setFilter} />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        getRowId={(u) => u.id}
        onRowClick={(u) => setDrawerUserId(u.id)}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        enableRowSelection
        emptyTitle="No users found"
        emptyDescription={search ? 'Try a different search term' : 'No users match the current filter'}
        emptyIcon={Users}
        pagination={{
          page,
          pageSize,
          total:          filteredCount,
          onPageChange:   setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      {/* Bulk action bar */}
      <AdminBulkActionBar
        selectedCount={selectedIds.size}
        noun="user"
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            id: 'export',
            label: 'Export CSV',
            onClick: () => {
              const rows = allFilteredUsers.filter(u => selectedIds.has(u.id));
              const csv  = [
                'ID,Name,Username,Country,Role,Verified,Joined',
                ...rows.map(u => [
                  u.id, u.display_name ?? '', u.username ?? '',
                  u.country ?? '', u.role ?? 'user',
                  u.is_verified, u.created_at,
                ].join(',')),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href     = url;
              a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            },
          },
        ]}
      />

      {/* Detail drawer */}
      <UserDetailDrawer
        userId={drawerUserId}
        detail={userDetail}
        isLoading={detailLoading}
        onClose={() => setDrawerUserId(null)}
        onUpdateRole={updateRole}
      />

    </div>
  );
}
