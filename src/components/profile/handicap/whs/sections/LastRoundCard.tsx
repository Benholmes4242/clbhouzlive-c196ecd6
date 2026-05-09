import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLastRound, useRoundDetail } from '@/lib/whs/hooks';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import SectionHeader from './SectionHeader';

interface Props {
  connectionId: string;
}

const AMBER = '#F7931E';
const GOLD = '#FBBC2E';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const GREEN = '#15803D';
const RED = '#DC2626';
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
            <div className="h-[160px] w-full bg-muted rounded-2xl" />
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
  const hasMovement = delta !== null && delta !== undefined;
  const isImprovement = hasMovement && delta! < 0;
  const isWorse = hasMovement && delta! > 0;
  const hcpAfter = lastRound.handicap_index_at_time ?? null;
  const hcpBefore = hasMovement && hcpAfter !== null ? hcpAfter - delta! : null;

  const statusWord = !hasMovement
    ? 'first counted round'
    : delta === 0
    ? 'unchanged'
    : isImprovement
    ? 'dropped'
    : 'rose';

  const statusColor = !hasMovement || delta === 0 ? INK_55 : isImprovement ? GREEN : RED;
  const statusBg = !hasMovement || delta === 0
    ? 'rgba(15,23,42,0.06)'
    : isImprovement
    ? 'rgba(21,128,61,0.10)'
    : 'rgba(220,38,38,0.10)';

  const imageUrl = lastRound.course_thumbnail_image;
  const stripBg: React.CSSProperties = imageUrl
    ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${AMBER}, ${GOLD})` };

  const totalPar = roundDetail?.holes
    ? roundDetail.holes.filter((h: any) => h.played).reduce((s: number, h: any) => s + (h.par ?? 0), 0)
    : 0;

  const grossSub = (() => {
    if (lastRound.adjusted_gross == null || !totalPar) return '\u00A0';
    const dpar = lastRound.adjusted_gross - totalPar;
    return dpar === 0 ? 'level par' : dpar > 0 ? `+${dpar} to par` : `${dpar} to par`;
  })();

  const segments = breakdown
    ? [
        { count: breakdown.eagle + breakdown.birdie, color: GOLD },
        { count: breakdown.par, color: INK_40 },
        { count: breakdown.bogey, color: AMBER },
        { count: breakdown.doublePlus, color: RED },
      ].filter((s) => s.count > 0)
    : [];
  const segTotal = segments.reduce((s, x) => s + x.count, 0);

  const eyebrowLabel: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 800,
    color: INK_55,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
  };

  const heroNum: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 700,
    color: INK,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    marginTop: 3,
  };

  const heroSub: React.CSSProperties = {
    fontSize: 10.5,
    color: INK_55,
    marginTop: 3,
    minHeight: 13,
  };

  return (
    <section style={{ marginTop: 28, fontFamily: FONT_GEIST }}>
      <SectionHeader
        eyebrow="LAST ROUND"
        title={lastRound.course?.name ?? 'Last round'}
        right={<span style={{ fontSize: 12, color: INK_55 }}>{relativeDay(lastRound.play_date)}</span>}
      />
      <div style={{ padding: '0 20px' }}>

      {/* Card */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label={`View detail for ${lastRound.course?.name ?? 'last round'}`}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
          fontFamily: FONT_GEIST,
        }}
      >
        {/* Course image strip 16:5 */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 4', ...stripBg }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 100%)',
            }}
          />
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 12 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {lastRound.course?.name ?? 'Round'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.85)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {[
                lastRound.marker_name,
                lastRound.course_rating && lastRound.slope_rating
                  ? `${lastRound.course_rating}/${lastRound.slope_rating}`
                  : null,
                format(new Date(lastRound.play_date), 'd MMM yyyy'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Hero row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'start' }}>
            <div style={{ paddingRight: 12 }}>
              <div style={eyebrowLabel}>GROSS</div>
              <div style={heroNum}>{lastRound.adjusted_gross ?? '—'}</div>
              <div style={heroSub}>{grossSub}</div>
            </div>
            <div style={{ padding: '0 12px', borderLeft: `0.5px solid ${INK_10}`, borderRight: `0.5px solid ${INK_10}` }}>
              <div style={eyebrowLabel}>STABLEFORD</div>
              <div style={heroNum}>{lastRound.stableford_points ?? '—'}</div>
              <div style={heroSub}>points</div>
            </div>
            <div style={{ paddingLeft: 12 }}>
              <div style={eyebrowLabel}>DIFFERENTIAL</div>
              <div style={heroNum}>{fmtDiff(lastRound.handicap_differential)}</div>
              <div style={heroSub}>vs course</div>
            </div>
          </div>

          {/* Round breakdown */}
          {breakdown && segTotal > 0 ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div style={eyebrowLabel}>ROUND BREAKDOWN</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 11,
                    color: INK_55,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {[
                    { label: 'Birdie+', count: breakdown.eagle + breakdown.birdie, color: GOLD },
                    { label: 'Par', count: breakdown.par, color: INK_40 },
                    { label: 'Bogey', count: breakdown.bogey, color: AMBER },
                    { label: 'Double+', count: breakdown.doublePlus, color: RED },
                  ].map((s) => (
                    <span
                      key={s.label}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      aria-label={`${s.count} ${s.label}`}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: s.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: INK, fontWeight: 700 }}>{s.count}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: 'rgba(15,23,42,0.04)',
                }}
              >
                {segments.map((s, i) => (
                  <div
                    key={i}
                    style={{ flex: s.count, background: s.color, height: '100%' }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: INK_55, fontStyle: 'italic' }}>
              Hole-by-hole breakdown not yet synced for this round
            </div>
          )}

          {/* Index footer */}
          {hcpAfter !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: `0.5px solid ${INK_10}`,
              }}
            >
              <span style={{ fontSize: 11.5, color: INK_55 }}>Handicap index</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {hcpBefore != null
                  ? `${hcpBefore.toFixed(1)} → ${hcpAfter.toFixed(1)}`
                  : hcpAfter.toFixed(1)}
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: statusColor,
                    background: statusBg,
                    padding: '2px 7px',
                    borderRadius: 999,
                  }}
                >
                  {statusWord}
                </span>
              </span>
            </div>
          )}
        </div>
      </button>

      <RoundDetailSheet
        scoreId={lastRound.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </section>
  );
};

export default LastRoundCard;
