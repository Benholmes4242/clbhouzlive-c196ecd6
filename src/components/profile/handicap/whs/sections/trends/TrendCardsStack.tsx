import React from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import HandicapProjectionCard from './HandicapProjectionCard';
import StablefordCard from './StablefordCard';
import CourseFormCard from './CourseFormCard';

interface Props {
  connectionId: string;
  currentHandicap: number | null | undefined;
}

export const TrendCardsStack: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);

  return (
    <section style={{ padding: '0 20px', marginBottom: 28 }}>
      <SectionHeader
        eyebrow="Your Form"
        title="The numbers behind your handicap"
        sub="Three signals that explain your trajectory"
      />
      {isLoading ? (
        [420, 320, 360].map((h, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: h,
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
          <CourseFormCard connectionId={connectionId} currentHandicap={currentHandicap} />
        </>
      )}
    </section>
  );
};

export default TrendCardsStack;
