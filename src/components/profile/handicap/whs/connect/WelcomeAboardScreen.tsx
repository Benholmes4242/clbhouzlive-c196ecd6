import React, { useEffect, useMemo, useState } from 'react';
import { GOOD } from './designTokens';
import { PrimaryButton, FooterBar, FlowBody, FlowHead } from './Primitives';
import { useImportedCounts } from './useImportedCounts';
import { useHandicapHistory } from '@/lib/whs/hooks';
import HandicapCard from './HandicapCard';

interface Props {
  firstName: string;
  handicapIndex: number | null;
  homeClub: string | null;
  /** Legacy server figures - retained for API compatibility, not displayed. */
  scoresImported?: number;
  friendsImported?: number;
  connectionId?: string | null;
  onContinue: () => void;
}

const YEAR = 365 * 86400_000;

/**
 * Ceiling on the pending state. useImportedCounts polls forever, so the screen
 * owns the end of waiting: after this the counters settle to the em dash (the
 * honest "we cannot read a figure" state) rather than shimmering indefinitely.
 */
const PENDING_CEILING_MS = 45_000;

/** SCREEN 5 - DONE. The screen-1 card, now carrying real figures. */
export const WelcomeAboardScreen: React.FC<Props> = ({
  handicapIndex,
  connectionId,
  onContinue,
}) => {
  const { data: counts, isFetching: countsFetching } = useImportedCounts(connectionId);
  const { data: history, isFetching: historyFetching } = useHandicapHistory(
    connectionId ?? undefined,
    'all',
  );

  const [ceilingHit, setCeilingHit] = useState(false);
  useEffect(() => {
    if (counts) return;
    const t = setTimeout(() => setCeilingHit(true), PENDING_CEILING_MS);
    return () => clearTimeout(t);
  }, [counts]);

  /* UNRESOLVED IS NOT ABSENT: pending while the source has not settled - the
     connection id is not known yet, or the counts query is still polling. */
  const countersPending =
    !ceilingHit && !counts && (!connectionId || countsFetching || historyFetching || !history);


  const { values, delta, years } = useMemo(() => {
    const pts = (history ?? []).filter((p) => Number.isFinite(p.handicap_index));
    if (pts.length === 0) return { values: [] as number[], delta: null as number | null, years: null as number | null };

    const first = new Date(pts[0].observed_at).getTime();
    const last = new Date(pts[pts.length - 1].observed_at).getTime();
    const spanYears = Math.max(1, Math.round((last - first) / YEAR));

    // Delta only exists with a full 12 months behind the member.
    const cutoff = Date.now() - YEAR;
    const hasYear = first <= cutoff;
    const oldest = pts.find((p) => new Date(p.observed_at).getTime() >= cutoff) ?? pts[0];
    const current = handicapIndex ?? pts[pts.length - 1].handicap_index;
    const d = hasYear ? Number((current - oldest.handicap_index).toFixed(1)) : null;

    // Cap the series so the line stays readable at 118px wide.
    const tail = pts.slice(-40).map((p) => p.handicap_index);
    return { values: tail, delta: d, years: spanYears };
  }, [history, handicapIndex]);

  const headline =
    years && years > 1 ? `${years} years of golf, all here.` : 'Your record is all here.';

  return (
    <>
      <FlowBody>
        <FlowHead
          kicker="Connected"
          kickerColor={GOOD}
          headline={headline}
          sub="Nothing else to do - your index and your rounds move on their own from here."
        />

        <div style={{ marginTop: 22 }}>
          <HandicapCard
            kicker="Your profile"
            kickerColor={GOOD}
            index={handicapIndex}
            delta={delta}
            values={values}
            counters={{
              rounds: counts?.rounds ?? null,
              courses: counts?.courses ?? null,
              years,
            }}
            replayKey={`${values.length}-${handicapIndex ?? 'na'}`}
          />
        </div>
      </FlowBody>

      <FooterBar>
        <PrimaryButton onClick={onContinue}>See my handicap</PrimaryButton>
      </FooterBar>
    </>
  );
};

export default WelcomeAboardScreen;
