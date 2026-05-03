import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useCounters } from '@/lib/whs/hooks';

interface Props {
  connectionId: string;
}

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const BG = '#F8FAFC';

const FONT_DISPLAY =
  'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const FONT_GEIST =
  'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const fmtShortDay = (iso: string) => format(new Date(iso), 'd');
const fmtFullDate = (iso: string) => format(new Date(iso), 'd MMM yyyy');

export const CountersStrip: React.FC<Props> = ({ connectionId }) => {
  const { data: counters, isLoading } = useCounters(connectionId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAvg, setShowAvg] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const enriched = useMemo(() => {
    if (!counters || counters.length === 0) return null;
    const validDiffs = counters
      .map((c) => c.handicap_differential)
      .filter((d): d is number => d !== null && d !== undefined);
    if (validDiffs.length === 0) return null;
    const minDiff = Math.min(...validDiffs);
    const maxDiff = Math.max(...validDiffs);
    const avg = validDiffs.reduce((s, d) => s + d, 0) / validDiffs.length;
    return {
      counters: counters.map((c) => ({
        ...c,
        is_best: c.handicap_differential === minDiff,
      })),
      avg,
      diffMin: minDiff,
      diffMax: maxDiff,
    };
  }, [counters]);

  if (isLoading) {
    return (
      <section className="mb-8" style={{ padding: '0 12px' }}>
        <div
          style={{
            height: 16,
            width: 120,
            background: INK_06,
            borderRadius: 4,
            marginBottom: 12,
          }}
        />
        <div
          style={{
            height: 130,
            background: INK_06,
            borderRadius: 12,
            marginBottom: 12,
          }}
        />
        <div style={{ height: 64, background: INK_06, borderRadius: 12 }} />
      </section>
    );
  }

  if (!enriched) return null;

  const effectiveSelectedId = selectedId ?? enriched.counters[0]?.id ?? null;
  const selected =
    enriched.counters.find((c) => c.id === effectiveSelectedId) ??
    enriched.counters[0];

  const span = enriched.diffMax - enriched.diffMin || 1;
  const heightPctOf = (v: number) => 25 + ((v - enriched.diffMin) / span) * 70;
  const avgPct = heightPctOf(enriched.avg);

  return (
    <section className="mb-8" style={{ padding: '0 12px', fontFamily: FONT_GEIST }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: AMBER,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: AMBER_DEEP,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontFamily: FONT_DISPLAY,
              }}
            >
              Your 8 counters
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: INK_55,
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            Each round as a marker. Larger dot = above your counter average.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAvg((v) => !v)}
          style={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: 'uppercase',
            padding: '5px 10px',
            borderRadius: 999,
            border: showAvg ? '1px solid transparent' : `1px solid ${INK_10}`,
            background: showAvg ? INK : 'transparent',
            color: showAvg ? '#fff' : INK_55,
            fontFamily: FONT_DISPLAY,
            cursor: 'pointer',
          }}
        >
          AVG
        </button>
      </div>

      {/* Chart */}
      <div
        style={{
          position: 'relative',
          height: 130,
          paddingTop: 20,
          marginBottom: 0,
        }}
      >
        {/* Avg dashed line */}
        {showAvg && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${avgPct}%`,
              height: 0,
              borderTop: `1px dashed ${INK_40}`,
              pointerEvents: 'none',
              transition: 'bottom 300ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: 0,
                top: -6,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: 1,
                color: INK_55,
                background: BG,
                padding: '0 4px',
                fontFamily: FONT_DISPLAY,
              }}
            >
              AVG +{enriched.avg.toFixed(1)}
            </span>
          </div>
        )}

        {/* Stems + dots */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            height: '100%',
            alignItems: 'flex-end',
          }}
        >
          {enriched.counters.map((c) => {
            const diff = c.handicap_differential;
            if (diff === null || diff === undefined) {
              return <div key={c.id} style={{ flex: 1 }} />;
            }
            const isSelected = c.id === effectiveSelectedId;
            const isHover = c.id === hoverId;
            const isAboveAvg = diff > enriched.avg;
            const dotSize = isAboveAvg ? 12 : 8;
            const pct = heightPctOf(diff);

            const dotColor = isSelected
              ? AMBER
              : c.is_best
                ? AMBER
                : isHover
                  ? '#FCD9A8'
                  : INK_40;
            const stemColor = isSelected
              ? AMBER
              : c.is_best
                ? 'rgba(247,147,30,0.55)'
                : INK_10;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                onMouseEnter={() => setHoverId(c.id)}
                onMouseLeave={() =>
                  setHoverId((h) => (h === c.id ? null : h))
                }
                style={{
                  flex: 1,
                  position: 'relative',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                {/* +diff label above dot (selected or hovered) */}
                {(isSelected || isHover) && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: `calc(${pct}% + ${dotSize / 2 + 6}px)`,
                      transform: 'translateX(-50%)',
                      fontSize: 9,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: 0.3,
                      fontFamily: FONT_DISPLAY,
                      whiteSpace: 'nowrap',
                      opacity: isSelected ? 1 : 0.85,
                      transition: 'opacity 150ms ease',
                    }}
                  >
                    +{diff.toFixed(1)}
                  </span>
                )}
                {/* Stem */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 0,
                    width: isSelected ? 2 : 1,
                    height: `${pct}%`,
                    background: stemColor,
                    transform: 'translateX(-50%)',
                    transition:
                      'all 200ms ease, height 300ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                  }}
                />
                {/* Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: `${pct}%`,
                    width: dotSize,
                    height: dotSize,
                    borderRadius: '50%',
                    background: dotColor,
                    transform: 'translate(-50%, 50%)',
                    border: isSelected ? '2px solid #fff' : 'none',
                    boxShadow: isSelected ? `0 0 0 2px ${AMBER}` : 'none',
                    transition:
                      'all 200ms ease, bottom 300ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Date axis */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderTop: `1px solid ${INK_10}`,
          paddingTop: 8,
          marginBottom: 12,
        }}
      >
        {enriched.counters.map((c) => {
          const isSelected = c.id === effectiveSelectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                padding: '4px 0',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: FONT_DISPLAY,
                fontWeight: isSelected ? 800 : 700,
                color: isSelected ? INK : INK_55,
                letterSpacing: 0.2,
                tabularNums: 'tabular-nums' as any,
              }}
            >
              {fmtShortDay(c.play_date)}
            </button>
          );
        })}
      </div>

      {/* Detail card */}
      {selected && (
        <button
          key={selected.id}
          type="button"
          style={{
            width: '100%',
            display: 'block',
            textAlign: 'left',
            background: '#fff',
            border: `1px solid ${INK_10}`,
            borderRadius: 14,
            padding: '14px 14px',
            cursor: 'pointer',
            animation: 'whsCounterFade 250ms ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: selected.is_best ? AMBER_DEEP : INK_55,
                  fontFamily: FONT_DISPLAY,
                  marginBottom: 4,
                }}
              >
                {selected.is_best ? 'Best' : 'Diff'}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: INK,
                  fontFamily: FONT_DISPLAY,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {selected.handicap_differential !== null &&
                selected.handicap_differential !== undefined
                  ? selected.handicap_differential.toFixed(1)
                  : '—'}
              </div>
            </div>
            <div style={{ minWidth: 0, flex: 1.4, textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: INK,
                  marginBottom: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selected.course?.name ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: INK_55, fontWeight: 500 }}>
                {fmtFullDate(selected.play_date)}
                {selected.adjusted_gross != null
                  ? ` · Gross ${selected.adjusted_gross}`
                  : ''}
              </div>
            </div>
          </div>
        </button>
      )}

      <style>{`
        @keyframes whsCounterFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default CountersStrip;
