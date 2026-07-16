import type { FriendRivalryHydrated } from '@/lib/whs/types';

export type H2HState =
  | { kind: 'empty'; duelsCount: 0 }
  | {
      kind: 'duelsOnly';
      duelsCount: number;
      lastDuel: { courseName: string; relativeTime: string } | null;
    }
  | {
      kind: 'full';
      duelsCount: number;
      yourWins: number;
      theirWins: number;
      ties: number;
      streak: { side: 'you' | 'them'; count: number } | null;
      lastDuel: { courseName: string; relativeTime: string } | null;
    };

interface Input {
  sharedRounds: number;
  rivalry: FriendRivalryHydrated | undefined;
}

export function deriveH2HState({ sharedRounds, rivalry }: Input): H2HState {
  const rivalryDuels = rivalry?.shared_rounds_count ?? 0;

  if (sharedRounds === 0 && rivalryDuels === 0) {
    return { kind: 'empty', duelsCount: 0 };
  }

  const lastDuel = (() => {
    const rounds = rivalry?.shared_round_results ?? [];
    if (rounds.length === 0) return null;
    const sorted = [...rounds].sort((a, b) =>
      b.play_date.localeCompare(a.play_date),
    );
    const r = sorted[0];
    return { courseName: r.course_name, relativeTime: fmtRelative(r.play_date) };
  })();

  if (rivalry && rivalryDuels > 0 && rivalry.stableford_record) {
    const rec = rivalry.stableford_record;
    return {
      kind: 'full',
      duelsCount: rivalryDuels,
      yourWins: rec.wins,
      theirWins: rec.losses,
      ties: rec.ties,
      streak: deriveStreak(rivalry.shared_round_results),
      lastDuel,
    };
  }

  return {
    kind: 'duelsOnly',
    duelsCount: rivalryDuels || sharedRounds,
    lastDuel,
  };
}

function deriveStreak(
  rounds: FriendRivalryHydrated['shared_round_results'],
): { side: 'you' | 'them'; count: number } | null {
  if (!rounds?.length) return null;
  const sorted = [...rounds].sort((a, b) =>
    b.play_date.localeCompare(a.play_date),
  );
  const first = sorted[0].stableford_outcome;
  if (first === 'T') return null;
  let count = 0;
  for (const r of sorted) {
    if (r.stableford_outcome === first) count++;
    else break;
  }
  return { side: first === 'W' ? 'you' : 'them', count };
}

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 7)}w ago`;
  return formatMonthDay2ShortGB(new Date(iso));
}


export function shortCourseName(name: string): string {
  return name
    .replace(' Golf Club', '')
    .replace(' Course', '')
    .replace('Sundridge Park-East', 'Sundridge East')
    .replace('Sundridge Park-West', 'Sundridge West')
    .replace(/^The /, '');
}
