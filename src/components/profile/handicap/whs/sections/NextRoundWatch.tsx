import React, { useMemo } from 'react';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound } from '@/lib/whs/handicapMath';
import { DarkSectionHeader } from './_shared/darkAtoms';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  connectionId: string;
  currentHandicap: number | null;
}

const NextRoundWatch: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data: allScores, isLoading } = useAllScores(connectionId);

  const projection = useMemo(() => {
    if (!allScores || allScores.length < 8 || currentHandicap == null) return null;
    const last20 = allScores.slice(0, 20);
    return projectNextRound(last20, currentHandicap);
  }, [allScores, currentHandicap]);

  const last5Avg = useMemo(() => {
    if (!allScores) return null;
    const diffs = allScores
      .slice(0, 5)
      .map((r) => r.handicap_differential)
      .filter((d): d is number => typeof d === 'number');
    if (diffs.length === 0) return null;
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }, [allScores]);

  const oldest = useMemo(() => {
    if (!allScores || allScores.length < 20) return null;
    const sorted = [...allScores].sort(
      (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
    );
    const o = sorted[0];
    if (!o || typeof o.handicap_differential !== 'number') return null;
    return {
      diff: o.handicap_differential,
      date: new Date(o.play_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    };
  }, [allScores]);

  if (isLoading || !projection || !projection.hasData) return null;

  const { cutTarget, settleAt } = projection;
  const target = Number(cutTarget.toFixed(1));
  const settle = Number(settleAt.toFixed(1));

  const oldestDiff = oldest?.diff ?? null;
  const isOnPace = last5Avg != null && last5Avg <= target;
  const gap = last5Avg != null ? last5Avg - target : 0;

  return (
    <section style={{ marginTop: 32, fontFamily: FONT }}>
      <DarkSectionHeader
        eyebrow="Next Round Watch"
        right={
          <span
            style={{
              textTransform: 'uppercase',
              fontSize: 10,
              letterSpacing: '0.18em',
              fontWeight: 700,
              color: 'var(--hcp-t-60)',
              fontFamily: FONT,
            }}
          >
            Pre-round
          </span>
        }
      />

      <div
        style={{
          margin: '0 16px',
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line)',
          borderRadius: 16,
          padding: 18,
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-40)',
            marginBottom: 6,
          }}
        >
          Next round watch
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            margin: '6px 0 14px',
            lineHeight: 1.3,
          }}
        >
          Shoot{' '}
          <span style={{ color: 'var(--hcp-good-2)' }}>
            {target.toFixed(1)} or better
          </span>{' '}
          to drop your index
        </div>

        <Row
          label="Target to cut"
          sub={
            oldestDiff != null
              ? `Replaces your weakest (${oldestDiff.toFixed(1)})`
              : 'Replaces your weakest counter'
          }
          value={target.toFixed(1)}
          color="var(--hcp-good-2)"
          first
        />
        <Row
          label="Last 5 average"
          sub={
            last5Avg == null
              ? '—'
              : isOnPace
                ? 'On pace to cut'
                : `Need ${gap.toFixed(1)} better than this`
          }
          value={last5Avg != null ? last5Avg.toFixed(1) : '—'}
          color="var(--hcp-amber)"
        />
        <Row
          label="If you don't"
          sub={`Any score above ${target.toFixed(1)} keeps you at ${settle.toFixed(1)}`}
          value={settle.toFixed(1)}
          color="var(--hcp-t-100)"
        />
      </div>
    </section>
  );
};

const Row: React.FC<{
  label: string;
  sub: string;
  value: string;
  color: string;
  first?: boolean;
}> = ({ label, sub, value, color, first }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '11px 0',
      borderTop: first ? 'none' : '1px solid var(--hcp-line)',
    }}
  >
    <div style={{ minWidth: 0, paddingRight: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--hcp-t-100)' }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: 'var(--hcp-t-40)', marginTop: 1 }}>
        {sub}
      </div>
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 800,
        color,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}
    >
      {value}
    </div>
  </div>
);

export default NextRoundWatch;
