/**
 * Shared connected hero rendering (CE1). Data ownership remains in ProfileHero;
 * the illustrative example supplies fixed props to this same markup, never a
 * parallel drawing. Connected output/geometry and counting fallbacks are frozen.
 * Example taps are suppressed at source; inert is only a secondary safeguard.
 */
import React from 'react';
import type { TFunction } from 'i18next';
import type { NavigateFunction } from 'react-router-dom';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { IndexMovementTriangle } from '@/components/explore-tab-new/friendRoundParts';
import { formBarLowered, fmtSigned, type FormBar } from '@/features/profile-sheet-v2/sheetState';
import type { ProfileRound } from '@/components/profile/rounds/useProfileRounds';
import { numberWord } from '@/lib/text/numbers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { W_40 } from './HeroShell';
const GREEN = INDEX_DELTA.dark.improved;
const RED = INDEX_DELTA.dark.drifted;
const AXIS_INK = 'rgba(248,250,252,0.30)';
const LOW_LINE = 'rgba(255,255,255,0.14)';
const MARKER_HALO = '0 0 0 3px rgba(10,10,12,0.9)';
const TILE_GROUND = 'rgba(255,255,255,0.02)';
const KICK: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM };
const MICRO: React.CSSProperties = { fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' };


function formatIndex(v: number): string {
  return v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);
}
const IndexChart: React.FC<{ points: number[]; color: string; fillTop: number; axisLeft: string; axisRight: string; lowLabel: string; onTap?: () => void; tabIndex?: number; example?: boolean }> = ({ points, color, fillTop, axisLeft, axisRight, lowLabel, onTap, tabIndex, example }) => {
  const gid = React.useId().replace(/:/g, '');
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;
  const yOf = (v: number) => (span === 0 ? 8 : 8 + ((max - v) / span) * 42);
  const n = points.length;
  const d = points.map((p, i) => `${((i / (n - 1)) * 361).toFixed(1)},${yOf(p).toFixed(1)}`).join(' ');
  const lowY = yOf(min);
  const lastY = yOf(points[n - 1]);
  return (
    <button type="button" data-example-chart={example ? '' : undefined} onClick={onTap} tabIndex={tabIndex} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: SANS }}>
      <div style={{ marginTop: 12, height: 64, position: 'relative' }}>
        <svg width="100%" height={64} viewBox="0 0 361 64" preserveAspectRatio="none" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`hcpfill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={fillTop} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,64 ${d} 361,64`} fill={`url(#hcpfill-${gid})`} stroke="none" />
          <line x1={0} y1={lowY} x2={361} y2={lowY} stroke={LOW_LINE} strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <polyline points={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <span style={{ position: 'absolute', left: 0, top: lowY, transform: 'translateY(-50%)', ...MICRO, color: A.DIM, background: A.CANVAS, paddingRight: 6, ...FIGS }}>
          {lowLabel}
        </span>
        <span aria-hidden style={{ position: 'absolute', right: -3, top: lastY, marginTop: -3.5, width: 7, height: 7, borderRadius: 999, background: color, boxShadow: MARKER_HALO }} />
      </div>
      <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', ...MICRO, color: AXIS_INK }}>
        <span>{axisLeft}</span><span>{axisRight}</span>
      </div>
    </button>
  );
};

interface Props {
  t: TFunction<'profile'>;
  shownIndex: number | null;
  deltaLines: Array<{ key: string; delta: number; direction: 'down' | 'up' | 'flat'; window: string }>;
  slot: { value: string; label: string; color: string } | null;
  verdict: React.ReactNode;
  series: number[];
  chartColor: string;
  chartFillTop: number;
  axisWindow: string;
  windowDays: number | null;
  bars: FormBar[];
  byId: Map<string, Pick<ProfileRound, 'gross_score' | 'course_name'>>;
  countingKnown: boolean;
  countingN: number;
  loweredN: number;
  tilesWord: string;
  isSelf: boolean;
  ownerFirstName?: string | null;
  onStatTap: (stat: 'index') => void;
  tap: (stat: 'index') => () => void;
  navigate: NavigateFunction;
  example?: boolean;
}
export const HeroHandicapDisplay: React.FC<Props> = ({
  t, shownIndex, deltaLines, slot, verdict, series, chartColor, chartFillTop,
  axisWindow, windowDays, bars, byId, countingKnown, countingN, loweredN,
  tilesWord, isSelf, ownerFirstName, onStatTap, tap, navigate, example = false,
}) => {
  return (
          <div style={{ marginTop: 14 }}>
            {shownIndex != null && (
              <>
                <div data-ghost-label={example ? '' : undefined} style={KICK}>{t('hero.handicapIndex', 'Handicap index')}</div>
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                  <button type="button" data-example-index={example ? '' : undefined} onClick={example ? undefined : tap('index')} tabIndex={example ? -1 : undefined} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 46, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.92, color: A.INK, ...FIGS }}>
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
                {verdict && (
                  <div style={{ marginTop: 9, fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, color: A.BODY }}>{verdict}</div>
                )}
              </>
            )}

            {series.length >= 2 && (
              <IndexChart
                example={example}
                points={series}
                color={chartColor}
                fillTop={chartFillTop}
                lowLabel={t('hero.low', { value: formatIndex(Math.min(...series)), defaultValue: `Low ${formatIndex(Math.min(...series))}` })}
                axisLeft={t('hero.windowAgo', { window: axisWindow, defaultValue: `${axisWindow} ago` })}
                axisRight={t('hero.today', 'Today')}
                tabIndex={example ? -1 : undefined}
                onTap={example ? undefined : () => {
                  analyticsEvents.track('profile_index_chart_tap', { window_days: windowDays });
                  onStatTap('index');
                }}
              />
            )}

            {bars.length > 0 && (
              <>
                <div style={{ marginTop: 18 }}>
                  <span data-ghost-label={example ? '' : undefined} style={KICK}>{t('hero.formLastFive', 'Form \u00B7 last five')}</span>
                </div>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {bars.map((bar, i) => {
                    const r = byId.get(bar.id);
                    const fig = fmtSigned(bar.value);
                    const hasSign = fig.startsWith('+') || fig.startsWith('\u2212');
                    return (
                      <button
                        key={bar.id}
                        data-example-form-tile={example ? '' : undefined}
                        type="button"
                        tabIndex={example ? -1 : undefined}
                        onClick={example ? undefined : () => {
                          analyticsEvents.track('profile_form_tile_tap', { whs_score_id: bar.id, position: i + 1 });
                          navigate(`/round/${bar.id}`);
                        }}
                        style={{
                          minWidth: 0,
                          border: `1px solid ${A.SOFT}`,
                          background: TILE_GROUND,
                          borderRadius: 11,
                          padding: '8px 5px 7px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          fontFamily: SANS,
                        }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: A.INK, ...FIGS }}>
                          {r?.gross_score ?? '\u00A0'}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, textAlign: 'center', color: formBarLowered(bar) ? GREEN : A.DIM, ...FIGS }}>
                          {/* The sign hangs outside the centring so the digits sit under the gross. */}
                          <span style={{ position: 'relative', display: 'inline-block' }}>
                            {hasSign && <span style={{ position: 'absolute', right: '100%', marginRight: 0.5 }}>{fig[0]}</span>}
                            {hasSign ? fig.slice(1) : fig}
                          </span>
                        </div>
                        <div style={{ marginTop: 5, fontSize: 7, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: AXIS_INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r?.course_name ?? '\u00A0'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/*
                  "Counting" and "lowered your index" are DIFFERENT FACTS and they come
                  apart: a round can enter the best eight without displacing a worse
                  score (counting, did not lower), and a round that lowered the index
                  months ago can since have been pushed out (lowered, not counting). On
                  a five-round window they correlate strongly, which is exactly why one
                  mark claiming both looks right until the day it is wrong. The tiles
                  draw the one fact a colour can carry honestly — green for lowered —
                  and the sentence states the one it cannot. Do not add a counting
                  marker to these tiles.
                */}
                {(countingKnown || loweredN > 0) && (
                  <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 600, lineHeight: 1.45, color: A.MUTE }}>
                    {countingKnown && (
                      <>
                        {countingN === 0 ? (
                          <><b style={{ color: A.INK, fontWeight: 700 }}>{t('hero.countingNone', 'None')}</b>{(isSelf ? t('hero.countingNoneRest', { n: tilesWord, defaultValue: ` of these ${tilesWord} are counting towards your index.` }) : ownerFirstName ? t('hero.countingNoneRestNamed', { n: tilesWord, name: ownerFirstName, defaultValue: ` of these ${tilesWord} are counting towards ${ownerFirstName}'s index.` }) : t('hero.countingNoneRestTheir', { n: tilesWord, defaultValue: ` of these ${tilesWord} are counting towards their index.` }))}</>
                        ) : (
                          <><b style={{ color: A.INK, fontWeight: 700 }}>{numberWord(countingN)}</b>{countingN === 1
                            ? (isSelf ? t('hero.countingOneRest', { n: tilesWord, defaultValue: ` of these ${tilesWord} is counting towards your index.` }) : ownerFirstName ? t('hero.countingOneRestNamed', { n: tilesWord, name: ownerFirstName, defaultValue: ` of these ${tilesWord} is counting towards ${ownerFirstName}'s index.` }) : t('hero.countingOneRestTheir', { n: tilesWord, defaultValue: ` of these ${tilesWord} is counting towards their index.` }))
                            : (isSelf ? t('hero.countingManyRest', { n: tilesWord, defaultValue: ` of these ${tilesWord} are counting towards your index.` }) : ownerFirstName ? t('hero.countingManyRestNamed', { n: tilesWord, name: ownerFirstName, defaultValue: ` of these ${tilesWord} are counting towards ${ownerFirstName}'s index.` }) : t('hero.countingManyRestTheir', { n: tilesWord, defaultValue: ` of these ${tilesWord} are counting towards their index.` }))}</>
                        )}
                      </>
                    )}
                    {countingKnown && loweredN > 0 && ' '}
                    {loweredN > 0 && (loweredN === 1
                      ? <>{t('hero.loweredOnePre', 'The ')}<span style={{ color: GREEN }}>{t('hero.loweredOneGreen', 'green')}</span>{t('hero.loweredOnePost', ' round lowered it.')}</>
                      : <><span style={{ color: GREEN }}>{t('hero.loweredManyGreen', 'Green')}</span>{t('hero.loweredManyPost', ' rounds lowered it.')}</>)}
                  </div>
                )}
              </>
            )}
          </div>
  );
};
