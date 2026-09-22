import React from 'react';
import { Medal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { fmtToPar } from '@/components/feed/fmtToPar';
import type { RoundAwardRow, RoundAwardsResult, RoundAwardUnitKind, RoundEffortRow } from '@/hooks/gam/useRoundAwards';
import {
  HAIRLINE_INK_8,
  INK,
  INK_FAINT,
  LIVE_INK,
  MEDAL_BRONZE,
  MEDAL_GOLD,
  MEDAL_SILVER,
  STATUS_LIVE_TINT_10,
} from '@/features/tourhub/_shared/tokens';
import { SANS } from '@/features/courses/components/holes/analytical/tokens';
import { formatOrdinal } from '@/i18n/format';

export interface RoundResultsScope {
  courseName: string;
  roundsHere: number;
  subjectName: string;
  subject: string;
  possessive: string;
  verb: string;
}

const COARSE_UNITS = new Set<RoundAwardUnitKind>([
  'round_gross', 'round_stableford', 'round_diff', 'front_nine', 'back_nine', 'finish_six',
]);
const TO_PAR_UNITS = new Set<RoundAwardUnitKind>(['front_nine', 'back_nine', 'finish_six', 'hole']);

const effortOrder: RoundEffortRow['unit_kind'][] = [
  'round_gross', 'front_nine', 'back_nine', 'finish_six', 'round_stableford',
];

function formatValue(unit: RoundAwardUnitKind, value: number | null): string {
  if (value == null) return '';
  if (TO_PAR_UNITS.has(unit)) return fmtToPar(value);
  if (unit === 'round_gross' || unit === 'round_stableford') return String(Math.round(value));
  return String(value);
}

function unitKey(unit: RoundAwardUnitKind): string {
  return `roundResults.units.${unit}`;
}

function spanKey(unit: RoundEffortRow['unit_kind']): string {
  return `roundResults.spans.${unit}`;
}

function awardUnitKey(unit: RoundAwardUnitKind): string {
  return `roundResults.awardUnits.${unit}`;
}

function medalTone(tier: RoundAwardRow['tier']): string {
  if (tier === 'gold') return MEDAL_GOLD;
  if (tier === 'silver') return MEDAL_SILVER;
  return MEDAL_BRONZE;
}

function placingText(rank: number | null, topTen: boolean, t: (key: string, options?: Record<string, unknown>) => string): string | null {
  if (rank != null) return formatOrdinal(rank);
  if (topTen) return t('roundResults.placing.topTen');
  return null;
}

function awardTitle(award: RoundAwardRow, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (award.unit_kind === 'hole') {
    return t(
      award.award_kind === 'first_birdie' ? 'roundResults.award.firstBirdie' : 'roundResults.award.bestHole',
      { hole: formatOrdinal(award.unit_key) },
    );
  }
  const unit = t(awardUnitKey(award.unit_kind));
  if (award.award_kind === 'matched_best') return t('roundResults.award.matchedBest', { unit });
  if (award.award_kind === 'top_three') return t('roundResults.award.topThree', { unit });
  if (award.award_kind === 'top_ten') return t('roundResults.award.topTen', { unit });
  return t('roundResults.award.best', { unit });
}

function AwardRow({ award }: { award: RoundAwardRow }) {
  const { t } = useTranslation('handicap');
  const previous = award.previous_value == null
    ? null
    : t('roundResults.previous', { value: formatValue(award.unit_kind, award.previous_value) });
  const placing = award.rank_here == null
    ? null
    : award.rank_here === 1
      ? t('roundResults.placing.best')
      : t('roundResults.placing.ordinal', { place: formatOrdinal(award.rank_here), count: award.attempts_at_detection ?? 0 });
  const subline = [previous, placing].filter(Boolean).join(' - ');
  const delta = award.delta == null ? null : formatValue(award.unit_kind, award.value);

  return (
    <div data-round-award={award.unit_kind} style={{ minWidth: 0, display: 'grid', gridTemplateColumns: '22px minmax(0,1fr) auto', alignItems: 'center', gap: 10, padding: '10px 0' }}>
      <span aria-hidden="true" style={{ width: 22, height: 26, borderRadius: 6, display: 'grid', placeItems: 'center', background: medalTone(award.tier), color: INK }}>
        <Medal size={14} strokeWidth={2.25} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: INK, fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{awardTitle(award, t)}</span>
        {subline && <span style={{ display: 'block', color: INK_FAINT, fontSize: 11.5, lineHeight: 1.35, marginTop: 3 }}>{subline}</span>}
      </span>
      {delta && (
        <span style={{ flexShrink: 0, whiteSpace: 'nowrap', borderRadius: 6, padding: '5px 8px', background: STATUS_LIVE_TINT_10, color: LIVE_INK, fontSize: 12.5, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {delta}
        </span>
      )}
    </div>
  );
}

function Block({ title, children, testId }: { title: string; children: React.ReactNode; testId: string }) {
  return (
    <section data-round-results-block={testId} style={{ borderTop: `0.5px solid ${HAIRLINE_INK_8}`, paddingTop: 12 }}>
      <h3 style={{ margin: '0 0 3px', color: INK_FAINT, fontSize: 10, fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase' }}>{title}</h3>
      {children}
    </section>
  );
}

export function RoundResults({ result, scope }: { result: RoundAwardsResult | null | undefined; scope?: RoundResultsScope | null }) {
  const { t } = useTranslation('handicap');
  if (!result) return null;

  const awards = result.awards.filter((award) => COARSE_UNITS.has(award.unit_kind));
  const holes = result.awards.filter((award) => award.unit_kind === 'hole');
  const efforts = effortOrder
    .map((kind) => result.efforts.find((effort) => effort.unit_kind === kind))
    .filter((effort): effort is RoundEffortRow => !!effort);
  if (awards.length === 0 && holes.length === 0 && efforts.length === 0) return null;

  const resultsTable = efforts.length > 0 ? (
    <Block title={t('roundResults.sections.efforts')} testId="efforts">
      <div data-round-efforts-table="true" style={{ minWidth: 0, overflowX: 'clip' }}>
        <div
          data-round-efforts-header="true"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 48px minmax(96px,112px)', alignItems: 'end', gap: 8, paddingBottom: 7 }}
        >
          <span style={{ color: INK_FAINT, fontSize: 8.5, fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase' }}>{t('roundResults.columns.round')}</span>
          <span style={{ color: INK_FAINT, fontSize: 8.5, fontWeight: 700, lineHeight: 1.2, textAlign: 'right', textTransform: 'uppercase' }}>{t('roundResults.columns.score')}</span>
          <span style={{ color: INK_FAINT, fontSize: 8.5, fontWeight: 700, lineHeight: 1.2, textAlign: 'right', textTransform: 'uppercase' }}>
            {t('roundResults.columns.best', { possessive: scope?.possessive ?? t('roundResults.scope.their') })}
          </span>
        </div>
        {efforts.map((effort) => {
          const placing = placingText(effort.rank_here, effort.top_ten, t);
          return (
            <div key={effort.unit_kind} data-round-effort={effort.unit_kind} style={{ minHeight: 46, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 48px minmax(96px,112px)', alignItems: 'center', gap: 8 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', color: INK, fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{t(unitKey(effort.unit_kind))}</span>
                <span data-round-effort-span="true" style={{ display: 'block', color: INK_FAINT, fontSize: 10.5, lineHeight: 1.2, marginTop: 3 }}>{t(spanKey(effort.unit_kind))}</span>
              </span>
              <span style={{ color: INK, fontSize: 15, fontWeight: 700, lineHeight: 1, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatValue(effort.unit_kind, effort.value)}</span>
              <span data-round-effort-placing={placing ?? undefined} style={{ color: placing ? LIVE_INK : INK_FAINT, fontSize: 11.5, fontWeight: placing ? 700 : 500, lineHeight: 1.2, textAlign: 'right', whiteSpace: 'nowrap' }}>{placing ?? '—'}</span>
            </div>
          );
        })}
      </div>
    </Block>
  ) : null;

  return (
    <div data-round-results="true" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS }}>
      {awards.length > 0 && (
        <Block title={t('roundResults.sections.awards')} testId="awards">
          {awards.map((award, index) => <AwardRow key={`${award.unit_kind}:${award.unit_key}:${award.award_kind}:${index}`} award={award} />)}
        </Block>
      )}
      {holes.length > 0 && (
        <Block title={t('roundResults.sections.holes')} testId="holes">
          {holes.map((award, index) => <AwardRow key={`${award.unit_key}:${award.award_kind}:${index}`} award={award} />)}
        </Block>
      )}
      {resultsTable}
    </div>
  );
}