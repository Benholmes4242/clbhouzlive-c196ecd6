import React from 'react';
import { useTranslation } from 'react-i18next';

import { fmtToPar } from '@/components/feed/fmtToPar';
import type { RoundAwardRow, RoundAwardsResult, RoundAwardUnitKind, RoundEffortRow } from '@/hooks/gam/useRoundAwards';
import { TILE_DIM, TILE_INK, TILE_KICKER, TILE_MUTE, TileSection } from './scorecardParts';
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
  /** Object pronoun selector for the own-rounds line ("compares him"). */
  pronoun?: 'you' | 'he' | 'she' | 'they';
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
    <div data-round-award={award.unit_kind} style={{ minWidth: 0, display: 'grid', gridTemplateColumns: '32px minmax(0,1fr)', alignItems: 'center', gap: 12, marginTop: 12 }}>
      <AwardMark tier={award.tier} size="tile" />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: TILE_INK, fontSize: 14.5, fontWeight: 600, lineHeight: 1.3 }}>{awardTitle(award, t, voice)}</span>
        {subline && <span data-round-award-line="true" style={{ display: 'block', color: TILE_MUTE, fontSize: 12.5, lineHeight: 1.35, marginTop: 2 }}>{subline}</span>}
      </span>
    </div>
  );
}

/**
 * BRIEF_SCORECARD_SHEET C.6 — ONE BASIS, NAMED BEFORE ITS FIGURES.
 * Everything here (awards, the strip the host passes in, the efforts table) is
 * measured against the member's OWN rounds at this course, so the section
 * heading and its "nothing here compares … to anyone else" line come FIRST.
 * The field comparison is NOT in here: the host draws it in its own block under
 * its own heading, so no string claims "own rounds only" beside a field figure.
 */
export function RoundResults({ result, scope, voice, strip = null, coursesHeadingInk = false }: {
  coursesHeadingInk?: boolean;
  result: RoundAwardsResult | null | undefined;
  scope?: RoundResultsScope | null;
  voice?: RoundResultsVoice | null;
  /** The own-rounds figure strip, drawn after the awards and before the table. */
  strip?: React.ReactNode;
}) {
  const { t } = useTranslation('handicap');

  const awards = (result?.awards ?? []).filter((award) => COARSE_UNITS.has(award.unit_kind));
  const holes = (result?.awards ?? []).filter((award) => award.unit_kind === 'hole');
  const efforts = effortOrder
    .map((kind) => result?.efforts.find((effort) => effort.unit_kind === kind))
    .filter((effort): effort is RoundEffortRow => !!effort);
  if (awards.length === 0 && holes.length === 0 && efforts.length === 0 && !strip) return null;

  /* C.5 — THE PLACING COLUMN EXISTS ONLY WHEN SOMETHING PLACED. A dash means the
     RPC supplied no rank; with every row unplaced the column and its header
     are not drawn at all. SCORECARD_TILE_REDESIGN §2d: no green; a 1st is ink. */
  const anyPlaced = efforts.some((e) => placingText(e.rank_here, e.top_ten, t) != null);
  const cols = anyPlaced ? 'minmax(0,1fr) 56px 64px' : 'minmax(0,1fr) 56px';
  const headStyle: React.CSSProperties = { color: TILE_DIM, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', lineHeight: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' };
  const possessive = scope?.possessive ?? t('roundResults.scope.their');

  const resultsTable = efforts.length > 0 ? (
    <div data-round-efforts-table="true" data-round-efforts-columns={anyPlaced ? 3 : 2} style={{ minWidth: 0, overflowX: 'clip', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
      <div data-round-efforts-header="true" style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', height: 24 }}>
        <span style={headStyle}>{t('roundResults.columns.round')}</span>
        <span style={{ ...headStyle, textAlign: 'right' }}>{t('roundResults.columns.score')}</span>
        {anyPlaced && (
          <span data-round-efforts-placing-header="true" style={{ ...headStyle, textAlign: 'right' }}>
            {t('roundResults.columns.best', { possessive })}
          </span>
        )}
      </div>
      {efforts.map((effort) => {
        const placing = placingText(effort.rank_here, effort.top_ten, t);
        const first = effort.rank_here === 1;
        return (
          <div key={effort.unit_kind} data-round-effort={effort.unit_kind} style={{ height: 46, display: 'grid', gridTemplateColumns: cols, alignItems: 'center' }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', color: TILE_INK, fontSize: 14.5, fontWeight: 600, lineHeight: 1.2 }}>{t(unitKey(effort.unit_kind))}</span>
              <span data-round-effort-span="true" style={{ display: 'block', color: TILE_DIM, fontSize: 12, lineHeight: 1.2, marginTop: 1 }}>{t(spanKey(effort.unit_kind))}</span>
            </span>
            <span style={{ color: TILE_INK, fontSize: 15, fontWeight: 700, lineHeight: 1, textAlign: 'right' }}>{formatValue(effort.unit_kind, effort.value)}</span>
            {anyPlaced && (
              <span data-round-effort-placing={placing ?? undefined} data-round-effort-first={first ? 'true' : undefined} style={{ color: first ? TILE_INK : TILE_MUTE, fontSize: 14, fontWeight: first ? 700 : 600, lineHeight: 1.2, textAlign: 'right', whiteSpace: 'nowrap' }}>{placing ?? '\u2014'}</span>
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  /* SCORECARD_TILE_REDESIGN §2c/§2d — three titled sections in the tile's
     grammar: AWARDS, the hole awards (kept, same kicker treatment), then the
     own-rounds section (heading, scope note, efforts table). No rules. */
  return (
    <div data-round-results="true" data-round-results-own="true" style={{ display: 'flex', flexDirection: 'column', gap: 26, fontFamily: SANS, minWidth: 0 }}>
      {awards.length > 0 && (
        <TileSection kicker={t('roundResults.sections.awards')} testId="awards" ink={coursesHeadingInk}>
          <div data-round-results-block="awards">
            {awards.map((award, index) => <AwardRow key={`${award.unit_kind}:${award.unit_key}:${award.award_kind}:${index}`} award={award} voice={voice} />)}
          </div>
        </TileSection>
      )}
      {holes.length > 0 && (
        <TileSection kicker={t('roundResults.sections.holes')} testId="holes" ink={coursesHeadingInk}>
          <div data-round-results-block="holes">
            {holes.map((award, index) => <AwardRow key={`${award.unit_key}:${award.award_kind}:${index}`} award={award} voice={voice} />)}
          </div>
        </TileSection>
      )}
      {strip}
      {(scope || resultsTable) && (
        <section data-round-results-scope={scope ? 'true' : undefined} data-round-results-block={resultsTable ? 'efforts' : undefined} style={{ minWidth: 0 }}>
          {scope && (
            <>
              <h3 style={{ ...TILE_KICKER, margin: 0, ...(coursesHeadingInk ? { color: TILE_INK } : {}) }}>
                {t('roundResults.scope.ownHeading', { possessive: scope.possessive })}
              </h3>
              <p style={{ margin: '6px 0 0', color: TILE_MUTE, fontSize: 12.5, lineHeight: 1.45 }}>
                {t('roundResults.scope.ownLine', {
                  count: scope.roundsHere,
                  object: t(`roundResults.scope.object.${scope.pronoun ?? 'they'}`),
                })}
              </p>
            </>
          )}
          {resultsTable}
        </section>
      )}
    </div>
  );
}
