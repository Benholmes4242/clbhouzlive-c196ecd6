import React from 'react';
import { useTranslation } from 'react-i18next';

import { fmtToPar } from '@/components/feed/fmtToPar';
import type { RoundAwardRow, RoundAwardsResult, RoundAwardUnitKind, RoundEffortRow } from '@/hooks/gam/useRoundAwards';
import {
  HAIRLINE_INK_8,
  INK,
  INK_FAINT,
  LIVE_INK,
} from '@/features/tourhub/_shared/tokens';
import { SANS } from '@/features/courses/components/holes/analytical/tokens';
import { AwardMark } from '@/components/awards/AwardMark';
import { formatOrdinal } from '@/i18n/format';

export interface RoundResultsScope {
  courseName: string;
  roundsHere: number;
  subjectName: string;
  subject: string;
  possessive: string;
  verb: string;
}

/**
 * The sheet's ONE voice (CardScorecardSheet's scopeVoice), threaded to the
 * award rows. `subjectName` is already possessive for another member
 * ("Andrew's") and plain "You" for the viewer, so owner and non-owner titles
 * are SEPARATE keys — never `${subjectName}'s`, which would print "You's".
 */
export interface RoundResultsVoice {
  self: boolean;
  subjectName: string;
  pronoun: 'you' | 'he' | 'she' | 'they';
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

function placingText(rank: number | null, topTen: boolean, t: (key: string, options?: Record<string, unknown>) => string): string | null {
  if (rank != null) return formatOrdinal(rank);
  if (topTen) return t('roundResults.placing.topTen');
  return null;
}

type T = (key: string, options?: Record<string, unknown>) => string;

function awardTitle(award: RoundAwardRow, t: T, voice: RoundResultsVoice | null | undefined): string {
  // Owner and non-owner are separate keys; with no voice the generic keys stand.
  const who = voice ? (voice.self ? 'Self' : 'Other') : '';
  const name = voice?.subjectName;
  if (award.unit_kind === 'hole') {
    const hole = formatOrdinal(award.unit_key);
    if (award.award_kind === 'first_birdie') {
      // Fires on the hole's FIRST time under par — an eagle on a never-birdied
      // hole is "First eagle", not "First birdie".
      const word = award.value != null ? HOLE_WORDS[Math.round(award.value)] : null;
      const kind = word === 'eagle' || word === 'albatross' ? word : 'birdie';
      return t(`roundResults.award.first_${kind}`, { hole });
    }
    if (award.award_kind === 'top_three') return t('roundResults.award.topThreeHole', { hole });
    if (award.award_kind === 'top_ten') return t('roundResults.award.topTenHole', { hole });
    if (award.award_kind === 'matched_best') return t(`roundResults.award.matchedBestHole${who}`, { hole, name });
    return t(`roundResults.award.bestHole${who}`, { hole, name });
  }
  const unit = t(awardUnitKey(award.unit_kind));
  if (award.award_kind === 'matched_best') return t(`roundResults.award.matchedBest${who}`, { unit, name });
  if (award.award_kind === 'top_three') return t('roundResults.award.topThree', { unit });
  if (award.award_kind === 'top_ten') return t('roundResults.award.topTen', { unit });
  return t(`roundResults.award.best${who}`, { unit, name });
}

/*
 * HOLE SCORES AS WORDS. A hole award's value is TO-PAR, with no par on the
 * row. DO NOT add "hole in one": an ace on a par 3 and an eagle on a par 5 are
 * both -2, so any ace label would be wrong half the time. Beyond +3 the signed
 * figure stands rather than an invented name.
 */
const HOLE_WORDS: Record<number, string> = {
  [-3]: 'albatross', [-2]: 'eagle', [-1]: 'birdie', 0: 'par', 1: 'bogey', 2: 'double', 3: 'triple',
};

/** `slot` = 'scoreName' opens a sentence; 'scorePrev' carries its own article. */
function scoreWords(unit: RoundAwardUnitKind, value: number, slot: 'scoreName' | 'scorePrev', t: T): string {
  if (unit === 'hole') {
    const word = HOLE_WORDS[Math.round(value)];
    return word ? t(`roundResults.${slot}.${word}`) : fmtToPar(value);
  }
  if (unit === 'round_stableford' && slot === 'scoreName') return t('roundResults.points', { count: Math.round(value) });
  return formatValue(unit, value);
}

/*
 * THE SENTENCE. The name owns the title; the pronoun owns the sentence. Each
 * full sentence per pronoun is its own key — no string capitalisation. A
 * matched_best has previous_value === value, so it never says "best was X".
 */
function placeUnit(unit: RoundAwardUnitKind): string {
  if (unit === 'hole') return 'score';
  if (unit === 'front_nine' || unit === 'back_nine') return 'nine';
  if (unit === 'finish_six') return 'stretch';
  return 'round';
}

function awardSentence(award: RoundAwardRow, t: T, voice: RoundResultsVoice | null | undefined): string | null {
  // No voice = the impersonal form of the same sentences, never figures.
  const p = voice?.pronoun ?? 'none';
  if (award.award_kind === 'first_birdie') return t(`roundResults.line.firstUnder.${p}`);
  if (award.value == null) return null;
  const score = scoreWords(award.unit_kind, award.value, 'scoreName', t);
  if (award.award_kind === 'matched_best') return t(`roundResults.line.matched.${p}`, { score });
  if (award.award_kind === 'new_best') {
    if (award.previous_value == null) return t(`roundResults.line.newBestBare.${p}`, { score });
    return t(`roundResults.line.newBest.${p}`, { score, previous: scoreWords(award.unit_kind, award.previous_value, 'scorePrev', t) });
  }
  // top_three / top_ten. rank_here is deliberately NULL for 4th-9th — say
  // "inside the best ten", never interpolate or look it up again.
  const u = placeUnit(award.unit_kind);
  const count = award.attempts ?? 0;
  // A frozen award carries its as-at-detection count; never print "from 0".
  const bare = count > 0 ? '' : 'Bare';
  if (award.rank_here != null) {
    return t(`roundResults.line.placed${bare}.${p}`, { score, place: formatOrdinal(award.rank_here), unit: t(`roundResults.placeUnit.${u}`), count });
  }
  return t(`roundResults.line.topTen${bare}.${p}`, { score, unitPlural: t(`roundResults.placeUnit.${u}Plural`), count });
}

function AwardRow({ award, voice }: { award: RoundAwardRow; voice?: RoundResultsVoice | null }) {
  const { t } = useTranslation('handicap');
  const subline = awardSentence(award, t, voice);

  return (
    <div data-round-award={award.unit_kind} style={{ minWidth: 0, display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', alignItems: 'center', gap: 10, padding: '10px 0' }}>
      <AwardMark tier={award.tier} size="sheet" />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: INK, fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{awardTitle(award, t, voice)}</span>
        {subline && <span data-round-award-line="true" style={{ display: 'block', color: INK_FAINT, fontSize: 11.5, lineHeight: 1.35, marginTop: 3 }}>{subline}</span>}
      </span>
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

export function RoundResults({ result, scope, voice }: { result: RoundAwardsResult | null | undefined; scope?: RoundResultsScope | null; voice?: RoundResultsVoice | null }) {
  const { t } = useTranslation('handicap');
  if (!result) return null;

  const awards = result.awards.filter((award) => COARSE_UNITS.has(award.unit_kind));
  const holes = result.awards.filter((award) => award.unit_kind === 'hole');
  const efforts = effortOrder
    .map((kind) => result.efforts.find((effort) => effort.unit_kind === kind))
    .filter((effort): effort is RoundEffortRow => !!effort);
  if (awards.length === 0 && holes.length === 0 && efforts.length === 0) return null;

  const resultsTable = efforts.length > 0 ? (
    <>
      {scope && (
        <div data-round-results-scope="true" style={{ margin: '4px 0 4px', minWidth: 0 }}>
          <div style={{ color: INK_FAINT, fontSize: 9.5, fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase' }}>
            {t('roundResults.scope.kicker')}
          </div>
          <h4 style={{ margin: '5px 0 0', color: INK, fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>
            {t('roundResults.scope.heading', { name: scope.subjectName, course: scope.courseName })}
          </h4>
          <p style={{ margin: '6px 0 0', color: INK_FAINT, fontSize: 11.5, lineHeight: 1.45 }}>
            {t('roundResults.scope.line', {
              subject: scope.subject,
              verb: scope.verb,
              count: scope.roundsHere,
              possessive: scope.possessive,
            })}
          </p>
        </div>
      )}
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
    </>
  ) : null;

  return (
    <div data-round-results="true" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: SANS }}>
      {awards.length > 0 && (
        <Block title={t('roundResults.sections.awards')} testId="awards">
          {awards.map((award, index) => <AwardRow key={`${award.unit_kind}:${award.unit_key}:${award.award_kind}:${index}`} award={award} voice={voice} />)}
        </Block>
      )}
      {holes.length > 0 && (
        <Block title={t('roundResults.sections.holes')} testId="holes">
          {holes.map((award, index) => <AwardRow key={`${award.unit_key}:${award.award_kind}:${index}`} award={award} voice={voice} />)}
        </Block>
      )}
      {resultsTable}
    </div>
  );
}