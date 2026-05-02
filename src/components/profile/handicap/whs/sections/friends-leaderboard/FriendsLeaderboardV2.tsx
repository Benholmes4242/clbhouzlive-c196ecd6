import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFriendsLeaderboard, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import type { WhsFriendMatch } from '@/lib/whs/types';
import SectionHeader from '../SectionHeader';
import Paged8 from '../_shared/Paged8';
import LeaderboardScopeChips, { type LeaderboardScope } from './LeaderboardScopeChips';
import LeaderboardRow from './LeaderboardRow';
import PodiumStack from './PodiumStack';
import EmptyScopeState from './EmptyScopeState';

interface Props {
  ownerUserId: string;
  currentUserHandicap: number | null | undefined;
  currentUserName?: string;
}

export type LeaderboardItem =
  | { id: 'self'; kind: 'self'; handicap: number | null; name: string }
  | { id: string; kind: 'friend'; friend: WhsFriendMatch };

export const FriendsLeaderboardV2: React.FC<Props> = ({
  ownerUserId,
  currentUserHandicap,
  currentUserName = 'You',
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: friends, isLoading } = useFriendsLeaderboard(ownerUserId);

  const [scope, setScope] = useState<LeaderboardScope>('all');

  const rows: LeaderboardItem[] = useMemo(() => {
    const friendRows: LeaderboardItem[] = (friends ?? []).map((f) => ({
      id: f.friend_row_id,
      kind: 'friend' as const,
      friend: f,
    }));
    const selfRow: LeaderboardItem = {
      id: 'self',
      kind: 'self',
      handicap: currentUserHandicap ?? null,
      name: currentUserName,
    };
    const all = [...friendRows, selfRow];
    all.sort((a, b) => {
      const av = a.kind === 'self' ? a.handicap ?? 999 : a.friend.friend_handicap_index ?? 999;
      const bv = b.kind === 'self' ? b.handicap ?? 999 : b.friend.friend_handicap_index ?? 999;
      return av - bv;
    });
    return all;
  }, [friends, currentUserHandicap, currentUserName]);

  const totalCount = rows.length;
  const selfRow = rows.find((r) => r.kind === 'self') as LeaderboardItem | undefined;
  const yourRankIndex = rows.findIndex((r) => r.kind === 'self');
  const yourRank = yourRankIndex + 1;

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const rivalId = useMemo(() => {
    if (currentUserHandicap == null || !friends) return null;
    let minGap = Infinity;
    let rid: string | null = null;
    for (const f of friends) {
      if (f.friend_handicap_index === null) continue;
      const gap = Math.abs(f.friend_handicap_index - currentUserHandicap);
      if (gap > 0 && gap < minGap) {
        minGap = gap;
        rid = f.friend_row_id;
      }
    }
    return rid;
  }, [friends, currentUserHandicap]);

  const subText = useMemo(() => {
    if (isLoading) return 'Loading…';
    if (totalCount === 0) return undefined;
    if (currentUserHandicap == null) return `${friends?.length ?? 0} friends`;
    if (yourRank === 1) return `#1 of ${totalCount} · ${totalCount - 1} chasing you`;
    return `${friends?.length ?? 0} friends · you're #${yourRank}`;
  }, [isLoading, totalCount, currentUserHandicap, yourRank, friends]);

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

  if (scope !== 'all') {
    return (
      <section style={{ padding: '20px 0 24px' }}>
        <SectionHeader eyebrow="LEADERBOARD" title="Friends" sub={subText} />
        <LeaderboardScopeChips scope={scope} onChange={setScope} />
        <EmptyScopeState scope={scope} />
      </section>
    );
  }

  return (
    <section style={{ padding: '20px 0 24px' }}>
      <SectionHeader eyebrow="LEADERBOARD" title="Friends" sub={subText} />
      <LeaderboardScopeChips scope={scope} onChange={setScope} />

      <PodiumStack
        slots={[
          podium[1] ?? null,
          podium[0] ?? null,
          podium[2] ?? null,
        ]}
        rivalId={rivalId}
        currentUserName={currentUserName}
      />

      <Paged8
        items={rest}
        ariaLabel="Friends ranked 4 onwards"
        pinnedItem={yourRankIndex >= 3 && selfRow ? selfRow : null}
        pinnedRenderer={(item) => (
          <LeaderboardRow
            item={item}
            rank={yourRank}
            isPinned
            isRival={false}
            onClick={() => {}}
          />
        )}
        renderItem={(item, absoluteIndex) => {
          const onClick = () => {
            if (item.kind === 'self') return;
            if (item.friend.is_clbhouz_user && item.friend.friend_user_id) {
              navigate(`/p/${item.friend.friend_user_id}`);
            } else {
              handleInvite(item.friend);
            }
          };
          return (
            <LeaderboardRow
              item={item}
              rank={absoluteIndex + 4}
              isRival={item.kind === 'friend' && item.friend.friend_row_id === rivalId}
              onClick={onClick}
            />
          );
        }}
      />
    </section>
  );
};

export default FriendsLeaderboardV2;
