import React, { useMemo } from 'react';
import { ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { useCounters } from '@/lib/whs/hooks';

interface Props {
  connectionId: string;
  currentHandicap: number | null;
}

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';
const GREEN = '#059669';
const RED = '#9F1D1D';
const FONT_DISPLAY =
  'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export const PredictionsCard: React.FC<Props> = ({
  connectionId,
  currentHandicap,
}) => {
  const { data: counters, isLoading } = useCounters(connectionId);

  const thresholds = useMemo(() => {
    if (!counters || counters.length === 0) return null;
    const validDiffs = counters
      .map((c) => c.handicap_differential)
      .filter((d): d is number => d !== null && d !== undefined);
    if (validDiffs.length === 0) return null;
    return {
      bestDiff: Math.min(...validDiffs),
      worstDiff: Math.max(...validDiffs),
    };
  }, [counters]);

  if (isLoading) {
    return (
      <section style={{ marginBottom: 24 }}>
        <div style={{ padding: '0 12px', marginBottom: 12 }}>
          <div
            className="animate-pulse"
            style={{ height: 14, width: 100, background: INK_06, borderRadius: 4, marginBottom: 8 }}
          />
          <div
            className="animate-pulse"
            style={{ height: 20, width: 220, background: INK_06, borderRadius: 4 }}
          />
        </div>
        <div style={{ padding: '0 12px' }}>
          <div
            className="animate-pulse"
            style={{ width: '100%', height: 140, background: INK_06, borderRadius: 14 }}
          />
        </div>
      </section>
    );
  }

  if (
    !thresholds ||
    !counters ||
    counters.length < 8 ||
    currentHandicap == null
  )
    return null;

  const axisMin = 0;
  const axisMax = Math.max(5, Math.ceil(thresholds.worstDiff + 0.5));
  const span = axisMax - axisMin;
  const bestPct = ((thresholds.bestDiff - axisMin) / span) * 100;
  const worstPct = ((thresholds.worstDiff - axisMin) / span) * 100;

  const bestLabel = `+${thresholds.bestDiff.toFixed(1)}`;
  const worstLabel = `+${thresholds.worstDiff.toFixed(1)}`;
  const hcpLabel = currentHandicap.toFixed(1);

  return (
    <section style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: '0 12px', marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: AMBER,
              animation: 'aqPulseDot 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: AMBER,
              textTransform: 'uppercase',
            }}
          >
            Active Quest
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.2,
          }}
        >
          What moves your handicap
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: INK_55,
            marginTop: 4,
            lineHeight: 1.35,
          }}
        >
          Beat the green marker on your next round to drop your index.
        </div>
      </div>

      {/* Card */}
      <div style={{ padding: '0 12px' }}>
        <button
          type="button"
          onClick={() => {
            /* No-op for now. Future: open explainer or course recommendation. */
          }}
          style={{
            position: 'relative',
            width: '100%',
            background: '#FFFFFF',
            border: `0.5px solid ${INK_10}`,
            borderRadius: 14,
            padding: '14px 14px 12px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'block',
          }}
        >
          {/* Chevron */}
          <ChevronRight
            size={16}
            color={INK_40}
            style={{ position: 'absolute', top: 12, right: 12 }}
          />

          {/* Top zone labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 18,
              paddingRight: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ArrowDown size={11} color={GREEN} strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: GREEN,
                    textTransform: 'uppercase',
                  }}
                >
                  Drop Zone
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: INK_55,
                  marginTop: 2,
                }}
              >
                Below {worstLabel}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: RED,
                    textTransform: 'uppercase',
                  }}
                >
                  Risk Zone
                </span>
                <ArrowUp size={11} color={RED} strokeWidth={2.5} />
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: INK_55,
                  marginTop: 2,
                }}
              >
                Above {bestLabel}
              </div>
            </div>
          </div>

          {/* Number-line */}
          <div
            style={{
              position: 'relative',
              height: 44,
              marginBottom: 4,
            }}
          >
            {/* Track */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 0,
                right: 0,
                height: 8,
                background: INK_06,
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              {/* Green tinted segment 0 -> worstPct */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${worstPct}%`,
                  background: 'rgba(5,150,105,0.18)',
                }}
              />
              {/* Red tinted segment bestPct -> 100% */}
              <div
                style={{
                  position: 'absolute',
                  left: `${bestPct}%`,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  background: 'rgba(159,29,29,0.18)',
                }}
              />
            </div>

            {/* Red line at bestDiff */}
            <div
              style={{
                position: 'absolute',
                left: `${bestPct}%`,
                top: 4,
                height: 24,
                width: 2,
                background: RED,
                transform: 'translateX(-50%)',
                borderRadius: 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${bestPct}%`,
                top: 30,
                transform: 'translateX(-50%)',
                fontFamily: FONT_DISPLAY,
                fontSize: 13,
                fontWeight: 700,
                color: RED,
                fontFeatureSettings: '"tnum" 1',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {bestLabel}
            </div>

            {/* Green line at worstDiff */}
            <div
              style={{
                position: 'absolute',
                left: `${worstPct}%`,
                top: 4,
                height: 24,
                width: 2,
                background: GREEN,
                transform: 'translateX(-50%)',
                borderRadius: 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${worstPct}%`,
                top: 30,
                transform: 'translateX(-50%)',
                fontFamily: FONT_DISPLAY,
                fontSize: 13,
                fontWeight: 700,
                color: GREEN,
                fontFeatureSettings: '"tnum" 1',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {worstLabel}
            </div>
          </div>

          {/* Footer caption */}
          <div
            style={{
              borderTop: `0.5px dashed ${INK_10}`,
              marginTop: 10,
              paddingTop: 10,
              fontSize: 11,
              fontWeight: 500,
              color: INK_55,
              lineHeight: 1.4,
            }}
          >
            Your current index is{' '}
            <span style={{ color: INK, fontWeight: 700 }}>{hcpLabel}</span>.
            Anything between {bestLabel} and {worstLabel} won't change it.
          </div>
        </button>
      </div>

      <style>{`
        @keyframes aqPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.85); }
        }
      `}</style>
    </section>
  );
};

export default PredictionsCard;
