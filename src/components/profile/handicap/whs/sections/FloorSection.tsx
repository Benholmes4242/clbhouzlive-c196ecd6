/**
 * FloorSection — PHASE 6 "THE FLOOR, AND THE RECORDS" of
 * BRIEF_HANDICAP_TAB_REBUILD.
 *
 * §6.2: the target is the next rung of FLOOR_LADDER still BELOW the member's
 * current index (24 → bogey golf, 15 → single figures, 7 → category one,
 * 2 → scratch). At or below scratch there is no rung left and the section
 * does not render — scratch is the wrong target for most members and a
 * section that only speaks to low handicaps is worse than no section.
 *
 * §6.3: the scale runs from the member's TWELVE-MONTH HIGH on the left to
 * the TARGET on the right — not to zero unless zero is the target.
 *
 * §6.6: NO TIME PROJECTION. The design's "at your twelve-month rate that is
 * about fourteen months" straight-lines improvement to zero; improvement
 * decelerates sharply near the floor. The section states the distance and
 * the requirement, which are true, and stops.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAllScores, useHandicapHistory } from '@/lib/whs/hooks';
import { counterWindow } from '@/lib/whs/counting';
import { grossFromDifferential } from '@/lib/whs/coursePlay';
import { countMeeting, floorScalePosition, floorTarget } from '@/lib/whs/floor';
import type { WhsConnection } from '@/lib/whs/types';
import { A } from '@/features/courses/components/holes/analytical/tokens';

import { HcpSection } from './HcpSection';
import { CHART } from '../charts';
import { pickCourse } from '@/lib/whs/pickCourse';

const MS_PER_DAY = 86_400_000;

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

/** §6.3: figures above the scale at 13/800 tabular. */
const SCALE_FIG: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: CHART.INK,
  ...FIG,
};

/** §6.3: labels beneath at 9/700/0.1em uppercase DIM. */
const SCALE_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: CHART.DIM,
  marginTop: 5,
};

interface Props {
  connection: WhsConnection;
  currentHandicap: number | null;
}

export const FloorSection: React.FC<Props> = ({ connection, currentHandicap }) => {
  const { t } = useTranslation(['common']);
  const { data: history, isLoading } = useHandicapHistory(connection.id, 'all');
  const { data: scores } = useAllScores(connection.id);

  /* §6.3: the twelve-month high is the index IN FORCE across the last twelve
     months — the same derivation as IndexSection's range row: the last
     observation at or before the window start, plus every observation
     inside. */
  const high12m = useMemo(() => {
    const all = (history ?? [])
      .map((p) => ({ ts: new Date(p.observed_at).getTime(), v: Number(p.handicap_index) }))
      .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.v))
      .sort((a, b) => a.ts - b.ts);
    if (all.length === 0) return null;
    const start = Date.now() - 365 * MS_PER_DAY;
    const before = all.filter((p) => p.ts <= start);
    const vals = [
      ...(before.length ? [before[before.length - 1].v] : []),
      ...all.filter((p) => p.ts > start).map((p) => p.v),
    ];
    return vals.length ? Math.max(...vals) : null;
  }, [history]);

  if (isLoading) return null;
  if (currentHandicap == null || high12m == null) return null;

  const rung = floorTarget(currentHandicap);
  if (!rung) return null; // §6.2: at or below scratch there is no rung left.

  const milestone = t(`common:handicap.floor.milestone.${rung.key}`);
  const pos = floorScalePosition(high12m, rung.index, currentHandicap);

  /* §6.4: eight differentials averaging the target, the gross that is at the
     member's most-played course, and how many of the last twenty already
     meet it. All derived. */
  const window20 = scores ? counterWindow(scores) : [];
  const diffs = window20
    .map((r) => r.handicap_differential)
    .filter((d): d is number => d != null && Number.isFinite(d));
  const met = countMeeting(diffs, rung.index);
  const course = window20.length ? pickCourse(window20) : null;
  const gross = course
    ? Math.round(grossFromDifferential(rung.index, course.cr, course.slope))
    : null;

  const distance = Math.max(0, currentHandicap - rung.index).toFixed(1);

  return (
    <HcpSection
      hairline
      kicker={<span style={{ color: CHART.AMBER }}>{t('common:handicap.floor.kicker')}</span>}
      heading={t('common:handicap.floor.title', { milestone })}
    >
      {/* §6.3: the scale — high on the left, target on the right. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={SCALE_FIG}>{high12m.toFixed(1)}</span>
        <span style={SCALE_FIG}>{currentHandicap.toFixed(1)}</span>
        <span style={SCALE_FIG}>{rung.index.toFixed(1)}</span>
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 8,
          height: 6,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${CHART.UP} 0%, ${CHART.AMBER} 55%, ${CHART.DOWN} 100%)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${pos * 100}%`,
            top: '50%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: CHART.INK,
            border: '2px solid var(--hcp-bg-0)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={SCALE_LABEL}>{t('common:handicap.floor.scaleHigh')}</span>
        <span style={{ ...SCALE_LABEL, textAlign: 'center' }}>{t('common:handicap.floor.scaleToday')}</span>
        <span style={{ ...SCALE_LABEL, textAlign: 'right' }}>{milestone}</span>
      </div>

      {/* §6.4: the requirement, derived. */}
      <p style={{ margin: '16px 0 0', fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: A.BODY, ...FIG }}>
        {gross != null && course
          ? t('common:handicap.floor.body', {
              target: rung.index.toFixed(1),
              gross,
              course: course.name,
              met,
            })
          : t('common:handicap.floor.bodyNoCourse', {
              target: rung.index.toFixed(1),
              met,
            })}
      </p>

      {/* §6.5: the distance. §6.6: and nothing more — no time projection. */}
      <p style={{ margin: '10px 0 0', fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: CHART.MUTE, ...FIG }}>
        {t('common:handicap.floor.distance', { n: distance })}
      </p>
    </HcpSection>
  );
};

export default FloorSection;
