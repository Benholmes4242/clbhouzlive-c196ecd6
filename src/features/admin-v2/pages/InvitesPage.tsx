import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, formatDistanceToNow, isPast, differenceInHours } from 'date-fns';
import { Mail, Send, X, RefreshCw, Clock, CheckCircle, Search, User, Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAdminV2Invites, type InviteRow } from '../hooks/useAdminV2Access';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { toast } from 'sonner';
import {
  AdminPageHeader, AdminFilterBar, AdminStatusPill,
  AdminButton, AdminKpiCard,
} from '../components/ui';
import { AdminMiniCard } from '../components/shared/AdminMiniCard';

// ─── User search hook ─────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
}

function useUserSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(8);

      setResults(data ?? []);
      setIsSearching(false);
    }, 250);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return { results, isSearching };
}

// ─── Expiry status pill ───────────────────────────────────────────────────────

function ExpiryStatusPill({ invite }: { invite: InviteRow }) {
  if (invite.acceptedAt) {
    return <span style={{ background: '#F1F5F9', color: '#94A3B8', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Accepted</span>;
  }
  const expDate = new Date(invite.expiresAt);
  if (isPast(expDate)) {
    return <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Expired</span>;
  }
  const hoursLeft = differenceInHours(expDate, new Date());
  if (hoursLeft < 24) {
    return <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Expiring soon</span>;
  }
  return <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Active</span>;
}

// ─── New invite form ──────────────────────────────────────────────────────────

function NewInviteForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (userId: string, role: string) => void;
  isPending: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [role, setRole] = useState<'full' | 'limited'>('limited');
  const [open, setOpen] = useState(false);
  const { results, isSearching } = useUserSearch(searchQuery);

  const handleSubmit = () => {
    if (!selectedUser) return;
    onSubmit(selectedUser.id, role);
    setSelectedUser(null);
    setSearchQuery('');
    setOpen(false);
  };

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setSearchQuery('');
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
        <button onClick={() => { setOpen(false); setSelectedUser(null); setSearchQuery(''); }} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        {/* User search */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-muted-foreground">Search user</label>
          {selectedUser ? (
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-background">
              <SquircleAvatar
                src={selectedUser.profile_photo_url}
                alt={selectedUser.display_name || selectedUser.username || ''}
                size={32}
                fallback={(selectedUser.display_name || selectedUser.username || '?').charAt(0)}
                hideRing
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{selectedUser.display_name || selectedUser.username}</p>
                {selectedUser.username && selectedUser.display_name && (
                  <p className="text-[11px] text-muted-foreground">@{selectedUser.username}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-border/60 bg-background text-[13.5px] text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-border/40"
                autoFocus
              />
              {/* Search results dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute z-10 top-full mt-1 w-full rounded-xl border border-border/60 bg-card shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-[12px] text-muted-foreground">Searching...</div>
                  ) : results.length === 0 ? (
                    <div className="p-4 text-center text-[12px] text-muted-foreground">No users found</div>
                  ) : (
                    results.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                      >
                        <SquircleAvatar
                          src={user.profile_photo_url}
                          alt={user.display_name || user.username || ''}
                          size={32}
                          fallback={(user.display_name || user.username || '?').charAt(0)}
                          hideRing
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{user.display_name || user.username}</p>
                          {user.username && (
                            <p className="text-[11px] text-muted-foreground">@{user.username}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role selector */}
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
      </div>

      <div className="flex gap-2">
        <AdminButton
          variant="primary"
          icon={Send}
          loading={isPending}
          onClick={handleSubmit}
          className="flex-1"
          disabled={!selectedUser}
        >
          Send Invite
        </AdminButton>
        <AdminButton variant="outline" onClick={() => { setOpen(false); setSelectedUser(null); setSearchQuery(''); }}>
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

  const displayLabel = invite.displayName || invite.username
    ? (invite.displayName || `@${invite.username}`)
    : invite.email || 'Unknown user';

  const copyInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/admin-invite/${invite.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied');
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden',
        isAccepted ? 'bg-green-50 dark:bg-green-500/15' : 'bg-muted',
      )}>
        {invite.avatarUrl ? (
          <SquircleAvatar
            src={invite.avatarUrl}
            alt={displayLabel}
            size={36}
            fallback={displayLabel.charAt(0)}
            hideRing
          />
        ) : isAccepted ? (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : invite.invitedUserId ? (
          <User className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Mail className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13.5px] font-semibold text-foreground truncate">{displayLabel}</p>
          {statusEl}
          <ExpiryStatusPill invite={invite} />
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

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Copy link button */}
        <button
          onClick={copyInviteLink}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          title="Copy invite link"
        >
          <Clipboard className="h-4 w-4 text-muted-foreground" />
        </button>

        {isPendingInvite && (
          <>
            <AdminButton variant="ghost" size="sm" icon={RefreshCw} loading={isPending} onClick={() => onResend(invite.id)}>
              Resend
            </AdminButton>
            <AdminButton variant="ghost" size="sm" icon={X} loading={isPending} onClick={() => onCancel(invite.id)} />
          </>
        )}
      </div>
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
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-4xl mx-auto space-y-6">

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
        onSubmit={(userId, role) => createMutation.mutate({ invitedUserId: userId, role })}
        isPending={createMutation.isPending}
      />

      {/* KPI strip with mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminMiniCard label="Total Sent" value={counts.all} borderColor="#F5A623" isLoading={isLoading} />
        <AdminMiniCard label="Pending" value={counts.pending} borderColor="#D97706" isLoading={isLoading} />
        <AdminMiniCard label="Accepted" value={counts.accepted} borderColor="#17C964" isLoading={isLoading} />
        <AdminMiniCard label="Expired" value={counts.expired} borderColor="#DC2626" isLoading={isLoading} />
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
