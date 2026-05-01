import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFriendsLeaderboard, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { firstName, shareInvite } from '@/lib/whs/share';
import type { WhsFriendMatch } from '@/lib/whs/types';

interface Props {
  ownerUserId: string;
  currentUserHandicap: number | null | undefined;
  currentUserName?: string;
}

type Sort = 'handicap' | 'activity';
type Filter = 'all' | 'clbhouz' | 'invite';

function initials(name: string): string {
  const fn = firstName(name);
  return fn.slice(0, 2).toUpperCase();
}

export const FriendsLeaderboard: React.FC<Props> = ({
  ownerUserId,
  currentUserHandicap,
  currentUserName = 'You',
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: friends, isLoading } = useFriendsLeaderboard(ownerUserId);

  const [sort, setSort] = useState<Sort>('handicap');
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => {
    const list: Array<
      | { kind: 'self'; handicap: number | null }
      | { kind: 'friend'; friend: WhsFriendMatch }
    > = (friends ?? []).map((f) => ({ kind: 'friend' as const, friend: f }));

    list.push({ kind: 'self', handicap: currentUserHandicap ?? null });

    // filter (only applies to friends)
    let filtered = list.filter((r) => {
      if (r.kind === 'self') return true;
      if (filter === 'clbhouz') return r.friend.is_clbhouz_user;
      if (filter === 'invite') return !r.friend.is_clbhouz_user;
      return true;
    });

    // sort
    filtered.sort((a, b) => {
      const ah =
        a.kind === 'self' ? a.handicap : a.friend.friend_handicap_index;
      const bh =
        b.kind === 'self' ? b.handicap : b.friend.friend_handicap_index;
      if (sort === 'handicap') {
        const av = ah ?? 999;
        const bv = bh ?? 999;
        return av - bv;
      } else {
        const at =
          a.kind === 'self' ? 0 : new Date(a.friend.last_round_played_at ?? 0).getTime();
        const bt =
          b.kind === 'self' ? 0 : new Date(b.friend.last_round_played_at ?? 0).getTime();
        return bt - at;
      }
    });
    return filtered;
  }, [friends, currentUserHandicap, sort, filter]);

  const yourRankIndex = rows.findIndex((r) => r.kind === 'self');
  const totalCount = rows.length;
  const clbhouzCount = (friends ?? []).filter((f) => f.is_clbhouz_user).length;

  const handleInvite = async (f: WhsFriendMatch) => {
    const res = await callCreateInvite(f.friend_passport_id, 'copy_link');
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? f.friend_name,
    });
  };

  return (
    <section className="mb-6">
      <div className="px-5 mb-1">
        <h3 className="text-[16px] font-bold text-foreground">Friends Leaderboard</h3>
        <p className="text-[12px] text-muted-foreground">Ranked by handicap index</p>
      </div>

      {/* Stats strip */}
      <div className="px-5 mt-3 mb-3 flex items-center gap-4 text-[12px] text-muted-foreground">
        {!isLoading && yourRankIndex >= 0 && (
          <span>
            You're <span className="font-semibold text-foreground">#{yourRankIndex + 1}</span> of {totalCount}
          </span>
        )}
        <span>
          <span className="font-semibold text-foreground">{clbhouzCount}</span> on clbhouz
        </span>
      </div>

      {/* Filter/Sort row */}
      <div className="px-5 mb-2 flex items-center gap-4 text-[12px]">
        <div className="flex items-center gap-2">
          {(['handicap', 'activity'] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="font-semibold"
              style={{ color: sort === s ? '#0F172A' : '#94A3B8' }}
            >
              {s === 'handicap' ? 'Handicap' : 'Activity'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {(['all', 'clbhouz', 'invite'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="font-semibold"
              style={{ color: filter === f ? '#0F172A' : '#94A3B8' }}
            >
              {f === 'all' ? 'All' : f === 'clbhouz' ? 'On clbhouz' : 'Not yet'}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3 animate-pulse flex items-center gap-3">
                <div className="w-6 h-4 bg-muted rounded" />
                <div className="w-9 h-9 bg-muted/70 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-2.5 w-20 bg-muted/60 rounded" />
                </div>
                <div className="h-4 w-10 bg-muted rounded" />
              </div>
            ))
          : rows.length === 0 ? (
            <p className="px-5 py-4 text-[14px] text-muted-foreground">
              Connect more England Golf friends to see them here.
            </p>
          ) : (
            rows.map((r, idx) => {
              const isSelf = r.kind === 'self';
              const handicap = isSelf
                ? r.handicap
                : r.friend.friend_handicap_index;
              const name = isSelf ? currentUserName : firstName(r.friend.friend_name);
              const fullName = isSelf ? currentUserName : r.friend.friend_name;
              const club = isSelf ? null : r.friend.friend_home_club;

              const onClick = () => {
                if (isSelf) return;
                if (r.friend.is_clbhouz_user && r.friend.friend_user_id) {
                  navigate(`/p/${r.friend.friend_user_id}`);
                } else {
                  handleInvite(r.friend);
                }
              };

              return (
                <button
                  key={isSelf ? 'self' : r.friend.friend_row_id}
                  onClick={onClick}
                  disabled={isSelf}
                  className="w-full px-5 py-3 flex items-center gap-3 text-left"
                  style={{
                    borderTop: idx === 0 ? 'none' : '1px solid rgba(15,23,42,0.06)',
                    background: isSelf ? 'rgba(247,147,30,0.06)' : 'transparent',
                  }}
                >
                  <span
                    className="w-7 text-[13px] font-bold tabular-nums"
                    style={{ color: isSelf ? '#9A6116' : '#64748B' }}
                  >
                    {idx + 1}
                  </span>
                  {!isSelf && r.friend.friend_thumbnail_url ? (
                    <img
                      src={r.friend.friend_thumbnail_url}
                      alt={fullName}
                      className="w-9 h-9 object-cover"
                      style={{ borderRadius: '34%' }}
                    />
                  ) : (
                    <div
                      className="w-9 h-9 flex items-center justify-center text-[11px] font-bold text-muted-foreground"
                      style={{
                        background: isSelf ? 'rgba(247,147,30,0.15)' : 'rgba(15,23,42,0.06)',
                        borderRadius: '34%',
                      }}
                    >
                      {isSelf ? 'YOU' : initials(fullName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                      {name}
                      {isSelf && (
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold align-middle"
                          style={{ background: '#F7931E', color: '#fff' }}
                        >
                          YOU
                        </span>
                      )}
                    </p>
                    {club && (
                      <p className="text-[11px] text-muted-foreground truncate">{club}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[16px] font-bold tabular-nums text-foreground">
                      {handicap !== null && handicap !== undefined ? handicap.toFixed(1) : '—'}
                    </span>
                    {!isSelf && (
                      <span
                        className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide"
                        style={
                          r.friend.is_clbhouz_user
                            ? { background: 'rgba(16,185,129,0.12)', color: '#059669' }
                            : { background: 'rgba(15,23,42,0.05)', color: '#64748B' }
                        }
                      >
                        {r.friend.is_clbhouz_user ? 'clbhouz' : 'Invite'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
      </div>
    </section>
  );
};

export default FriendsLeaderboard;
