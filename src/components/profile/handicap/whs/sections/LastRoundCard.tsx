import React, { useState } from 'react';
import { ChevronRight, ArrowDown, ArrowUp, Minus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLastRound } from '@/lib/whs/hooks';
import LastRoundSheet from './last-round/LastRoundSheet';

interface Props {
  connectionId: string;
}

const GREEN = '#34D399';
const RED = '#FB7185';
const INK_55 = 'rgba(15,23,42,0.55)';
const FONT_SERIF = 'Georgia, serif';

const fmtDiff = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};

const fmtHcpChange = (n: number) => {
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
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <section className="px-3 mb-7">
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-24 bg-muted/60 rounded mb-2" />
          <div className="h-[240px] w-full bg-muted rounded-2xl" />
        </div>
      </section>
    );
  }

  if (!lastRound) {
    return (
      <section className="px-3 mb-7">
        <p className="text-[14px] text-muted-foreground">
          Your rounds will appear here as soon as you start posting scores in MyEG.
        </p>
      </section>
    );
  }

  const delta = lastRound.handicap_delta ?? null;
  const hasMovement = delta !== null && delta !== undefined;
  const isImprovement = hasMovement && delta! < 0;
  const isWorse = hasMovement && delta! > 0;
  const stripeColor = isImprovement ? GREEN : isWorse ? RED : 'rgba(255,255,255,0.3)';
  const Arrow = isImprovement ? ArrowDown : isWorse ? ArrowUp : Minus;
  const arrowColor = isImprovement ? GREEN : isWorse ? RED : 'rgba(255,255,255,0.85)';
  const hcpAfter = lastRound.handicap_index_at_time ?? null;
  const hcpBefore = hasMovement && hcpAfter !== null ? hcpAfter - delta! : null;
  const captionText =
    !hasMovement
      ? 'First counted round'
      : delta === 0
      ? 'Index unchanged'
      : isImprovement
      ? 'Index dropped'
      : 'Index went up';

  const imageUrl = lastRound.course_thumbnail_image;
  const cardBg: React.CSSProperties = imageUrl
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: '#0F172A' };

  return (
    <section className="px-3 mb-7">
      {/* Eyebrow — outside the image */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: INK_55 }}>
          LAST ROUND
        </p>
        <p className="text-[12px]" style={{ color: INK_55 }}>
          {relativeDay(lastRound.play_date)}
        </p>
      </div>

      <button
        onClick={() => setSheetOpen(true)}
        aria-label={`View detail for ${lastRound.course?.name ?? 'last round'}`}
        style={{
          width: '100%',
          textAlign: 'left',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          position: 'relative',
          minHeight: 240,
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'opacity 150ms ease',
          ...cardBg,
        }}
        onMouseDown={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        onTouchStart={(e) => (e.currentTarget.style.opacity = '0.85')}
        onTouchEnd={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {/* Top color stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: stripeColor,
            zIndex: 3,
          }}
        />

        {/* Slate gradient scrim */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.45) 40%, rgba(15,23,42,0.85) 100%)',
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 240 }}>
          {/* Course header */}
          <div style={{ paddingRight: 24 }}>
            <h3
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 19,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.15,
                margin: 0,
                textShadow: '0 1px 2px rgba(0,0,0,0.35)',
              }}
            >
              {lastRound.course?.name ?? 'Unknown course'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                {lastRound.marker_name ?? 'Tee'} · {lastRound.course_rating ?? '—'}/{lastRound.slope_rating ?? '—'}
              </span>
              {lastRound.is_counter && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(52,211,153,0.20)',
                    color: GREEN,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  <CheckCircle2 size={10} /> Counter
                </span>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              {
                label: 'GROSS',
                value:
                  lastRound.adjusted_gross !== null && lastRound.adjusted_gross !== undefined
                    ? String(lastRound.adjusted_gross)
                    : '—',
              },
              {
                label: 'STABLEFORD',
                value:
                  lastRound.stableford_points !== null && lastRound.stableford_points !== undefined
                    ? String(lastRound.stableford_points)
                    : '—',
              },
              { label: 'DIFF', value: fmtDiff(lastRound.handicap_differential) },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(140%)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 10,
                  padding: '8px 6px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.65)',
                    letterSpacing: 1,
                    marginBottom: 2,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Movement banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px) saturate(140%)',
              WebkitBackdropFilter: 'blur(12px) saturate(140%)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 10,
              padding: '8px 12px',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Arrow size={14} color={arrowColor} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {hasMovement && hcpBefore !== null && hcpAfter !== null ? (
                <>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.1,
                    }}
                  >
                    {hcpBefore.toFixed(1)} → {hcpAfter.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 1 }}>
                    {captionText}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{captionText}</div>
              )}
            </div>
            {hasMovement && delta !== 0 && (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isImprovement ? GREEN : RED,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmtHcpChange(delta!)}
              </div>
            )}
          </div>
        </div>

        <ChevronRight
          size={18}
          strokeWidth={2.2}
          color="rgba(255,255,255,0.85)"
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 4 }}
        />
      </button>

      <LastRoundSheet
        connectionId={connectionId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </section>
  );
};

export default LastRoundCard;
