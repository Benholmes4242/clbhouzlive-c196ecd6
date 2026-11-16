/**
 * Shared connected hero rendering (CE1). Data ownership remains in ProfileHero;
 * the illustrative example supplies fixed props to this same markup, never a
 * parallel drawing. Connected output/geometry and counting fallbacks are frozen.
 * Example taps are suppressed at source; inert is only a secondary safeguard.
 * CEX1 omits only the example's duplicate axis; counting remains prop-gated.
 */
import React from 'react';
import type { TFunction } from 'i18next';
import type { NavigateFunction } from 'react-router-dom';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { IndexMovementTriangle } from '@/components/explore-tab-new/friendRoundParts';
import { fmtSigned, type FormBar } from '@/features/profile-sheet-v2/sheetState';
import type { ProfileRound } from '@/components/profile/rounds/useProfileRounds';
import { numberWord } from '@/lib/text/numbers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Button } from '@/components/ui/button';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import type { HeroIndexPoint } from './indexLine';
import { IndexWindowChart } from '@/components/handicap/IndexWindowChart';
import './profile-form.css';
import { W_40 } from './HeroShell';
const GREEN = INDEX_DELTA.dark.improved;
const NO_COUNTING: ReadonlySet<string> = new Set();
const RED = INDEX_DELTA.dark.drifted;
const KICK: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM };
const MICRO: React.CSSProperties = { fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' };


function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}
const IndexChart: React.FC<{ points: HeroIndexPoint[]; bars?: FormBar[]; countingIds?: ReadonlySet<string>; windowDays: number; spanLabel?: string; onTap?: () => void; tabIndex?: number; example?: boolean }> = ({ points, windowDays, spanLabel, onTap, tabIndex, example, bars = [], countingIds }) => (
  <button type="button" data-example-chart={example ? '' : undefined} onClick={onTap} tabIndex={tabIndex} style={{ display: 'block', width: '100%', marginTop: 12, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
    {/* BRIEF_ONE_INDEX_CHART: the shared chart; its tone comes from the window's own net. */}
    <IndexWindowChart points={points} windowDays={windowDays} spanLabel={spanLabel} hideAxis={example}
      rounds={bars.map(b => ({ id: b.id, date: b.date, counts: !!countingIds?.has(b.id) }))} />
  </button>
);

interface Props {
  t: TFunction<'profile'>;
  shownIndex: number | null;
  deltaLines: Array<{ key: string; delta: number; direction: 'down' | 'up' | 'flat'; window: string }>;
  slot: { value: string; label: string; color: string } | null;
  verdict: React.ReactNode;
  series: HeroIndexPoint[];
  /** Retired by BRIEF_ONE_INDEX_CHART: IndexWindowChart tones itself from the window's net. Accepted and ignored. */
  chartColor?: string;
  chartFillTop?: number;
  /** The window's span label (windowSpanLabel); the axis reads "{axisWindow} ago". */
  axisWindow?: string;
  windowDays: number | null;
  bars: FormBar[];
  byId: Map<string, Pick<ProfileRound, 'gross_score' | 'course_name'>>;
  countingKnown: boolean;
  countingN: number;
  /** Ids of bars whose round counts towards the index; empty when counting is unknown. */
  countingIds?: ReadonlySet<string>;
  tilesWord: string;
  isSelf: boolean;
  ownerFirstName?: string | null;
  onStatTap: (stat: 'index') => void;
  tap: (stat: 'index') => () => void;
  /** Kept for existing callers; form tiles no longer navigate. */
  navigate?: NavigateFunction;
  /** FIX_PROFILE_COMPARE_1: form tiles open the round sheet over the profile. */
  onOpenRound?: (scoreId: string) => void;
  example?: boolean;
  /** HH3: optional node between the index chart and Form · last five. */
  afterChart?: React.ReactNode;
  /** Profile-owned ranking line; illustrative examples never supply it. */
  afterIndex?: React.ReactNode;
}
export const HeroHandicapDisplay: React.FC<Props> = ({
  t, shownIndex, deltaLines, slot, verdict, series,
  axisWindow, windowDays, bars, byId, countingKnown, countingN, countingIds = NO_COUNTING,
  tilesWord, isSelf, ownerFirstName, onStatTap, tap, onOpenRound, example = false, afterChart, afterIndex,
}) => {
  return (
          <div style={{ marginTop: 14 }}>
            {shownIndex != null && (
              <>
                <div data-ghost-label={example ? '' : undefined} style={KICK}>{t('hero.handicapIndex', 'Handicap index')}</div>
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                  <button type="button" data-example-index={example ? '' : undefined} onClick={example ? undefined : tap('index')} tabIndex={example ? -1 : undefined} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 46, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.92, color: A.INK, ...FIGS }}>
                    {formatIndex(shownIndex)}
                  </button>
                  {deltaLines.length > 0 && (
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: 5 }}>
                      {deltaLines.map((l) => {
                        const up = l.direction === 'up';
                        const down = l.direction === 'down';
                        const c = down ? GREEN : up ? RED : W_40;
                        return (
                          <span key={l.key} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, fontSize: 12, fontWeight: 700, ...FIGS }}>
                            <span style={{ color: c, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {(down || up) && <IndexMovementTriangle direction={down ? 'down' : 'up'} color={c} size={7} />}
                              {down || up ? Math.abs(l.delta).toFixed(1) : t('hero.trendLevel', 'Level')}
                            </span>
                            <span style={{ ...MICRO, color: W_40 }}>{l.window}</span>
                          </span>
                        );
                      })}
                    </span>
                  )}
                  {slot && (
                    <span style={{ marginLeft: 'auto', textAlign: 'right', paddingBottom: 4 }}>
                      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: slot.color, ...FIGS }}>{slot.value}</div>
                      <div style={{ marginTop: 3, ...MICRO, color: A.DIM }}>{slot.label}</div>
                    </span>
                  )}
                </div>
                {!example && afterIndex}
                {verdict && (
                  <div style={{ marginTop: 9, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, color: A.BODY }}>{verdict}</div>
                )}
              </>
            )}

            {series.length >= 2 && (
              <IndexChart
                example={example}
                points={series}
                countingIds={countingKnown ? countingIds : undefined} bars={bars}
                windowDays={90}
                spanLabel={axisWindow}
                tabIndex={example ? -1 : undefined}
                onTap={example ? undefined : () => {
                  analyticsEvents.track('profile_index_chart_tap', { window_days: windowDays });
                  onStatTap('index');
                }}
              />
            )}

            {afterChart}

            {bars.length > 0 && (
              <>
                <div style={{ marginTop: 16 }}>
                  <span data-ghost-label={example ? '' : undefined} style={KICK}>{t('hero.lastFiveRounds', 'Last five rounds')}</span>
                </div>
                <div className="profile-form-rail">
                  {[...bars].reverse().map((bar, i) => {
                    const r = byId.get(bar.id);
                    const date = new Date(bar.date);
                    const dateText = Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }) : '';
                    return <Button key={bar.id} variant="ghost" className="profile-form-round" data-form-round={bar.id} data-counts={countingKnown && countingIds.has(bar.id) ? 'true' : 'false'} data-example-form-tile={example ? '' : undefined} tabIndex={example ? -1 : undefined}
                      onClick={example ? undefined : () => { analyticsEvents.track('profile_form_tile_tap', { whs_score_id: bar.id, position: i + 1 }); onOpenRound?.(bar.id); }}>
                      <span className="profile-form-top"><i className="profile-form-dot" aria-hidden /><b className="profile-form-gross" style={FIGS}>{r?.gross_score ?? '\u00A0'}</b><span className="profile-form-figure" style={FIGS}>{fmtSigned(bar.value)}</span></span>
                      <span className="profile-form-course">{shortCoursePart(r?.course_name ?? '')}</span>
                      <span className="profile-form-date">{dateText}</span>
                    </Button>;
                  })}
                </div>
                {/*
                  The tiles mark COUNTING: a green dot means the round is one of the
                  rounds counting towards the index (is_counter via countsTowardIndex),
                  the same fact the counting eight on the Handicap page shows, and the
                  matching dot on the chart line above is green too. "Lowered your
                  index" is a different fact and is no longer shown anywhere on these
                  tiles: the figure stays dim at every value. With counting unknown
                  there is no green and no sentence.
                */}
                {countingKnown && (() => {
                  const whose = isSelf ? t('hero.countingYour', 'your index') : ownerFirstName ? t('hero.countingNamed', { name: ownerFirstName, defaultValue: `${ownerFirstName}'s index` }) : t('hero.countingTheir', 'their index');
                  return (
                    <div data-counting-sentence style={{ marginTop: 12, fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.MUTE }}>
                      {countingN === 0
                        ? <>{t('hero.countingNoneLine', { n: tilesWord, whose, defaultValue: `None of these ${tilesWord} counts towards ${whose}.` })}</>
                        : countingN === bars.length && countingN > 1
                          ? <>{t('hero.countingAllLine', { n: tilesWord, whose, defaultValue: `All ${tilesWord} count towards ${whose}.` })}</>
                          : <><b style={{ color: A.INK, fontWeight: 700 }}>{numberWord(countingN)}</b>{countingN === 1
                            ? <>{t('hero.countingOneLine', { n: tilesWord, whose, defaultValue: ` of these ${tilesWord} counts towards ${whose}: the ` })}<span style={{ color: GREEN }}>{t('hero.countingGreen', 'green')}</span>{t('hero.countingOneEnd', ' one.')}</>
                            : <>{t('hero.countingManyLine', { n: tilesWord, whose, defaultValue: ` of these ${tilesWord} count towards ${whose}: the ` })}<span style={{ color: GREEN }}>{t('hero.countingGreen', 'green')}</span>{t('hero.countingManyEnd', ' ones.')}</>}</>}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
  );
};
