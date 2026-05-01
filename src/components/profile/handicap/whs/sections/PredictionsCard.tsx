import React, { useMemo } from 'react';
import { Zap, ChevronRight } from 'lucide-react';
import { useCounters } from '@/lib/whs/hooks';
import SectionHeader from './SectionHeader';

interface Props {
  connectionId: string;
}

const AMBER = '#F7931E';
const AMBER_INK = '#9A6116';

export const PredictionsCard: React.FC<Props> = ({ connectionId }) => {
  const { data: counters, isLoading } = useCounters(connectionId);

  const worst = useMemo(() => {
    if (!counters || counters.length === 0) return null;
    return (
      [...counters]
        .filter(
          (c) =>
            c.handicap_differential !== null &&
            c.handicap_differential !== undefined,
        )
        .sort(
          (a, b) =>
            (b.handicap_differential ?? 0) - (a.handicap_differential ?? 0),
        )[0] ?? null
    );
  }, [counters]);

  if (isLoading) {
    return (
      <section style={{ marginBottom: 24 }}>
        <SectionHeader eyebrow="Active Quest" title="Drop your worst counter" sub="Loading…" />
        <div style={{ padding: '0 20px' }}>
          <div
            className="animate-pulse"
            style={{
              width: '100%',
              height: 56,
              background: 'rgba(247,147,30,0.10)',
              borderRadius: 14,
            }}
          />
        </div>
      </section>
    );
  }

  if (!counters || counters.length < 8 || !worst) return null;

  const diff = (worst.handicap_differential ?? 0).toFixed(1);
  const courseName = worst.course?.name ?? 'a recent course';
  const subText = `Beat ${diff} at ${courseName} on your next round and your handicap drops automatically.`;

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        eyebrow="Active Quest"
        title="Drop your worst counter"
        sub={subText}
      />
      <div style={{ padding: '0 20px' }}>
        <button
          type="button"
          onClick={() => {
            /* Brief 3: pill is visually tappable but no destination wired.
               Future ticket: navigate to course detail or "plan next round" flow. */
          }}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(247, 147, 30, 0.08)',
            border: '1px solid rgba(247, 147, 30, 0.30)',
            borderRadius: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textAlign: 'left',
          }}
        >
          {/* Icon block */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: AMBER,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.5} />
          </div>

          {/* Body */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.25,
              }}
            >
              Beat{' '}
              <span style={{ color: AMBER_INK, fontWeight: 800 }}>{diff}</span>{' '}
              on your next round
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#64748B',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {courseName} · 18 holes
            </div>
          </div>

          <ChevronRight size={16} color="rgba(15,23,42,0.45)" style={{ flexShrink: 0 }} />
        </button>
      </div>
    </section>
  );
};

export default PredictionsCard;
