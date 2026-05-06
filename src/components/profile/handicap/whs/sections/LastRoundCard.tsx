import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useLastRound } from '@/lib/whs/hooks';
import RoundDetailSheet from './round-detail/RoundDetailSheet';

interface Props {
  connectionId: string;
}

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const BG = '#F8FAFC';
const GREEN = '#059669';
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
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <section style={{ padding: '0 16px', marginBottom: 28 }}>
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-24 bg-muted/60 rounded mb-2" />
          <div className="h-[160px] w-full bg-muted rounded-2xl" />
        </div>
      </section>
    );
  }

  if (!lastRound) {
    return (
      <section style={{ padding: '0 16px', marginBottom: 28 }}>
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
  const hcpAfter = lastRound.handicap_index_at_time ?? null;
  const hcpBefore = hasMovement && hcpAfter !== null ? hcpAfter - delta! : null;

  const statusWord = !hasMovement
    ? 'first counted round'
    : delta === 0
    ? 'unchanged'
    : isImprovement
    ? 'dropped'
    : 'rose';

  const arrowColor = isImprovement ? GREEN : INK;

  const imageUrl = lastRound.course_thumbnail_image;
  const thumbStyle: React.CSSProperties = imageUrl
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, #6b7c5e, #2d3a26)',
      };

  return (
    <section style={{ padding: '0 16px', marginBottom: 28, fontFamily: FONT_GEIST }}>
      {/* Eyebrow */}
      <div className="flex items-center justify-between mb-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: INK_55,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Last round
          </span>
        </div>
        <span style={{ fontSize: 12, color: INK_55 }}>{relativeDay(lastRound.play_date)}</span>
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label={`View detail for ${lastRound.course?.name ?? 'last round'}`}
        style={{
          width: '100%',
          background: '#fff',
          border: `0.5px solid ${INK_10}`,
          borderRadius: 14,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontFamily: FONT_GEIST,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              flexShrink: 0,
              ...thumbStyle,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {lastRound.course?.name ?? 'Unknown course'}
            </div>
            <div
              style={{
                fontSize: 12,
                color: INK_55,
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {lastRound.marker_name ?? 'Tee'} · {lastRound.course_rating ?? '—'}/
              {lastRound.slope_rating ?? '—'} · {relativeDay(lastRound.play_date)}
            </div>
          </div>
          <ChevronRight size={16} color={INK_40} style={{ flexShrink: 0 }} />
        </div>

        {/* Stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
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
                background: BG,
                borderRadius: 10,
                padding: '10px 8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: INK_55,
                  letterSpacing: '0.14em',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Index footer chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: INK_06,
            borderRadius: 10,
            padding: '8px 12px',
          }}
        >
          <span style={{ fontSize: 13, color: INK_55, fontWeight: 500 }}>Index</span>
          {hasMovement && hcpBefore !== null && hcpAfter !== null ? (
            <span
              style={{
                fontSize: 13,
                color: INK,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {hcpBefore.toFixed(1)}{' '}
              <span style={{ color: arrowColor }}>{'\u2192'}</span> {hcpAfter.toFixed(1)}
            </span>
          ) : hcpAfter !== null ? (
            <span
              style={{
                fontSize: 13,
                color: INK,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {hcpAfter.toFixed(1)}
            </span>
          ) : null}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: INK_55 }}>{statusWord}</span>
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
