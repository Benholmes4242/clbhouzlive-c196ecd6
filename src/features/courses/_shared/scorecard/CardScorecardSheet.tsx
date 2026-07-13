import React, { useMemo } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { TrajectoryLine } from './TrajectoryLine';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';

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
  eyebrowText: string;
  name: string;
  avatarUrl?: string | null;
  onIdentityTap?: () => void;
  subLine: string;
  holes: CardScorecardHole[];
  nineHole?: boolean;
  rounds?: CardScorecardRounds;
  headerRight?: React.ReactNode;
  footerExtra?: React.ReactNode;
  emptyMessage?: string;
}

function fmtRel(n: number | null): string {
  if (n == null) return '\u2014';
  return n === 0 ? 'E' : n < 0 ? `\u2212${Math.abs(n)}` : `+${n}`;
}

function toParColor(n: number | null): string {
  if (n == null || n === 0) return EVEN_GRAY;
  return getScoreColor(n, 'light');
}

function summarizeBirdiesOrBetter(holes: CardScorecardHole[]): string {
  let eagles = 0;
  let birdies = 0;
  let aces = 0;
  for (const h of holes) {
    if (h.par == null || h.strokes == null || h.strokes <= 0) continue;
    if (h.strokes === 1) { aces++; continue; }
    const d = h.strokes - h.par;
    if (d <= -2) eagles++;
    else if (d === -1) birdies++;
  }
  const parts: string[] = [];
  if (aces) parts.push(`${aces} ace${aces > 1 ? 's' : ''}`);
  if (eagles) parts.push(`${eagles} eagle${eagles > 1 ? 's' : ''}`);
  if (birdies) parts.push(`${birdies} birdie${birdies > 1 ? 's' : ''}`);
  return parts.join(` ${'\u00B7'} `);
}

// ─── Grid ────────────────────────────────────────────────────────────────
const CELL_SIZE = 31;

const NineGrid: React.FC<{
  holes: CardScorecardHole[];
  label: string;
  startAt: number;
  span: number; // 9 for OUT/IN
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

// ─── Sheet ───────────────────────────────────────────────────────────────
export const CardScorecardSheet: React.FC<CardScorecardSheetProps> = ({
  open, onClose, eyebrowText, name, avatarUrl, onIdentityTap, subLine,
  holes, nineHole, rounds, headerRight, footerExtra, emptyMessage,
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
  const footerNote = summarizeBirdiesOrBetter(holes);
  const heroColor = totals.played ? toParColor(totals.toPar) : MUTED;

  return (
    <BottomSheet open={open} onClose={onClose} variant="light" surfaceColor={CANVAS} style={{ background: CANVAS }}>
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: GEIST, background: CANVAS, maxHeight: 'calc(90vh - 24px)', overflowY: 'auto' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 12px', borderBottom: `1px solid ${HAIRLINE}` }}>
          <button
            type="button"
            disabled={!onIdentityTap}
            onClick={onIdentityTap}
            style={{
              padding: 0, background: 'none', border: 'none', flexShrink: 0,
              cursor: onIdentityTap ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent',
            }}
            aria-label="View profile"
          >
            <SquircleAvatar src={avatarUrl ?? null} alt={name} size={44} hairlineRing />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...NUM, fontSize: 10.5, fontWeight: 800, color: EYEBROW, letterSpacing: '0.14em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {eyebrowText}
            </div>
            <button
              type="button"
              disabled={!onIdentityTap}
              onClick={onIdentityTap}
              style={{
                padding: 0, background: 'none', border: 'none', display: 'block',
                maxWidth: '100%', textAlign: 'left',
                cursor: onIdentityTap ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 16.5, fontWeight: 800, color: INK, letterSpacing: '-0.01em', display: 'block', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </span>
            </button>
            <div style={{ ...NUM, fontSize: 11.5, fontWeight: 600, color: SECONDARY, marginTop: 2 }}>
              {subLine}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ ...NUM, fontSize: 40, fontWeight: 200, letterSpacing: '-0.02em', lineHeight: 0.9, color: heroColor }}>
              {totals.played ? fmtRel(totals.toPar) : '\u2014'}
            </span>
            {headerRight}
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

        {holes.length === 0 ? (
          <div style={{ padding: '30px 16px 40px', textAlign: 'center', color: SECONDARY, fontSize: 13 }}>
            {emptyMessage ?? 'No hole-by-hole data yet.'}
          </div>
        ) : (
          <>
            {/* TRAJECTORY */}
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

            {/* GRIDS */}
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

        {/* FOOTER */}
        <div style={{
          padding: '14px 16px calc(14px + env(safe-area-inset-bottom, 0px))',
          borderTop: `1px solid ${HAIRLINE}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: GEIST, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', color: SECONDARY }}>
              TOTAL
            </span>
            <span style={{ ...NUM, fontSize: 26, fontWeight: 200, color: INK, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {totals.played ? totals.gross : '\u2014'}
            </span>
            {totals.played && (
              <span style={{ ...NUM, fontSize: 15, fontWeight: 800, color: toParColor(totals.toPar) }}>
                {fmtRel(totals.toPar)}
              </span>
            )}
          </div>
          {footerNote && (
            <div style={{ ...NUM, fontSize: 11, fontWeight: 600, color: SECONDARY, textAlign: 'right' }}>
              {footerNote}
            </div>
          )}
        </div>

        {footerExtra}
      </div>
    </BottomSheet>
  );
};

export default CardScorecardSheet;
