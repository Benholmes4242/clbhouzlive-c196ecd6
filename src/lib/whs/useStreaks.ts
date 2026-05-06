import { useMemo } from 'react';
import { useAllScores } from './hooks';

export interface StreakResult {
  current: number;
  best: number;
  bestEndedAt: string | null;
  isActive: boolean;
}

export interface StreaksData {
  noUp: StreakResult;
  cutting: StreakResult;
  counter: StreakResult;
  timeline: Array<{
    id: string;
    play_date: string;
    delta: number | null;
    is_counter: boolean;
    isUp: boolean;
  }>;
}

type Rd = {
  id: string;
  play_date: string;
  is_counter: boolean;
  delta: number | null;
};

const noUpPredicate = (d: number | null) => d == null || d <= 0.005;
const cuttingPredicate = (d: number | null) => d != null && d < -0.005;

function runStats(
  rounds: Rd[],
  predicate: (d: number | null, r: Rd) => boolean,
): StreakResult {
  let current = 0;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (predicate(rounds[i].delta, rounds[i])) current++;
    else break;
  }
  let best = 0;
  let bestEnd: string | null = null;
  let run = 0;
  let runEnd: string | null = null;
  for (let i = 0; i < rounds.length; i++) {
    if (predicate(rounds[i].delta, rounds[i])) {
      run++;
      runEnd = rounds[i].play_date;
    } else {
      if (run > best) {
        best = run;
        bestEnd = runEnd;
      }
      run = 0;
    }
  }
  if (run > best) {
    best = run;
    bestEnd = runEnd;
  }
  return {
    current,
    best,
    bestEndedAt: best === current ? null : bestEnd,
    isActive: current >= 1,
  };
}

export function useStreaks(connectionId: string | undefined) {
  const { data: scores, isLoading } = useAllScores(connectionId);

  const data: StreaksData | null = useMemo(() => {
    if (!scores || scores.length === 0) return null;
    const chrono = [...scores].reverse();
    const withDeltas: Rd[] = chrono.map((s, i) => {
      const prev = i > 0 ? chrono[i - 1].handicap_index_at_time : null;
      const curr = s.handicap_index_at_time;
      const delta = prev != null && curr != null ? curr - prev : null;
      return {
        id: s.id,
        play_date: s.play_date,
        is_counter: s.is_counter,
        delta,
      };
    });

    const timeline = withDeltas.slice(-12).map((s) => ({
      id: s.id,
      play_date: s.play_date,
      delta: s.delta,
      is_counter: s.is_counter,
      isUp: s.delta != null && s.delta > 0.005,
    }));

    return {
      noUp: runStats(withDeltas, (d) => noUpPredicate(d)),
      cutting: runStats(withDeltas, (d) => cuttingPredicate(d)),
      counter: runStats(withDeltas, (_d, r) => r.is_counter),
      timeline,
    };
  }, [scores]);

  return { data, isLoading, totalRounds: scores?.length ?? 0 };
}
