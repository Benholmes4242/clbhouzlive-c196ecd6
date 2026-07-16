import type { FriendHybridSnapshot } from '@/lib/whs/hooks/useFriendHybridSnapshot';
import type { FriendLeaderboardEntry, FriendRivalryHydrated } from '@/lib/whs/types';
import { formatMonthDay2ShortGB } from '@/i18n/format';


export type SheetState =
  | {
      kind: 'clbhouz_synced_full';
      firstName: string;
      rivalry: FriendRivalryHydrated;
    }
  | {
      kind: 'clbhouz_synced_duelsOnly';
      firstName: string;
      sharedRounds: number;
      lastDuel: { courseName: string; relativeTime: string } | null;
    }
  | { kind: 'clbhouz_synced_empty'; firstName: string }
  | { kind: 'clbhouz_not_synced'; firstName: string }
  | {
      kind: 'whs_only';
      firstName: string;
      entry: FriendLeaderboardEntry;
    };

function first(name: string | null | undefined): string {
  if (!name) return 'this golfer';
  return name.trim().split(/\s+/)[0] || 'this golfer';
}

export function deriveSheetStateFromSnapshot(input: {
  snapshot: FriendHybridSnapshot;
  rivalry: FriendRivalryHydrated | undefined;
}): SheetState {
  const { snapshot, rivalry } = input;
  const firstName = first(snapshot.profile.display_name ?? snapshot.profile.username);

  // The snapshot RPC is only ever called for clbhouz users — targetUserId is
  // always a clbhouz user_id. The whs_only state is produced by the WHS-only
  // path which builds a SheetState directly from a FriendLeaderboardEntry.
  if (!snapshot.handicap.is_synced) {
    return { kind: 'clbhouz_not_synced', firstName };
  }

  const rivalryDuels = rivalry?.shared_rounds_count ?? 0;
  if (rivalry && rivalryDuels > 0 && rivalry.stableford_record) {
    return { kind: 'clbhouz_synced_full', firstName, rivalry };
  }

  if (snapshot.handicap.shared_rounds > 0) {
    const lastDuel = (() => {
      const rounds = rivalry?.shared_round_results ?? [];
      if (!rounds.length) return null;
      const sorted = [...rounds].sort((a, b) =>
        b.play_date.localeCompare(a.play_date),
      );
      const r = sorted[0];
      return {
        courseName: r.course_name,
        relativeTime: fmtRelative(r.play_date),
      };
    })();
    return {
      kind: 'clbhouz_synced_duelsOnly',
      firstName,
      sharedRounds: snapshot.handicap.shared_rounds,
      lastDuel,
    };
  }

  return { kind: 'clbhouz_synced_empty', firstName };
}

export function deriveSheetStateFromWhsEntry(
  entry: FriendLeaderboardEntry,
): SheetState {
  return {
    kind: 'whs_only',
    firstName: first(entry.friend_name),
    entry,
  };
}

function fmtRelative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 7)}w ago`;
  return formatMonthDay2ShortGB(new Date(iso));
}

