import React, { useMemo, useState } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import TrendCard from './TrendCard';
import HandicapProjectionCard from './HandicapProjectionCard';
import { computeMetric } from './computeTrends';
import type { TrendRange } from './types';

interface Props {
  connectionId: string;
}

interface RangesState {
  stableford: TrendRange;
  counter_rate: TrendRange;
}

const DEFAULT_RANGES: RangesState = {
  stableford: '1m',
  counter_rate: '6m',
};

export const TrendCardsStack: React.FC<Props> = ({ connectionId }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);
  const [ranges, setRanges] = useState<RangesState>(DEFAULT_RANGES);

  const metrics = useMemo(() => {
    if (!scores) return null;
    return {
      stableford: computeMetric('stableford', ranges.stableford, scores),
      counter_rate: computeMetric('counter_rate', ranges.counter_rate, scores),
    };
  }, [scores, ranges]);

  return (
    <section style={{ padding: '0 20px', marginBottom: 28 }}>
      <SectionHeader
        eyebrow="Your Form"
        title="The numbers behind your handicap"
        sub="Three signals that explain your trajectory"
      />
      {isLoading || !metrics ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: i === 0 ? 420 : 220,
              background: 'rgba(15,23,42,0.04)',
              borderRadius: 16,
              marginBottom: 14,
            }}
          />
        ))
      ) : (
        <>
          <HandicapProjectionCard scores={scores ?? []} />
          <TrendCard
            metric={metrics.stableford}
            range={ranges.stableford}
            onRangeChange={(r) => setRanges((s) => ({ ...s, stableford: r }))}
          />
          <TrendCard
            metric={metrics.counter_rate}
            range={ranges.counter_rate}
            onRangeChange={(r) => setRanges((s) => ({ ...s, counter_rate: r }))}
          />
        </>
      )}
    </section>
  );
};

export default TrendCardsStack;
