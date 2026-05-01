import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useFriendsLeaderboard,
  useSentInvites,
  whsKeys,
} from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { firstName, shareInvite } from '@/lib/whs/share';
import type { WhsFriendMatch, WhsInviteStatus } from '@/lib/whs/types';

interface Props {
  ownerUserId: string;
}

function initials(name: string): string {
  const fn = firstName(name);
  return fn.slice(0, 2).toUpperCase();
}

const StatusBadge: React.FC<{ status: WhsInviteStatus['status'] }> = ({ status }) => {
  if (status === 'redeemed') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}
      >
        🎉 Joined clbhouz
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(15,23,42,0.05)', color: '#94A3B8' }}
      >
        Expired
      </span>
    );
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(15,23,42,0.05)', color: '#64748B' }}
    >
      Sent
    </span>
  );
};

export const InvitesSection: React.FC<Props> = ({ ownerUserId }) => {
  const queryClient = useQueryClient();
  const { data: friends, isLoading: friendsLoading } = useFriendsLeaderboard(ownerUserId);
  const { data: invites, isLoading: invitesLoading } = useSentInvites();

  const [openInvite, setOpenInvite] = useState(true);
  const [openSent, setOpenSent] = useState(false);

  const invitable = useMemo<WhsFriendMatch[]>(() => {
    return (friends ?? [])
      .filter((f) => !f.is_clbhouz_user)
      .sort((a, b) => (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99));
  }, [friends]);

  const triggerShare = async (passportId: number, name: string) => {
    const res = await callCreateInvite(passportId, 'copy_link');
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? name,
    });
  };

  return (
    <section className="mb-6">
      {/* Sub 1 */}
      <div>
        <button
          onClick={() => setOpenInvite((v) => !v)}
          className="w-full px-5 py-3 flex items-center justify-between"
        >
          <div className="text-left">
            <h3 className="text-[16px] font-bold text-foreground">Invite to clbhouz</h3>
            <p className="text-[12px] text-muted-foreground">
              Bring your England Golf friends across
            </p>
          </div>
          {openInvite ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {openInvite && (
          <div>
            {friendsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 animate-pulse flex gap-3 items-center">
                  <div className="w-9 h-9 bg-muted rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 bg-muted rounded" />
                    <div className="h-2.5 w-20 bg-muted/60 rounded" />
                  </div>
                </div>
              ))
            ) : invitable.length === 0 ? (
              <p className="px-5 pb-3 text-[13px] text-muted-foreground">
                Everyone in your England Golf list is already on clbhouz. 🎉
              </p>
            ) : (
              invitable.map((f, idx) => (
                <div
                  key={f.friend_row_id}
                  className="px-5 py-3 flex items-center gap-3"
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(15,23,42,0.06)' }}
                >
                  {f.friend_thumbnail_url ? (
                    <img
                      src={f.friend_thumbnail_url}
                      alt={f.friend_name}
                      className="w-9 h-9 object-cover"
                      style={{ borderRadius: '34%' }}
                    />
                  ) : (
                    <div
                      className="w-9 h-9 flex items-center justify-center text-[11px] font-bold text-muted-foreground"
                      style={{ background: 'rgba(15,23,42,0.06)', borderRadius: '34%' }}
                    >
                      {initials(f.friend_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                      {firstName(f.friend_name)}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {f.friend_home_club ?? '—'}
                      {f.friend_handicap_index != null && (
                        <>
                          {' · '}
                          <span className="tabular-nums">{f.friend_handicap_index.toFixed(1)}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => triggerShare(f.friend_passport_id, f.friend_name)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ background: '#F7931E', color: '#fff' }}
                  >
                    Invite
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="h-px mx-5 my-3" style={{ background: 'rgba(15,23,42,0.08)' }} />

      {/* Sub 2 */}
      <div>
        <button
          onClick={() => setOpenSent((v) => !v)}
          className="w-full px-5 py-3 flex items-center justify-between"
        >
          <div className="text-left">
            <h3 className="text-[16px] font-bold text-foreground">Your invites</h3>
            <p className="text-[12px] text-muted-foreground">
              {invites?.length ?? 0} sent
            </p>
          </div>
          {openSent ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {openSent && (
          <div>
            {invitesLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="px-5 py-3 animate-pulse">
                  <div className="h-3 w-32 bg-muted rounded mb-1" />
                  <div className="h-2.5 w-20 bg-muted/60 rounded" />
                </div>
              ))
            ) : !invites || invites.length === 0 ? (
              <p className="px-5 pb-3 text-[13px] text-muted-foreground">
                Tap <span className="font-semibold">Invite</span> on a friend above to get started.
              </p>
            ) : (
              invites.map((inv, idx) => {
                const isPending = inv.status === 'pending';
                const onClick = () => {
                  if (!isPending) return;
                  shareInvite({
                    share_url: `https://clbhouz.co.uk/i/${inv.invite_code}`,
                    share_message: `Join me on Clbhouz — connect your England Golf handicap and we can compare rounds. Tap: https://clbhouz.co.uk/i/${inv.invite_code}`,
                    invitee_name: inv.invitee_name,
                  });
                };
                return (
                  <button
                    key={inv.id}
                    onClick={onClick}
                    disabled={!isPending}
                    className="w-full px-5 py-3 text-left flex items-center justify-between"
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(15,23,42,0.06)' }}
                  >
                    <div className="min-w-0 mr-3">
                      <p className="text-[14px] font-semibold text-foreground truncate">
                        {firstName(inv.invitee_name)}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {inv.invitee_home_club ?? '—'} ·{' '}
                        {formatDistanceToNow(new Date(inv.sent_at), { addSuffix: true })}
                        {isPending && ' · Tap to share again'}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default InvitesSection;
