import React from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import StablefordCard from './StablefordCard';

/**
 * TrendCardsStack — after Part F this stack carries exactly one child.
 *
 * The old form hero, LastFiveTokens and HandicapProjectionCard were the
 * `splitAt !== 'rest'` half of this component. Form only ever mounted it with
 * splitAt="rest", and the verdict itself now lives on Today inside
 * NextRoundWatch (C3 amendment), so that half was unreachable and is gone
 * along with both of its cards. `splitAt` is retained on the props for call-site
 * compatibility but no longer branches.
 */
interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null | undefined;
  /** Retained for call-site compatibility. No longer branches. */
  splitAt?: 'hero-only' | 'rest';
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const TrendCardsStack: React.FC<Props> = ({ connectionId, userId }) => {
  const { data: scores, isLoading } = useAllScores(connectionId);

  return (
    <section style={{ padding: '0 16px', marginTop: 32, fontFamily: FONT }}>
      {isLoading ? (
        <Skeleton variant="dark" style={{ height: 420, borderRadius: 16, marginBottom: 12 }} />
      ) : (
        <StablefordCard scores={scores ?? []} userId={userId} connectionId={connectionId} />
      )}
    </section>
  );
};

export default TrendCardsStack;
