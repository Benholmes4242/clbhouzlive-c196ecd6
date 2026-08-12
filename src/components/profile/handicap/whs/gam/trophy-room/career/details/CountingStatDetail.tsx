/**
 * Counting stat detail: the count, the thresholds, where it happened, and the
 * round that holds the most of it. Every line is traceable to a row in
 * gam_round_stats -- nothing here is asserted.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { REC } from '../tokens';
import { Panel, BackLink, Kicker, Caption, Figure, Bar, MetaLabel, RowButton } from '../Primitives';
import { measuredShare } from '../shareModel';
import { dayMonthYear, monthYear, plural } from '../format';
import {
  courseSplitFor,
  bestRoundFor,
  roundMetricForCounter,
} from '@/hooks/gam/useCareerRounds';
import RoundDetailSheet from '../../../../sections/round-detail/RoundDetailSheet';
import type { Achievement, CareerData } from '../types';

interface Props {
  data: CareerData;
  item: Achievement;
  onBack: () => void;
}

export const CountingStatDetail: React.FC<Props> = ({ data, item, onBack }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('handicap');
  const [roundId, setRoundId] = useState<string | null>(null);
  const metric = roundMetricForCounter(item.counterMetric);
  const value = item.currentValue ?? 0;
  const share = measuredShare(data.shares.get(item.badgeId), data.config.shareMinDenominator);

  const split = useMemo(
    () => (metric ? courseSplitFor(data.rounds, metric).slice(0, 6) : []),
    [data.rounds, metric],
  );
  const best = useMemo(
    () => (metric ? bestRoundFor(data.rounds, metric) : null),
    [data.rounds, metric],
  );
  const topCount = split.length > 0 ? split[0].count : 0;

  return (
    <div style={{ fontFamily: REC.FONT }}>
      <BackLink label="Back to the record" onClick={onBack} />
      <Kicker>{item.category.toUpperCase()}</Kicker>
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '12px 0 4px' }}>
        <Figure value={value} size={40} color={value > 0 ? REC.AMBER : REC.DIM} />
        <span style={{ fontSize: 12.5, color: REC.MUTE }}>{item.description}</span>
      </div>
      {/* Omitted entirely when earned_at is null. No placeholder. */}
      {monthYear(item.earnedAt) ? (
        <Caption>{t('career.mostRecent', { when: monthYear(item.earnedAt) })}</Caption>
      ) : null}
      {share !== null && (
        <Caption>
          <span style={{ color: REC.GOOD, fontWeight: 700 }}>
            Held by {share}% of members with a posted index
          </span>
        </Caption>
      )}

      <div style={{ height: 12 }} />

      <Panel title="THRESHOLDS">
        {item.tiers.map((tier, i) => (
          <div
            key={tier.tier}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderBottom: i === item.tiers.length - 1 ? 'none' : `1px solid ${REC.BORDER}`,
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: tier.earned ? 700 : 600,
                color: tier.earned ? REC.INK : REC.MUTE,
                ...REC.TABULAR,
              }}
            >
              {tier.threshold}
            </span>
            {/* These rows are on the LABEL treatment, so the sentence-case
                locale value is uppercased in CSS rather than in the string. */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: tier.earned ? REC.AMBER : REC.DIM,
                ...REC.TABULAR,
              }}
            >
              {tier.earned
                ? t('career.achieved')
                : t('career.toGoTo', {
                    n: Math.max(0, tier.threshold - value),
                    target: tier.threshold,
                  })}
            </span>
          </div>
        ))}
      </Panel>

      {split.length > 0 && (
        <Panel title="WHERE">
          {split.map((row, i) => (
            <RowButton
              key={`${row.courseId}-${row.courseName}`}
              last={i === split.length - 1}
              onClick={
                row.courseId
                  ? () => {
                      navigate(`/courses/${row.courseId}`);
                    }
                  : undefined
              }
              ariaLabel={`${row.courseName}, ${row.count}`}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    color: REC.INK,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.courseName}
                </span>
                <Figure value={row.count} size={15} />
              </div>
              <div style={{ marginTop: 6 }}>
                <Bar pct={topCount > 0 ? (row.count / topCount) * 100 : 0} />
              </div>
            </RowButton>
          ))}
        </Panel>
      )}

      {best && metric && (
        <Panel title="BEST ROUND">
          <RowButton onClick={() => setRoundId(best.whs_score_id)} last>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: REC.INK }}>
                {best.course_name ?? 'A course'}
              </span>
              <Figure value={Number(best[metric] ?? 0)} size={17} color={REC.AMBER} />
            </div>
            {/* Separator is a middle dot in the OUTPUT, written as an ASCII
                escape in the locale value. Never "--" in rendered prose. */}
            <div style={{ marginTop: 4, fontSize: 11.5, color: REC.MUTE, ...REC.TABULAR }}>
              {best.gross_score
                ? t('career.bestRoundLine', {
                    date: dayMonthYear(best.play_date),
                    gross: best.gross_score,
                  })
                : dayMonthYear(best.play_date)}
            </div>
            <div style={{ marginTop: 8 }}>
              <MetaLabel color={REC.AMBER}>OPEN THE CARD</MetaLabel>
            </div>
          </RowButton>
        </Panel>
      )}

      {!metric && (
        <Caption>
          {plural(value, 'This figure', 'These figures')} come from the round record rather than
          from individual holes, so there is no per-course split to show.
        </Caption>
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

export default CountingStatDetail;
