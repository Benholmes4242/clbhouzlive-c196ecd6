import React, { useMemo } from 'react';
import { TrendingDown, Minus } from 'lucide-react';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound } from '@/lib/whs/handicapMath';
import { DarkSectionHeader, DarkCard, VerdictPill } from './_shared/darkAtoms';

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

  const BAR_MIN = 0;
  const BAR_MAX = Math.max(
    8,
    Math.ceil(Math.max(settle, last5Avg ?? 0, oldest?.diff ?? 0) + 1),
  );

  const pos = (val: number) =>
    `${Math.min(100, Math.max(0, ((val - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100))}%`;

  const isBeatingTarget = last5Avg != null && last5Avg <= target;
  const verdictHeadlineColor = isBeatingTarget ? 'var(--hcp-good)' : 'var(--hcp-t-100)';
  const pinColor = isBeatingTarget ? 'var(--hcp-good)' : 'var(--hcp-amber)';
  const statusVerdict: 'good' | 'neutral' = isBeatingTarget ? 'good' : 'neutral';
  const statusLabel = isBeatingTarget ? 'ON TARGET' : 'READY TO PLAY';

  return (
    <section style={{ marginTop: 8 }}>
      <DarkSectionHeader
        eyebrow="NEXT ROUND WATCH"
        right={<VerdictPill verdict={statusVerdict}>{statusLabel}</VerdictPill>}
      />

      <DarkCard accent={isBeatingTarget ? 'good' : 'amber'} glow={isBeatingTarget ? 'good' : 'amber'}>
        <div style={{ padding: '16px 18px 18px', fontFamily: FONT }}>
          {/* Headline */}
          <h3
            style={{
              margin: 0,
              fontSize: 19,
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: '-0.018em',
              color: 'var(--hcp-t-100)',
            }}
          >
            Shoot{' '}
            <span style={{ color: verdictHeadlineColor, fontVariantNumeric: 'tabular-nums' }}>
              {target.toFixed(1)}
            </span>{' '}
            or better to drop your index
          </h3>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 13,
              lineHeight: 1.45,
              color: 'var(--hcp-t-60)',
            }}
          >
            Your 8 best of 20 are locked in. One round changes the math.
          </p>

          {/* Target bar */}
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                position: 'relative',
                height: 28,
                background: 'var(--hcp-bg-3)',
                borderRadius: 6,
                overflow: 'visible',
              }}
            >
              {/* Cut zone (0 → cutTarget) */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pos(BAR_MIN),
                  width: pos(target),
                  background: 'var(--hcp-good-tint)',
                  borderRight: '1px dashed var(--hcp-good)',
                  borderRadius: '6px 0 0 6px',
                }}
              />

              {/* Settle marker */}
              <Tick atPercent={pos(settle)} color="var(--hcp-t-60)" />

              {/* Oldest marker */}
              {oldest && <Tick atPercent={pos(oldest.diff)} color="var(--hcp-t-40)" dashed />}

              {/* Last 5 avg pin */}
              {last5Avg != null && <PinMarker atPercent={pos(last5Avg)} color={pinColor} />}
            </div>

            {/* Labels under the bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                fontSize: 10,
                color: 'var(--hcp-t-60)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              <BarLabel label="scratch" value="0" />
              <BarLabel label="cut" value={target.toFixed(1)} highlight="var(--hcp-good)" />
              <BarLabel label="settle" value={settle.toFixed(1)} />
              {oldest && <BarLabel label="oldest" value={oldest.diff.toFixed(1)} />}
            </div>
          </div>

          {/* Two-column TARGET / FALLBACK */}
          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border: '1px solid var(--hcp-line)',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--hcp-bg-2, var(--hcp-bg-1))',
            }}
          >
            <DuelCell
              icon={<TrendingDown size={11} strokeWidth={2.6} />}
              label="TARGET"
              caption={`Beat ${target.toFixed(1)} → drop`}
              value={target.toFixed(1)}
              valueColor="var(--hcp-good)"
              labelColor="var(--hcp-good)"
              borderRight
            />
            <DuelCell
              icon={<Minus size={11} strokeWidth={2.6} />}
              label="FALLBACK"
              caption={`Miss → settles ${settle.toFixed(1)}`}
              value={settle.toFixed(1)}
              valueColor="var(--hcp-t-100)"
              labelColor="var(--hcp-t-60)"
            />
          </div>

          {/* Pulse line */}
          {last5Avg != null && (
            <p
              style={{
                margin: '14px 0 0',
                fontSize: 12.5,
                lineHeight: 1.5,
                color: 'var(--hcp-t-80, var(--hcp-t-60))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Last 5 avg ·{' '}
              <span style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                {last5Avg.toFixed(1)}
              </span>
              {' — '}
              <span
                style={{
                  color: isBeatingTarget ? 'var(--hcp-good)' : 'var(--hcp-amber)',
                  fontWeight: 700,
                }}
              >
                {isBeatingTarget
                  ? `${(target - last5Avg).toFixed(1)} below target`
                  : `${(last5Avg - target).toFixed(1)} above target`}
              </span>
            </p>
          )}

          {/* Oldest supplementary */}
          {oldest && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11.5,
                lineHeight: 1.5,
                color: 'var(--hcp-t-60)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Oldest{' '}
              <span style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                {oldest.diff.toFixed(1)}
              </span>{' '}
              ({oldest.date}) rolls off after your next round.
            </p>
          )}
        </div>
      </DarkCard>
    </section>
  );
};

// ── Subcomponents ───────────────────────────────────────────────────

const Tick: React.FC<{ atPercent: string; color: string; dashed?: boolean }> = ({
  atPercent,
  color,
  dashed,
}) => (
  <span
    aria-hidden
    style={{
      position: 'absolute',
      top: -2,
      bottom: -2,
      left: atPercent,
      width: 0,
      borderLeft: `1.5px ${dashed ? 'dashed' : 'solid'} ${color}`,
      transform: 'translateX(-0.75px)',
      pointerEvents: 'none',
    }}
  />
);

const PinMarker: React.FC<{ atPercent: string; color: string }> = ({ atPercent, color }) => (
  <span
    aria-hidden
    style={{
      position: 'absolute',
      top: '50%',
      left: atPercent,
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: color,
      border: '2px solid var(--hcp-bg-1)',
      boxShadow: `0 0 0 1px ${color}`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 2,
    }}
  />
);

const BarLabel: React.FC<{
  label: string;
  value: string;
  highlight?: string;
}> = ({ label, value, highlight }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
    <span style={{ color: highlight ?? 'var(--hcp-t-100)', fontWeight: 700 }}>{value}</span>
    <span style={{ color: 'var(--hcp-t-40)', fontWeight: 600 }}>{label}</span>
  </span>
);

const DuelCell: React.FC<{
  icon: React.ReactNode;
  label: string;
  caption: string;
  value: string;
  valueColor: string;
  labelColor: string;
  borderRight?: boolean;
}> = ({ icon, label, caption, value, valueColor, labelColor, borderRight }) => (
  <div
    style={{
      padding: '12px 14px',
      borderRight: borderRight ? '1px solid var(--hcp-line)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        textTransform: 'uppercase',
        fontSize: 10,
        letterSpacing: '0.14em',
        fontWeight: 700,
        color: labelColor,
      }}
    >
      {icon}
      {label}
    </span>
    <span
      style={{
        fontSize: 11.5,
        color: 'var(--hcp-t-60)',
        lineHeight: 1.35,
      }}
    >
      {caption}
    </span>
    <span
      style={{
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1,
        color: valueColor,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
  </div>
);

export default NextRoundWatch;
