import React, { useMemo } from 'react';
import { User, MapPin, RefreshCw, Table } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { TrajectoryLine } from './TrajectoryLine';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { TREND_UP, TREND_DOWN } from '@/features/tourhub/_shared/tokens';

const GEIST = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const CANVAS = '#F8FAFC';
const INK = '#0F172A';
const SECONDARY = '#4B5563';
const MUTED = '#94A3B8';
const GHOST = '#CBD5E1';
const HAIRLINE = 'rgba(0,0,0,0.08)';
const CELL_BORDER = '#E2E8F0';
const EYEBROW = '#c97a10';
const EVEN_GRAY = '#8A9099';

const NUM: React.CSSProperties = {
  fontFamily: GEIST,
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

export interface CardScorecardHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
}

export interface CardScorecardRounds {
  available: number[];
  active: number;
  onSelect: (r: number) => void;
}

export interface CardScorecardSheetProps {
  open: boolean;
  onClose: () => void;
  // HEADER (course-first)
  eyebrowText: string;
  courseName: string;
  courseLocation?: string | null;
  coursePar?: number | null;
  courseSlope?: number | null;
  // MIDDLE (unchanged)
  holes: CardScorecardHole[];
  nineHole?: boolean;
  rounds?: CardScorecardRounds;
  heroMuted?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  // IDENTITY BLOCK (below scorecard)
  playerName: string;
  playerAvatarUrl?: string | null;
  playerHcp?: number | null;
  playerHcpDelta?: number | null;
  playerUserId?: string | null;
  // FOOTER
  onViewProfile?: () => void;
  onViewCourse?: () => void;
}

function fmtRel(n: number | null): string {
  if (n == null) return '\u2014';
  return n === 0 ? 'E' : n < 0 ? `\u2212${Math.abs(n)}` : `+${n}`;
}

function toParColor(n: number | null): string {
  if (n == null || n === 0) return EVEN_GRAY;
  return getScoreColor(n, 'light');
}


const CELL_SIZE = 31;

const NineGrid: React.FC<{
  holes: CardScorecardHole[];
  label: string;
  startAt: number;
  span: number;
}> = ({ holes, label, startAt, span }) => {
  const cells: CardScorecardHole[] = [];
  for (let i = 0; i < span; i++) {
    const holeNo = startAt + i;
    const found = holes.find((h) => h.holeNo === holeNo);
    cells.push(found ?? { holeNo, par: null, strokes: null });
  }

  const gross = cells.reduce((a, h) => a + (h.strokes ?? 0), 0);
  const played = cells.some((h) => h.strokes != null && h.strokes > 0);
  let toPar = 0;
  for (const h of cells) {
    if (h.strokes != null && h.strokes > 0 && h.par != null) toPar += h.strokes - h.par;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: GEIST, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', color: SECONDARY }}>
          {label}
        </span>
        {played && (
          <span style={{ ...NUM, fontSize: 12, fontWeight: 800, color: INK }}>
            {gross}{' '}
            <span style={{ color: toParColor(toPar) }}>{fmtRel(toPar)}</span>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {cells.map((h) => {
          const isPar = h.strokes != null && h.strokes > 0 && h.par != null && h.strokes === h.par;
          const unplayed = h.strokes == null || h.strokes <= 0;
          return (
            <div key={h.holeNo} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <div style={{ ...NUM, fontSize: 9, fontWeight: 700, color: MUTED }}>{h.holeNo}</div>
              <div style={{ ...NUM, fontSize: 9, fontWeight: 600, color: GHOST }}>{h.par ?? '-'}</div>
              {unplayed ? (
                <div
                  style={{
                    width: CELL_SIZE, height: CELL_SIZE,
                    borderRadius: 8, background: '#FFFFFF',
                    border: `1px solid ${CELL_BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...NUM, fontSize: 13, fontWeight: 700, color: GHOST,
                  }}
                >
                  {'\u00B7'}
                </div>
              ) : isPar ? (
                <div
                  style={{
                    width: CELL_SIZE, height: CELL_SIZE,
                    borderRadius: 8, background: '#FFFFFF',
                    border: `1px solid ${CELL_BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...NUM, fontSize: 13, fontWeight: 700, color: SECONDARY,
                  }}
                >
                  {h.strokes}
                </div>
              ) : (
                <ScoreMark
                  strokes={h.strokes ?? null}
                  par={h.par ?? 4}
                  size={CELL_SIZE}
                  surface="light"
                  fontFamily={GEIST}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HandicapChip: React.FC<{ delta: number }> = ({ delta }) => {
  const cut = delta < 0;
  const color = cut ? TREND_UP : TREND_DOWN;
  const bg = cut ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.07)';
  const border = cut ? 'rgba(22,163,74,0.20)' : 'rgba(220,38,38,0.18)';
  const arrow = cut ? '\u25BC' : '\u25B2';
  const value = `${cut ? '\u2212' : '+'}${Math.abs(delta).toFixed(1)}`;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`,
      ...NUM, fontSize: 10.5, fontWeight: 800, color,
    }}>
      <span style={{ fontSize: 8 }}>{arrow}</span>
      {value}
    </span>
  );
};

export const CardScorecardSheet: React.FC<CardScorecardSheetProps> = ({
  open, onClose, eyebrowText,
  courseName, courseLocation, coursePar, courseSlope,
  holes, nineHole, rounds, heroMuted, emptyMessage, loading,
  playerName, playerAvatarUrl, playerHcp, playerHcpDelta, playerUserId,
  onViewProfile, onViewCourse,
}) => {
  const totals = useMemo(() => {
    let gross = 0;
    let toPar = 0;
    let played = false;
    for (const h of holes) {
      if (h.strokes != null && h.strokes > 0 && h.par != null) {
        gross += h.strokes;
        toPar += h.strokes - h.par;
        played = true;
      }
    }
    return { gross, toPar, played };
  }, [holes]);

  const trajectoryCount = holes.filter((h) => h.par != null && h.strokes != null && h.strokes > 0).length;
  const showTrajectory = trajectoryCount >= 2;

  const hasPar = coursePar != null;
  const hasSlope = courseSlope != null;
  const showStatLine = hasPar || hasSlope || totals.played;

  const showChip = playerHcpDelta != null && Math.abs(playerHcpDelta) >= 0.05;
  const showIdentity = !!playerName;
  const showFooter = !!onViewProfile || !!onViewCourse;

  return (
    <BottomSheet open={open} onClose={onClose} variant="light" surfaceColor={CANVAS} style={{ background: CANVAS }}>
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: GEIST, background: CANVAS, maxHeight: 'calc(90vh - 24px)', overflowY: 'auto' }}>
        {/* HEADER — course-first */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px 12px', borderBottom: `1px solid ${HAIRLINE}` }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...NUM, fontSize: 10.5, fontWeight: 800, color: EYEBROW, letterSpacing: '0.14em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {eyebrowText}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 800, color: INK,
              letterSpacing: '-0.01em', lineHeight: 1.15, marginTop: 2,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {courseName}
            </div>
            {courseLocation && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: SECONDARY, marginTop: 2 }}>
                {courseLocation}
              </div>
            )}
            {showStatLine && (
              <div style={{ ...NUM, fontSize: 12, fontWeight: 700, color: MUTED, marginTop: 5, display: 'flex', gap: 12, alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                  {hasPar && (
                    <span>PAR <span style={{ color: INK }}>{coursePar}</span></span>
                  )}
                  {hasPar && hasSlope && (
                    <span style={{ color: 'rgba(15,23,42,0.18)' }}>|</span>
                  )}
                  {hasSlope && (
                    <span>SLOPE <span style={{ color: INK }}>{courseSlope}</span></span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
                  <span style={{ ...NUM, fontSize: 22, fontWeight: 200, color: INK, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {totals.played ? totals.gross : '\u2014'}
                  </span>
                  {totals.played && (
                    <span style={{ ...NUM, fontSize: 14, fontWeight: 800, color: heroMuted ? '#8A9099' : toParColor(totals.toPar) }}>
                      {fmtRel(totals.toPar)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROUND SELECTOR */}
        {rounds && rounds.available.length > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px 4px', overflowX: 'auto' }}>
            {rounds.available.map((r) => {
              const active = r === rounds.active;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => rounds.onSelect(r)}
                  style={{
                    padding: '6px 12px', borderRadius: 999,
                    background: active ? INK : 'transparent',
                    color: active ? '#FFFFFF' : SECONDARY,
                    border: active ? `1px solid ${INK}` : `1px solid ${HAIRLINE}`,
                    fontFamily: GEIST, fontSize: 11, fontWeight: 800,
                    letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  aria-pressed={active}
                >
                  R{r}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '28px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ height: 12, width: '40%', borderRadius: 6, background: 'rgba(15,23,42,0.06)' }} />
            <div style={{ display: 'flex', gap: 3 }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ flex: 1, height: 58, borderRadius: 8, background: 'rgba(15,23,42,0.06)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ flex: 1, height: 58, borderRadius: 8, background: 'rgba(15,23,42,0.06)' }} />
              ))}
            </div>
          </div>
        ) : holes.length === 0 ? (
          <div style={{ padding: '30px 16px 40px', textAlign: 'center', color: SECONDARY, fontSize: 13 }}>
            {emptyMessage ?? 'No hole-by-hole data yet.'}
          </div>
        ) : (
          <>
            {showTrajectory && (
              <div style={{ margin: 16, padding: '12px 12px 6px', background: '#FFFFFF', borderRadius: 14, border: `1px solid ${HAIRLINE}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: GEIST, fontSize: 10.5, fontWeight: 800, color: SECONDARY, letterSpacing: '0.1em' }}>
                    TRAJECTORY
                  </span>
                  {totals.played && (
                    <span style={{ ...NUM, fontSize: 11, fontWeight: 800, color: toParColor(totals.toPar) }}>
                      {fmtRel(totals.toPar)}
                    </span>
                  )}
                </div>
                <TrajectoryLine holes={holes} />
              </div>
            )}

            <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {nineHole ? (
                <NineGrid holes={holes.filter((h) => h.holeNo <= 9)} label="HOLES 1-9" startAt={1} span={9} />
              ) : (
                <>
                  <NineGrid holes={holes.filter((h) => h.holeNo <= 9)} label="OUT" startAt={1} span={9} />
                  <NineGrid holes={holes.filter((h) => h.holeNo > 9)} label="IN" startAt={10} span={9} />
                </>
              )}
            </div>
          </>
        )}


        {/* IDENTITY BLOCK */}
        {showIdentity && (
          <div style={{
            margin: '12px 16px 0',
            background: '#FFFFFF',
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 11,
          }}>
            <SquircleAvatar
              src={playerAvatarUrl ?? null}
              alt={playerName}
              userId={playerUserId ?? undefined}
              size={44}
              hairlineRing
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {playerName}
              </div>
              {(playerHcp != null || showChip) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
                  {playerHcp != null && (
                    <span style={{ ...NUM, fontSize: 12.5, fontWeight: 600, color: SECONDARY }}>
                      HCP {playerHcp.toFixed(1)}
                    </span>
                  )}
                  {showChip && <HandicapChip delta={playerHcpDelta as number} />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER — two buttons */}
        {showFooter && (
          <div style={{
            display: 'flex', gap: 8,
            padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
          }}>
            {onViewProfile && (
              <button
                type="button"
                onClick={onViewProfile}
                style={{
                  flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0',
                  borderRadius: 13, padding: '12px 14px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontFamily: GEIST, fontSize: 13.5, fontWeight: 800, color: INK,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <User size={16} strokeWidth={2} />
                View profile
              </button>
            )}
            {onViewCourse && (
              <button
                type="button"
                onClick={onViewCourse}
                style={{
                  flex: 1, background: INK, border: `1px solid ${INK}`,
                  borderRadius: 13, padding: '12px 14px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontFamily: GEIST, fontSize: 13.5, fontWeight: 800, color: '#FFFFFF',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <MapPin size={16} strokeWidth={2} />
                View course
              </button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default CardScorecardSheet;
