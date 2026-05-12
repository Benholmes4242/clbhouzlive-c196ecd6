import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { useLastRound, useRoundDetail } from '@/lib/whs/hooks';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import SectionHeader from './SectionHeader';

interface Props {
  connectionId: string;
}

const AMBER = '#F7931E';
const GREEN_BRIGHT = '#10B981';
const RED_BRIGHT = '#E11D48';
const WHITE_45 = 'rgba(255,255,255,0.45)';
const WHITE_55 = 'rgba(255,255,255,0.55)';
const WHITE_65 = 'rgba(255,255,255,0.65)';
const WHITE_85 = 'rgba(255,255,255,0.85)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const fmtDiff = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const relativeDay = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return format(d, 'd MMM');
};

type RoundDetailData = NonNullable<ReturnType<typeof useRoundDetail>['data']>;
type HoleRow = RoundDetailData['holes'][number];

export const LastRoundCard: React.FC<Props> = ({ connectionId }) => {
  const { data: lastRound, isLoading } = useLastRound(connectionId);
  const { data: roundDetail } = useRoundDetail(lastRound?.id, !!lastRound?.id);
  const [sheetOpen, setSheetOpen] = useState(false);

  const par = React.useMemo<number | null>(() => {
    if (!roundDetail?.holes || !roundDetail.hole_by_hole_fetched) return null;
    let total = 0;
    let any = false;
    for (const h of roundDetail.holes) {
      if (h.par != null) {
        total += h.par;
        any = true;
      }
    }
    return any ? total : null;
  }, [roundDetail]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 28 }}>
        <SectionHeader eyebrow="LAST ROUND" title="Loading…" />
        <div style={{ padding: '0 20px' }}>
          <div className="space-y-2 animate-pulse">
            <div className="h-[240px] w-full bg-muted rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!lastRound) {
    return (
      <section style={{ marginTop: 28 }}>
        <SectionHeader eyebrow="LAST ROUND" title="No rounds yet" />
        <div style={{ padding: '0 20px' }}>
          <p className="text-[14px] text-muted-foreground">
            Your rounds will appear here as soon as you start posting scores in MyEG.
          </p>
        </div>
      </section>
    );
  }



  return (
    <>
      <section style={{ marginTop: 28, fontFamily: FONT_GEIST }}>
        {/* External eyebrow — matches SectionHeader pattern */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 20px 8px',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 3,
              height: 8,
              borderRadius: 1,
              background: AMBER,
            }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: AMBER,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            LAST ROUND
          </span>
        </div>
        <div style={{ padding: '0 20px' }}>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={`Last round at ${lastRound.course?.name ?? 'course'}, gross ${lastRound.adjusted_gross ?? '—'} — open detail`}
            style={{
              display: 'block',
              width: '100%',
              margin: 0,
              padding: 0,
              border: 'none',
              borderRadius: 18,
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              background: 'linear-gradient(135deg, #0d4a30 0%, #103e25 100%)',
              minHeight: 240,
              textAlign: 'left',
              fontFamily: FONT_GEIST,
            }}
          >
            {/* Layer 0 — course image */}
            {lastRound.course_thumbnail_image ? (
              <img
                src={lastRound.course_thumbnail_image}
                alt=""
                loading="lazy"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : null}

            {/* Layer 1 — forest-green diagonal */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(150deg, rgba(15,77,46,0.78), rgba(16,62,37,0.86))',
              }}
            />

            {/* Layer 2 — top-left highlight */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.14), transparent 60%)',
              }}
            />

            {/* Layer 3 — bottom-darkening */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.45) 100%)',
              }}
            />

            {/* Layer 4 — content */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '14px 18px 12px',
                color: '#fff',
              }}
            >
              {/* TOP — course name + sub-line */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {lastRound.course?.name ?? 'Unknown course'}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: WHITE_55,
                    letterSpacing: '0.06em',
                    marginTop: 3,
                    fontVariantNumeric: 'tabular-nums',
                    textTransform: 'uppercase',
                  }}
                >
                  {[
                    relativeDay(lastRound.play_date).toUpperCase(),
                    par != null ? `PAR ${par}` : null,
                    lastRound.slope_rating != null ? `SL ${lastRound.slope_rating}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>

              {/* HERO */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: WHITE_45,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}
                  >
                    GROSS
                  </div>
                  <div
                    style={{
                      fontSize: 76,
                      fontWeight: 200,
                      color: '#fff',
                      letterSpacing: '-0.055em',
                      lineHeight: 0.85,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {lastRound.adjusted_gross ?? '—'}
                  </div>
                  <ToParDiffStrip
                    differential={lastRound.handicap_differential ?? null}
                    handicapDelta={lastRound.handicap_delta ?? null}
                  />
                </div>

                {lastRound.stableford_points != null && (
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        color: WHITE_45,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      STABLEFORD
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: WHITE_85,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {lastRound.stableford_points}
                    </div>
                  </div>
                )}
              </div>

              {/* BOTTOM */}
              {roundDetail?.holes && roundDetail.hole_by_hole_fetched && (
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.14)',
                    paddingTop: 10,
                    marginTop: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8.5,
                        fontWeight: 800,
                        color: WHITE_45,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                      }}
                    >
                      HOLE BY HOLE
                    </span>
                    <span
                      aria-hidden
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '4px 8px 4px 12px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.14)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#fff',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                      }}
                    >
                      View scorecard
                      <ChevronRight size={11} strokeWidth={2.6} />
                    </span>
                  </div>
                  <HoleStripTwoLine holes={roundDetail.holes} />
                </div>
              )}
            </div>
          </button>
        </div>
      </section>

      <RoundDetailSheet
        scoreId={lastRound.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        handicapDelta={lastRound.handicap_delta ?? null}
      />
    </>
  );
};

const ToParDiffStrip: React.FC<{
  differential: number | null;
  handicapDelta: number | null;
}> = ({ differential, handicapDelta }) => {
  const parts: string[] = [];
  if (differential != null) {
    parts.push(`${fmtDiff(differential)} DIFF`);
  }
  if (parts.length === 0 && handicapDelta == null) return null;

  const showHcp = handicapDelta != null && Math.abs(handicapDelta) >= 0.05;
  const hcpIsCut = showHcp && handicapDelta! < 0;
  const hcpColor = hcpIsCut ? GREEN_BRIGHT : RED_BRIGHT;
  const hcpMag = showHcp ? Math.abs(handicapDelta!).toFixed(1) : null;

  return (
    <div
      style={{
        marginTop: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: AMBER,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {parts.join(' · ')}
      </span>
      {showHcp && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 11,
            fontWeight: 800,
            color: hcpColor,
            letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hcpIsCut ? (
            <TrendingDown size={11} color={hcpColor} strokeWidth={2.5} />
          ) : (
            <TrendingUp size={11} color={hcpColor} strokeWidth={2.5} />
          )}
          {hcpMag}
        </span>
      )}
    </div>
  );
};

// ─── MiniHoleCell — strip-scale version of the bottom-sheet HoleCell ─────
// Verdict shape + score numeral. Same grammar as RoundHoleCell, smaller.
// Numerals always white at this scale (dark card context).
const STRIP_STROKE = 1.25;

const MiniShapePath: React.FC<{
  kind: 'circle' | 'square';
  inset: number;
  stroke: string;
  size: number;
}> = ({ kind, inset, stroke, size }) => {
  if (kind === 'circle') {
    const r = size / 2 - inset - STRIP_STROKE / 2;
    if (r <= 0) return null;
    return (
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={STRIP_STROKE}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  const dim = size - 2 * inset - STRIP_STROKE;
  if (dim <= 0) return null;
  return (
    <rect
      x={inset + STRIP_STROKE / 2}
      y={inset + STRIP_STROKE / 2}
      width={dim}
      height={dim}
      rx={2}
      ry={2}
      fill="none"
      stroke={stroke}
      strokeWidth={STRIP_STROKE}
      vectorEffect="non-scaling-stroke"
    />
  );
};

const MiniHoleCell: React.FC<{
  score: number | null;
  par: number;
  size?: number;
}> = ({ score, par, size = 18 }) => {
  let shape: 'circle' | 'square' | 'none' | 'empty' = 'none';
  let depth: 1 | 2 | 3 = 1;
  let stroke = WHITE_45;

  if (score == null) {
    shape = 'empty';
  } else {
    const diff = score - par;
    if (score === 1) {
      shape = 'circle'; depth = 3; stroke = AMBER;
    } else if (diff <= -3) {
      shape = 'circle'; depth = 3; stroke = AMBER;
    } else if (diff === -2) {
      shape = 'circle'; depth = 2; stroke = AMBER;
    } else if (diff === -1) {
      shape = 'circle'; depth = 1; stroke = AMBER;
    } else if (diff === 0) {
      shape = 'square'; depth = 1; stroke = WHITE_45;
    } else if (diff === 1) {
      shape = 'square'; depth = 1; stroke = WHITE_85;
    } else if (diff === 2) {
      shape = 'square'; depth = 2; stroke = WHITE_85;
    } else {
      shape = 'square'; depth = 3; stroke = WHITE_85;
    }
  }

  const showInnermostRing = false;
  const showTripleDot = depth >= 3 && shape !== 'empty';

  const showNumeral = score != null && score < 10;
  const showOverflowMarker = score != null && score >= 10;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {shape !== 'empty' && (
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          <MiniShapePath kind={shape} inset={0.5} stroke={stroke} size={size} />
          {depth >= 2 && (
            <MiniShapePath kind={shape} inset={2.5} stroke={stroke} size={size} />
          )}
          {showInnermostRing && (
            <MiniShapePath kind={shape} inset={size * 0.42} stroke={stroke} size={size} />
          )}
          {showNumeral && (
            <text
              x={size / 2}
              y={size / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              {score}
            </text>
          )}
          {showOverflowMarker && (
            <text
              x={size / 2}
              y={size / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              style={{
                fontSize: 9,
                fontWeight: 800,
                fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              }}
            >
              +
            </text>
          )}
        </svg>
      )}

      {showTripleDot && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -3,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: stroke,
          }}
        />
      )}

      {shape === 'empty' && (
        <div
          aria-hidden
          style={{
            width: '60%',
            height: 1,
            background: 'rgba(255,255,255,0.35)',
          }}
        />
      )}
    </div>
  );
};

// ─── NineRow — one row of 9 cells with label and per-nine total ─────────
const NineRow: React.FC<{
  label: string;
  holes: HoleRow[];
}> = ({ label, holes }) => {
  const total = holes.reduce(
    (s, h) => s + (h.played ? (h.adjusted_gross ?? h.actual_gross ?? 0) : 0),
    0,
  );
  const parTotal = holes.reduce((s, h) => s + (h.par ?? 0), 0);
  const anyPlayed = holes.some(
    (h) => h.played && (h.adjusted_gross != null || h.actual_gross != null),
  );
  const delta = anyPlayed ? total - parTotal : 0;
  const deltaStr = anyPlayed
    ? delta === 0
      ? 'E'
      : delta > 0
        ? `+${delta}`
        : `${delta}`
    : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          fontSize: 8.5,
          fontWeight: 800,
          color: WHITE_55,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          width: 28,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: 2,
        }}
      >
        {holes.map((h, i) => {
          const score = h.played ? (h.adjusted_gross ?? h.actual_gross ?? null) : null;
          return (
            <MiniHoleCell key={`${h.hole_no}-${i}`} score={score} par={h.par ?? 4} />
          );
        })}
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 4,
          width: 48,
          flexShrink: 0,
          justifyContent: 'flex-end',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          {anyPlayed ? total : '—'}
        </span>
        {anyPlayed && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: AMBER,
            }}
          >
            {deltaStr}
          </span>
        )}
      </span>
    </div>
  );
};

// ─── HoleStripTwoLine — OUT (front 9) and IN (back 9) rows ───────────────
const HoleStripTwoLine: React.FC<{ holes: HoleRow[] }> = ({ holes }) => {
  const sorted = [...holes].sort((a, b) => a.hole_no - b.hole_no);
  const front9 = sorted.filter(h => h.hole_no <= 9);
  const back9 = sorted.filter(h => h.hole_no > 9);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <NineRow label="OUT" holes={front9} />
      {back9.length > 0 && <NineRow label="IN" holes={back9} />}
    </div>
  );
};

export default LastRoundCard;
