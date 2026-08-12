/**
 * Milestone detail: the fact, when it happened, how many members share it,
 * and the round that did it.
 *
 * Where no round can be matched the view says so instead of inventing one --
 * milestones earned before hole-by-hole scoring arrived genuinely have no
 * traceable card.
 */
import React, { useMemo, useState } from 'react';
import { REC } from '../tokens';
import { Panel, BackLink, Kicker, Caption, Figure, RowButton, MetaLabel } from '../Primitives';
import { measuredShare } from '../shareModel';
import { dayMonthYear, monthYear } from '../format';
import { milestoneRoundFor } from '@/hooks/gam/useCareerRounds';
import RoundDetailSheet from '../../../../sections/round-detail/RoundDetailSheet';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  item: Achievement;
  onBack: () => void;
}

export const MilestoneDetail: React.FC<Props> = ({ data, item, onBack }) => {
  const [roundId, setRoundId] = useState<string | null>(null);
  const share = measuredShare(data.shares.get(item.badgeId), data.config.shareMinDenominator);
  const round = useMemo(
    () => (item.earned ? milestoneRoundFor(data.rounds, item.badgeId) : null),
    [data.rounds, item.badgeId, item.earned],
  );

  return (
    <div style={{ fontFamily: REC.FONT }}>
      <BackLink label="Back to the record" onClick={onBack} />
      <Kicker>{item.earned ? 'REACHED' : 'NOT YET REACHED'}</Kicker>
      <h3
        style={{
          margin: '8px 0 0',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: REC.INK,
        }}
      >
        {item.name}
      </h3>
      <div style={{ marginTop: 10 }}>
        <Caption>{item.description}</Caption>
      </div>
      {item.earned && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12 }}>
          <Figure value={monthYear(item.earnedAt) || 'ON THE RECORD'} size={20} color={REC.AMBER} />
        </div>
      )}
      {share !== null && item.earned && (
        <div style={{ marginTop: 6 }}>
          <Caption>
            <span style={{ color: REC.GOOD, fontWeight: 700 }}>
              Held by {share}% of members with a posted index
            </span>
          </Caption>
        </div>
      )}

      <div style={{ height: 12 }} />

      {item.earned && (
        <Panel title="THE ROUND">
          {round ? (
            <RowButton onClick={() => setRoundId(round.whs_score_id)} last>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                  style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: REC.INK }}
                >
                  {round.course_name ?? 'A course'}
                </span>
                {round.gross_score ? (
                  <Figure value={round.gross_score} size={17} color={REC.AMBER} />
                ) : null}
              </div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: REC.MUTE, ...REC.TABULAR }}>
                {dayMonthYear(round.play_date)}
              </div>
              <div style={{ marginTop: 8 }}>
                <MetaLabel color={REC.AMBER}>OPEN THE CARD</MetaLabel>
              </div>
            </RowButton>
          ) : (
            <div style={{ padding: 14 }}>
              <Caption>
                No card can be matched to this one. It was reached before hole-by-hole scoring was
                on the record.
              </Caption>
            </div>
          )}
        </Panel>
      )}

      {!item.earned && (
        <Panel>
          <div style={{ padding: 14 }}>
            <Caption>
              {data.isFriendView
                ? 'Not on the record yet.'
                : 'Not on the record yet. It lands the round it happens.'}
            </Caption>
          </div>
        </Panel>
      )}

      <RoundDetailSheet
        open={Boolean(roundId)}
        onClose={() => setRoundId(null)}
        scoreId={roundId}
        profileUserId={data.ownerUserId}
      />
    </div>
  );
};

export default MilestoneDetail;
