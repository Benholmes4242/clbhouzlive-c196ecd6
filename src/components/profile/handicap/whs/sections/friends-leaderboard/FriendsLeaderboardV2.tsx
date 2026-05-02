import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useAllScores,
  useFriendsLeaderboard,
  useFriendWindowRankings,
  whsKeys,
} from '@/lib/whs/hooks';
import { computeSelfRanking } from './computeSelfRanking';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import type { WhsFriendMatch, WhsFriendWindowRanking } from '@/lib/whs/types';
import {
  getAvgDiffForScope,
  type LeaderboardScope,
} from '@/lib/whs/utils/leaderboardScopes';
import SectionHeader from '../SectionHeader';
import Paged8 from '../_shared/Paged8';
import LeaderboardScopeChips from './LeaderboardScopeChips';
import LeaderboardRow from './LeaderboardRow';
import PodiumStack from './PodiumStack';
import EmptyScopeState from './EmptyScopeState';

interface Props {
  ownerUserId: string;
  currentUserHandicap: number | null | undefined;
  currentUserName?: string;
  connectionId: string;
}

export type LeaderboardItem =
  | {
      id: 'self';
      kind: 'self';
      handicap: number | null;
      name: string;
      rankingValue: number | null;
    }
  | {
      id: string;
      kind: 'friend';
      friend: WhsFriendMatch;
      rankingValue: number | null;
    };

export const FriendsLeaderboardV2: React.FC<Props> = ({
  ownerUserId,
  currentUserHandicap,
  currentUserName = 'You',
  connectionId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: friends, isLoading } = useFriendsLeaderboard(ownerUserId);
  const { data: windowRankings, isLoading: rankingsLoading } =
    useFriendWindowRankings(ownerUserId);
  const { data: ownScores } = useAllScores(connectionId);

  const [scope, setScope] = useState<LeaderboardScope>('all');

  const rankingByRowId = useMemo(() => {
    const map = new Map<string, WhsFriendWindowRanking>();
    for (const r of windowRankings ?? []) {
      map.set(r.friend_row_id, r);
    }
    return map;
  }, [windowRankings]);

  const rows: LeaderboardItem[] = useMemo(() => {
    const friendRows: LeaderboardItem[] = (friends ?? []).map((f) => {
      if (scope === 'all') {
        return {
          id: f.friend_row_id,
          kind: 'friend' as const,
          friend: f,
          rankingValue: f.friend_handicap_index ?? null,
        };
      }
      const r = rankingByRowId.get(f.friend_row_id);
      return {
        id: f.friend_row_id,
        kind: 'friend' as const,
        friend: f,
        rankingValue: getAvgDiffForScope(r, scope),
      };
    });

    let selfRanking: number | null;
    if (scope === 'all') {
      selfRanking = currentUserHandicap ?? null;
    } else {
      selfRanking = computeSelfRanking(scope, ownScores).avgDiff;
    }

    const selfRow: LeaderboardItem = {
      id: 'self',
      kind: 'self',
      handicap: scope === 'all' ? (currentUserHandicap ?? null) : null,
      name: currentUserName,
      rankingValue: selfRanking,
    };

    const visible =
      scope === 'all'
        ? [...friendRows, selfRow]
        : [...friendRows.filter((r) => r.rankingValue !== null), selfRow];

    visible.sort((a, b) => {
      const av = a.rankingValue ?? 999;
      const bv = b.rankingValue ?? 999;
      return av - bv;
    });

    return visible;
  }, [friends, currentUserHandicap, currentUserName, scope, rankingByRowId, ownScores]);

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
    if (isLoading || (scope !== 'all' && rankingsLoading)) return 'Loading…';
    if (totalCount === 0) return undefined;

    const friendCount = rows.filter((r) => r.kind === 'friend').length;

    if (scope === 'all') {
      if (currentUserHandicap == null) return `${friendCount} friends`;
      if (yourRank === 1) return `#1 of ${totalCount} · ${totalCount - 1} chasing you`;
      return `${friendCount} friends · you're #${yourRank}`;
    }

    return `${friendCount} ${friendCount === 1 ? 'friend' : 'friends'} · ranked by avg differential`;
  }, [isLoading, rankingsLoading, totalCount, currentUserHandicap, yourRank, rows, scope]);

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

  // Time-scoped empty state: nobody (including self) qualifies
  const hasAnyRanking = rows.some(
    (r) => r.rankingValue !== null && r.rankingValue !== undefined,
  );

  if (
    scope !== 'all' &&
    !rankingsLoading &&
    !hasAnyRanking
  ) {
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
