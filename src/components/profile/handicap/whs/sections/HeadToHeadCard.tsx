import React, { useMemo } from 'react';
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
}

function initials(name: string): string {
  const fn = firstName(name);
  return fn.slice(0, 2).toUpperCase();
}

export const HeadToHeadCard: React.FC<Props> = ({ ownerUserId, currentUserHandicap }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: friends, isLoading } = useFriendsLeaderboard(ownerUserId);

  const closestRival = useMemo<WhsFriendMatch | null>(() => {
    if (!friends || friends.length === 0 || currentUserHandicap === null || currentUserHandicap === undefined)
      return null;
    const candidates = friends
      .filter((f) => f.friend_handicap_index !== null && f.friend_handicap_index !== undefined)
      .map((f) => ({
        f,
        distance: Math.abs((f.friend_handicap_index ?? 0) - currentUserHandicap),
      }))
      .sort((a, b) => a.distance - b.distance);
    return candidates[0]?.f ?? null;
  }, [friends, currentUserHandicap]);

  if (isLoading) {
    return (
      <section className="px-5 mb-6">
        <div
          className="rounded-2xl border p-4 animate-pulse"
          style={{ borderColor: 'rgba(15,23,42,0.08)' }}
        >
          <div className="h-3 w-24 bg-muted rounded mb-4" />
          <div className="h-16 w-full bg-muted/60 rounded" />
        </div>
      </section>
    );
  }

  if (!closestRival || currentUserHandicap === null || currentUserHandicap === undefined) {
    return null;
  }

  const rivalH = closestRival.friend_handicap_index ?? 0;
  const delta = rivalH - currentUserHandicap;
  const rivalFirst = firstName(closestRival.friend_name);

  // recent rounds in last 30d (we only have last_round_played_at; treat 1 if within window)
  const recentMissionAvailable =
    closestRival.last_round_played_at &&
    Date.now() - new Date(closestRival.last_round_played_at).getTime() < 30 * 86400_000;

  const handleInvite = async () => {
    const res = await callCreateInvite(closestRival.friend_passport_id, 'copy_link');
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? closestRival.friend_name,
    });
  };

  const onCardClick = () => {
    if (closestRival.is_clbhouz_user && closestRival.friend_user_id) {
      navigate(`/p/${closestRival.friend_user_id}`);
    }
  };

  return (
    <section className="px-5 mb-6">
      <div
        className="rounded-2xl border p-4 bg-background"
        style={{ borderColor: 'rgba(15,23,42,0.08)', cursor: closestRival.is_clbhouz_user ? 'pointer' : 'default' }}
        onClick={onCardClick}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground mb-3">
          Closest Rival
        </p>
        <div className="flex items-center justify-between mb-4">
          {/* You */}
          <div className="flex flex-col items-center flex-1">
            <div
              className="w-12 h-12 flex items-center justify-center text-[12px] font-bold mb-2"
              style={{
                background: 'rgba(247,147,30,0.15)',
                color: '#9A6116',
                borderRadius: '34%',
              }}
            >
              YOU
            </div>
            <p className="text-[20px] font-bold text-foreground tabular-nums leading-none">
              {currentUserHandicap.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">You</p>
          </div>

          {/* Centre */}
          <div className="flex flex-col items-center px-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-muted-foreground"
              style={{ background: 'rgba(15,23,42,0.05)' }}
            >
              vs
            </div>
            <span
              className="mt-2 text-[11px] font-semibold tabular-nums"
              style={{ color: delta >= 0 ? '#059669' : '#B91C1C' }}
            >
              {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
            </span>
          </div>

          {/* Rival */}
          <div className="flex flex-col items-center flex-1">
            {closestRival.friend_thumbnail_url ? (
              <img
                src={closestRival.friend_thumbnail_url}
                alt={closestRival.friend_name}
                className="w-12 h-12 object-cover mb-2"
                style={{ borderRadius: '34%' }}
              />
            ) : (
              <div
                className="w-12 h-12 flex items-center justify-center text-[12px] font-bold text-muted-foreground mb-2"
                style={{ background: 'rgba(15,23,42,0.06)', borderRadius: '34%' }}
              >
                {initials(closestRival.friend_name)}
              </div>
            )}
            <p className="text-[20px] font-bold text-foreground tabular-nums leading-none">
              {rivalH.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[100px] uppercase tracking-wide">
              {rivalFirst}
            </p>
          </div>
        </div>

        {/* Mission */}
        <div
          className="rounded-xl p-3 text-[13px] leading-snug"
          style={{ background: 'rgba(247,147,30,0.06)', color: '#0F172A' }}
        >
          {recentMissionAvailable && closestRival.last_round_adjusted_gross != null ? (
            <>
              Beat <span className="font-bold">{closestRival.last_round_adjusted_gross}</span> on
              your next round to leapfrog {rivalFirst}.
            </>
          ) : (
            <>{rivalFirst} hasn't played in a while — make your move.</>
          )}
        </div>

        {!closestRival.is_clbhouz_user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInvite();
            }}
            className="mt-2 text-[12px] font-semibold"
            style={{ color: '#F7931E' }}
          >
            Invite {rivalFirst} to see live rivalry →
          </button>
        )}
      </div>
    </section>
  );
};

export default HeadToHeadCard;
