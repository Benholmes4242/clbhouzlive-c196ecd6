import React, { useMemo } from 'react';
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

/** SCREEN 5 - DONE. The screen-1 card, now carrying real figures. */
export const WelcomeAboardScreen: React.FC<Props> = ({
  handicapIndex,
  connectionId,
  onContinue,
}) => {
  const { data: counts } = useImportedCounts(connectionId);
  const { data: history } = useHandicapHistory(connectionId ?? undefined, 'all');

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
