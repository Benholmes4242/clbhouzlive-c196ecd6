import React from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import HandicapProjectionCard from './HandicapProjectionCard';
import StablefordCard from './StablefordCard';

interface Props {
  connectionId: string;
}

export const TrendCardsStack: React.FC<Props> = ({ connectionId }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);

  return (
    <section style={{ padding: '0 20px', marginBottom: 28 }}>
      <SectionHeader
        eyebrow="Your Form"
        title="The numbers behind your handicap"
        sub="Two signals that explain your trajectory"
      />
      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: i === 0 ? 420 : 320,
              background: 'rgba(15,23,42,0.04)',
              borderRadius: 16,
              marginBottom: 14,
            }}
          />
        ))
      ) : (
        <>
          <HandicapProjectionCard scores={scores ?? []} />
          <StablefordCard scores={scores ?? []} />
        </>
      )}
    </section>
  );
};

export default TrendCardsStack;
