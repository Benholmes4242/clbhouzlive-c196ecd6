import React, { useState } from 'react';
import { format } from 'date-fns';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
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
const WHITE_18 = 'rgba(255,255,255,0.18)';
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

  const breakdown = React.useMemo(() => {
    if (!roundDetail?.holes || !roundDetail.hole_by_hole_fetched) return null;
    const counts = { eagle: 0, birdie: 0, par: 0, bogey: 0, doublePlus: 0 };
    for (const h of roundDetail.holes) {
      if (!h.played || h.actual_gross == null || h.par == null) continue;
      const diff = h.actual_gross - h.par;
      if (diff <= -2) counts.eagle++;
      else if (diff === -1) counts.birdie++;
      else if (diff === 0) counts.par++;
      else if (diff === 1) counts.bogey++;
      else counts.doublePlus++;
    }
    return counts;
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

  const delta = lastRound.handicap_delta ?? null;
  const par = (lastRound.course as any)?.par ?? null;

  return (
    <>
      <section style={{ marginTop: 28, fontFamily: FONT_GEIST }}>
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
                gap: 16,
                padding: '16px 18px 14px',
                color: '#fff',
              }}
            >
              {/* TOP ROW */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: AMBER,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    · {relativeDay(lastRound.play_date).toUpperCase()} · LAST ROUND
                  </div>
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
                  {(lastRound.course_rating || lastRound.slope_rating) && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: WHITE_55,
                        letterSpacing: '0.06em',
                        marginTop: 4,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {lastRound.course_rating?.toFixed(1) ?? '—'}/{lastRound.slope_rating ?? '—'}
                    </div>
                  )}
                </div>
                <HcpImpactPill delta={delta} />
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
                      marginBottom: 4,
                    }}
                  >
                    GROSS
                  </div>
                  <div
                    style={{
                      fontSize: 88,
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
                    adjustedGross={lastRound.adjusted_gross ?? null}
                    par={par}
                    differential={lastRound.handicap_differential ?? null}
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
                        fontSize: 32,
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
              {roundDetail?.holes && roundDetail.hole_by_hole_fetched && breakdown && (
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.14)',
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      color: WHITE_45,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    HOLE BY HOLE
                  </div>
                  <HoleStrip holes={roundDetail.holes} />
                  <BreakdownLine breakdown={breakdown} />
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
      />
    </>
  );
};

const HcpImpactPill: React.FC<{ delta: number | null }> = ({ delta }) => {
  if (delta == null) return null;
  const isUnchanged = Math.abs(delta) < 0.05;
  const isCut = delta < -0.05;
  const Icon = isUnchanged ? Minus : isCut ? TrendingDown : TrendingUp;
  const iconColor = isUnchanged ? WHITE_65 : isCut ? GREEN_BRIGHT : RED_BRIGHT;
  const label = isUnchanged
    ? 'HCP UNCHANGED'
    : isCut
    ? `↓ ${Math.abs(delta).toFixed(1)}`
    : `↑ ${Math.abs(delta).toFixed(1)}`;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 9px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.10)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        flexShrink: 0,
      }}
    >
      <Icon size={11} color={iconColor} strokeWidth={2.5} />
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: WHITE_85,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {label}
      </span>
    </div>
  );
};

const ToParDiffStrip: React.FC<{
  adjustedGross: number | null;
  par: number | null;
  differential: number | null;
}> = ({ adjustedGross, par, differential }) => {
  const parts: string[] = [];
  if (adjustedGross != null && par != null) {
    const dp = adjustedGross - par;
    parts.push(`${dp > 0 ? '+' : ''}${dp} TO PAR`);
  }
  if (differential != null) {
    parts.push(`${fmtDiff(differential)} DIFF`);
  }
  if (parts.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 6,
        fontSize: 11,
        fontWeight: 700,
        color: AMBER,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {parts.join(' · ')}
    </div>
  );
};

const HoleStrip: React.FC<{ holes: HoleRow[] }> = ({ holes }) => (
  <div style={{ display: 'flex', gap: 2, width: '100%' }}>
    {holes.map((h, i) => {
      let color = WHITE_18;
      if (h.played && h.actual_gross != null && h.par != null) {
        const diff = h.actual_gross - h.par;
        if (diff < 0) color = GREEN_BRIGHT;
        else if (diff === 0) color = WHITE_18;
        else if (diff === 1) color = AMBER;
        else color = RED_BRIGHT;
      }
      return (
        <div
          key={i}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 1,
            background: color,
          }}
        />
      );
    })}
  </div>
);

const BreakdownLine: React.FC<{
  breakdown: { eagle: number; birdie: number; par: number; bogey: number; doublePlus: number };
}> = ({ breakdown }) => {
  const birdieTotal = breakdown.eagle + breakdown.birdie;
  const itemStyle = (color: string): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 800,
    color,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    fontVariantNumeric: 'tabular-nums',
  });
  const sep: React.CSSProperties = {
    color: WHITE_45,
    fontSize: 10,
    fontWeight: 700,
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
      }}
    >
      <span style={itemStyle(GREEN_BRIGHT)}>
        {birdieTotal} {birdieTotal === 1 ? 'BIRDIE' : 'BIRDIES'}
      </span>
      <span style={sep}>·</span>
      <span style={itemStyle(WHITE_85)}>
        {breakdown.par} {breakdown.par === 1 ? 'PAR' : 'PARS'}
      </span>
      <span style={sep}>·</span>
      <span style={itemStyle(AMBER)}>
        {breakdown.bogey} {breakdown.bogey === 1 ? 'BOG' : 'BOGS'}
      </span>
      <span style={sep}>·</span>
      <span style={itemStyle(RED_BRIGHT)}>
        {breakdown.doublePlus} DBL+
      </span>
    </div>
  );
};

export default LastRoundCard;
