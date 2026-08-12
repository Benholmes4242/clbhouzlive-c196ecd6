import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useCounters, useAllScores } from '@/lib/whs/hooks';
import { fmtDiff, fmtAxis } from '@/lib/whs/format';
import { projectNextRound } from '@/lib/whs/handicapMath';
import { DarkSectionHeader } from './_shared/darkAtoms';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { formatDayMonthShortGB } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  connectionId: string;
  currentHandicap: number | null;
  /**
   * Profile owner. Threaded to RoundDetailSheet as profileUserId: without it
   * the scorecard cannot resolve the player name or ownership and falls back
   * to third-person copy with an empty subject.
   */
  userId?: string | null;
  /** 'owner' (default) shows first-person copy; 'friend' uses possessive + ownerFirstName. */
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

// ── Tokens ────────────────────────────────────────────────────────────────
const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const NUM: React.CSSProperties = { fontFamily: FONT_SF, fontVariantNumeric: 'tabular-nums lining' };

const GOOD = '#55BD8B';
const AMBER = '#F7931E';
const WARN = '#DE9A62';
const INK = 'var(--hcp-t-100)';
const DIM = 'var(--hcp-t-60)';
const FAINT = 'var(--hcp-t-40)';
const LINE = 'var(--hcp-line)';

// ── Chart geometry ────────────────────────────────────────────────────────
const W = 358;
const H = 108;
const PADX = 8;
const PADR = 30; // right axis gutter

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const fmtDate = (iso: string) => {
  try {
    return formatDayMonthShortGB(iso);
  } catch {
    return '';
  }
};

// ── Skeleton ──────────────────────────────────────────────────────────────
const CardSkeleton: React.FC = () => (
  <section style={{ marginTop: 32 }}>
    <DarkSectionHeader eyebrow="ROUNDS THAT COUNT" title="" />
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          background: 'var(--hcp-bg-1)',
          border: `1px solid ${LINE}`,
          borderRadius: 18,
          padding: '16px 14px 12px',
        }}
      >
        <Skeleton variant="dark" style={{ height: 10, borderRadius: 2 }} />
        <Skeleton
          variant="dark"
          style={{
            height: 40,
            borderRadius: 11,
            margin: '10px 0 8px',
          }}
        />
        <Skeleton variant="dark" style={{ height: 108, borderRadius: 4 }} />
        <Skeleton
          variant="dark"
          style={{ height: 12, borderRadius: 2, marginTop: 12 }}
        />
      </div>
    </div>
  </section>
);


// ── Component ─────────────────────────────────────────────────────────────
export const RoundsThatCountCard: React.FC<Props> = ({
  connectionId,
  currentHandicap,
  userId = null,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { data: counters, isLoading, isError, refetch } = useCounters(connectionId);
  const { data: allScores } = useAllScores(connectionId);

  // Chronological (oldest → newest) window of up to 20 rounds.
  // Counter flag comes from the existing useCounters set.
  // Falling-off-soon set mirrors countersAtRiskInHorizon in
  // src/lib/whs/forecast.ts (~L159): counters among the 5 OLDEST of a FULL
  // 20-round window. Replicated inline because the set is not exported.
  const enriched = useMemo(() => {
    if (!allScores || allScores.length === 0) return null;
    const counterIds = new Set((counters ?? []).map((c) => c.id));
    const window20 = allScores.slice(0, 20);
    const chrono = [...window20].sort(
      (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
    );
    const rounds = chrono.map((r) => ({
      id: r.id,
      play_date: r.play_date,
      diff: r.handicap_differential ?? null,
      is_counter: counterIds.has(r.id),
    }));
    const n = rounds.length;
    const fallingSet = new Set<string>();
    if (n === 20) {
      for (let i = 0; i < 5; i++) {
        if (rounds[i].is_counter) fallingSet.add(rounds[i].id);
      }
    }
    return { rounds, n, fallingSet };
  }, [allScores, counters]);

  const projection = useMemo(() => {
    if (!allScores || allScores.length < 8 || currentHandicap == null) return null;
    return projectNextRound(allScores.slice(0, 20), currentHandicap);
  }, [allScores, currentHandicap]);

  const [sel, setSel] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [sheetScoreId, setSheetScoreId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (isLoading) return <CardSkeleton />;

  // Error branch — keep the section frame + header, surface a muted line
  // and a small Retry. Other sections self-hide on error (intended degrade).
  if (isError) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="ROUNDS THAT COUNT" title="" />
        <div style={{ padding: '0 16px' }}>
          <div
            style={{
              background: 'var(--hcp-bg-1)',
              border: `1px solid ${LINE}`,
              borderRadius: 18,
              padding: '20px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              fontFamily: FONT_SF,
            }}
          >
            <div style={{ fontSize: 12, color: DIM }}>
              Couldn't load your rounds.
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${LINE}`,
                color: INK,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT_SF,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!enriched || enriched.n === 0 || currentHandicap == null) return null;

  const { rounds, n, fallingSet } = enriched;

  // n < 2 — empty state (no chart, no readout, no footer).
  if (n < 2) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="ROUNDS THAT COUNT" title="" />
        <div style={{ padding: '0 16px' }}>
          <div
            style={{
              background: 'var(--hcp-bg-1)',
              border: `1px solid ${LINE}`,
              borderRadius: 18,
              padding: '20px 14px',
              textAlign: 'center',
              color: DIM,
              fontFamily: FONT_SF,
              fontSize: 12,
            }}
          >
            Post a couple of rounds to see your counters here.
          </div>
        </div>
      </section>
    );
  }

  const counterCount = rounds.filter((r) => r.is_counter).length;
  const selIdx = clamp(sel ?? n - 1, 0, n - 1);
  const selected = rounds[selIdx];

  // Chart scales — over ALL rounds so the line never leaves the plot.
  const diffs = rounds.map((r) => r.diff ?? 0);
  const dataMin = Math.min(...diffs);
  const dataMax = Math.max(...diffs);
  const range = Math.max(dataMax - dataMin, 0.5);
  const x = (i: number) =>
    n === 1 ? PADX : PADX + (i / (n - 1)) * (W - PADX - PADR);
  const y = (v: number) => 12 + (1 - (v - dataMin) / range) * (H - 34);

  const linePath = rounds
    .map((r, i) => {
      const v = r.diff ?? 0;
      return `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`;
    })
    .join(' ');

  // Three ticks; collapse to min/max if the range is tight.
  const rawHi = Math.floor(dataMax);
  const rawLo = Math.ceil(dataMin);
  let ticks: number[];
  if (range < 2 || rawHi <= rawLo) {
    ticks = Array.from(
      new Set([Math.floor(dataMin), Math.ceil(dataMax)]),
    ).sort((a, b) => b - a);
  } else {
    const mid = Math.round((dataMin + dataMax) / 2);
    ticks = Array.from(new Set([rawHi, mid, rawLo])).sort((a, b) => b - a);
  }

  const pick = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const t = clamp((px - PADX) / (W - PADX - PADR), 0, 1);
    setSel(Math.round(t * (n - 1)));
  };

  // Falls-off-in: full window only. Chronological idx i → i+1 rounds.
  const fallsIn =
    n === 20 && fallingSet.has(selected.id) ? selIdx + 1 : null;

  // Status label + colours for readout row.
  let statusLabel: string;
  let statusColor: string;
  let diffColor: string;
  if (selected.is_counter) {
    if (fallsIn != null) {
      statusLabel = `COUNTS · FALLS OFF IN ${fallsIn} ROUND${fallsIn === 1 ? '' : 'S'}`;
      statusColor = AMBER;
      diffColor = AMBER;
    } else {
      statusLabel = 'COUNTS';
      statusColor = GOOD;
      diffColor = GOOD;
    }
  } else {
    statusLabel = "DOESN'T COUNT";
    statusColor = FAINT;
    diffColor = DIM;
  }

  // Next-round footer numbers.
  const cutT = projection?.hasData ? projection.cutTarget : null;
  // riseThreshold exists only when a counter exits on the very next round —
  // i.e. the chronologically oldest round in a full window is a counter.
  // Derived as the 9th-best differential in the window (index 8 asc).
  const anyExitsNext = n === 20 && rounds[0].is_counter;
  let riseT: number | null = null;
  if (anyExitsNext) {
    const sortedAsc = [...diffs].sort((a, b) => a - b);
    riseT = sortedAsc[8] ?? null;
  }

  const ownerToken =
    viewMode === 'friend'
      ? ownerFirstName
        ? `${ownerFirstName.toUpperCase()}'S`
        : 'THEIR'
      : 'YOUR';
  const legendOwnerLabel = `COUNTS TOWARD ${ownerToken} INDEX`;

  const fadeId = `rtc-fade-${connectionId}`;

  return (
    <>
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="ROUNDS THAT COUNT" title="" />
        <div style={{ padding: '0 16px' }}>
          <div
            style={{
              background: 'var(--hcp-bg-1)',
              border: `1px solid ${LINE}`,
              borderRadius: 18,
              padding: '16px 14px 12px',
              fontFamily: FONT_SF,
            }}
          >
            {/* 1. Header row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '0 4px',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: DIM,
                }}
              >
                LAST {n} ROUNDS
              </span>
              <span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: GOOD,
                    ...NUM,
                  }}
                >
                  {counterCount}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: FAINT,
                    marginLeft: 4,
                  }}
                >
                  COUNT
                </span>
              </span>
            </div>

            {/* 2. Readout row */}
            <button
              type="button"
              onClick={() => setSheetScoreId(selected.id)}
              aria-label={`Open round from ${fmtDate(selected.play_date)}`}
              style={{
                display: 'flex',
                width: '100%',
                margin: '10px 0 2px',
                padding: '9px 12px',
                borderRadius: 11,
                background: 'rgba(255,255,255,0.035)',
                border: `1px solid ${LINE}`,
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
                minHeight: 40,
                cursor: 'pointer',
                fontFamily: FONT_SF,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 9,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    ...NUM,
                  }}
                >
                  {fmtDate(selected.play_date)}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: diffColor,
                    ...NUM,
                  }}
                >
                  {selected.diff != null ? fmtDiff(selected.diff) : '—'}
                </span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 9,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </span>
                <ChevronRight size={13} color={FAINT} />
              </span>
            </button>

            {/* 3. Chart */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              preserveAspectRatio="none"
              style={{ display: 'block', touchAction: 'none', marginTop: 4 }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setScrubbing(true);
                pick(e.clientX);
              }}
              onPointerMove={(e) => {
                if (scrubbing) pick(e.clientX);
              }}
              onPointerUp={() => setScrubbing(false)}
              onPointerLeave={() => setScrubbing(false)}
              onPointerCancel={() => setScrubbing(false)}
            >
              {n === 20 && (
                <defs>
                  <linearGradient
                    id={fadeId}
                    x1="0"
                    x2="1"
                    y1="0"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#15171F" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#15171F" stopOpacity="0" />
                  </linearGradient>
                </defs>
              )}

              {/* a. Gridlines + right-anchored labels */}
              {ticks.map((t, i) => (
                <g key={`tick-${i}`}>
                  <line
                    x1={PADX}
                    x2={W - PADR + 4}
                    y1={y(t)}
                    y2={y(t)}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={1}
                  />
                  <text
                    x={W - 2}
                    y={y(t) + 3}
                    textAnchor="end"
                    fill={FAINT}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      ...NUM,
                    }}
                  >
                    {fmtAxis(t)}
                  </text>
                </g>
              ))}

              {/* b. Scrub hairline */}
              <line
                x1={x(selIdx)}
                x2={x(selIdx)}
                y1={8}
                y2={H - 18}
                stroke="rgba(242,244,247,0.22)"
                strokeWidth={1}
              />

              {/* c. Line */}
              <path
                d={linePath}
                fill="none"
                stroke="rgba(242,244,247,0.28)"
                strokeWidth={1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* d. Counter dots */}
              {rounds.map((r, i) => {
                if (!r.is_counter) return null;
                const isSel = i === selIdx;
                const isAmber = fallingSet.has(r.id);
                return (
                  <circle
                    key={r.id}
                    cx={x(i)}
                    cy={y(r.diff ?? 0)}
                    r={isSel ? 5 : 3.8}
                    fill={isAmber ? AMBER : GOOD}
                  />
                );
              })}

              {/* e. Selected non-counter marker */}
              {!selected.is_counter && (
                <circle
                  cx={x(selIdx)}
                  cy={y(selected.diff ?? 0)}
                  r={4.4}
                  fill="var(--hcp-bg-1)"
                  stroke="rgba(242,244,247,0.5)"
                  strokeWidth={1.6}
                />
              )}

              {/* f. Left-edge fade — full-window only */}
              {n === 20 && (
                <rect
                  x={0}
                  y={0}
                  width={x(4.5)}
                  height={H - 16}
                  fill={`url(#${fadeId})`}
                  pointerEvents="none"
                />
              )}

              {/* g. Axis words */}
              <text
                x={PADX}
                y={H - 3}
                fill={FAINT}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                }}
              >
                OLDEST
              </text>
              <text
                x={W - PADR}
                y={H - 3}
                textAnchor="end"
                fill={FAINT}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                }}
              >
                NEWEST
              </text>
            </svg>

            {/* 4. Legend */}
            <div
              style={{
                display: 'flex',
                gap: 14,
                padding: '8px 4px 0',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: GOOD,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: FAINT,
                  }}
                >
                  {legendOwnerLabel}
                </span>
              </span>
              {fallingSet.size > 0 && (
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: AMBER,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: FAINT,
                    }}
                  >
                    FALLING OFF SOON
                  </span>
                </span>
              )}
            </div>

            {/* 5. Next-round row */}
            <div
              style={{
                borderTop: `1px solid ${LINE}`,
                marginTop: 10,
                paddingTop: 10,
                paddingLeft: 4,
                paddingRight: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: DIM,
                }}
              >
                NEXT ROUND
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {n < 20 ? (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: FAINT,
                    }}
                  >
                    EVERY ROUND COUNTS RIGHT NOW
                  </span>
                ) : (
                  <>
                    {cutT != null && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: GOOD,
                            ...NUM,
                          }}
                        >
                          {fmtDiff(cutT)}−
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            color: GOOD,
                          }}
                        >
                          CUTS ▼
                        </span>
                      </span>
                    )}
                    {riseT != null ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: WARN,
                            ...NUM,
                          }}
                        >
                          {fmtDiff(riseT)}+
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            color: WARN,
                          }}
                        >
                          RISES ▲
                        </span>
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          color: FAINT,
                        }}
                      >
                        CAN'T RISE
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      <RoundDetailSheet
        open={sheetScoreId != null}
        onClose={() => setSheetScoreId(null)}
        scoreId={sheetScoreId}
        connectionId={connectionId}
        profileUserId={userId}
        handicapDelta={null}
      />
    </>
  );
};

export default RoundsThatCountCard;
