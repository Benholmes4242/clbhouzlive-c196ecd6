import React, { useMemo } from 'react';
import { TrendingDown, Minus } from 'lucide-react';
import { useAllScores } from '@/lib/whs/hooks';
import { projectNextRound } from '@/lib/whs/handicapMath';
import { DarkSectionHeader, DarkCard } from './_shared/darkAtoms';

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

  return (
    <section style={{ marginTop: 10 }}>
      <DarkSectionHeader eyebrow="Next Round Watch" />

      <DarkCard
        accent="good"
        glow={isBeatingTarget ? 'good' : 'amber'}
        style={{ padding: 0 }}
      >
        {/* Sub-eyebrow row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '14px 18px 0',
            fontFamily: FONT,
          }}
        >
          <span
            style={{
              textTransform: 'uppercase',
              fontSize: 10.5,
              letterSpacing: '0.16em',
              fontWeight: 700,
              color: 'var(--hcp-t-80)',
            }}
          >
            Today's Targets
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--hcp-t-60)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            vs your 8 counters
          </span>
        </div>

        {/* Headline */}
        <h3
          style={{
            margin: 0,
            padding: '10px 18px 0',
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: '-0.018em',
            lineHeight: 1.25,
            color: 'var(--hcp-t-100)',
            fontFamily: FONT,
          }}
        >
          Shoot{' '}
          <span style={{ color: 'var(--hcp-good)', fontVariantNumeric: 'tabular-nums' }}>
            {target.toFixed(1)} or better
          </span>{' '}
          to drop your index.
        </h3>

        {/* Thin bar */}
        <div style={{ padding: '18px 18px 0', position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              height: 6,
              background: 'var(--hcp-bg-3)',
              borderRadius: 999,
              overflow: 'visible',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: pos(target),
                background: 'var(--hcp-good)',
                borderRadius: 999,
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: -3,
                bottom: -3,
                left: pos(target),
                width: 2,
                background: 'var(--hcp-t-100)',
                transform: 'translateX(-1px)',
                borderRadius: 1,
              }}
            />
          </div>

          {/* Bar labels — 4 stacked items, evenly spaced */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              marginTop: 10,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <BarStack label="SCRATCH" value="0" align="start" />
            <BarStack label="CUT" value={target.toFixed(1)} valueColor="var(--hcp-good)" />
            <BarStack
              label="OLDEST"
              value={oldest ? oldest.diff.toFixed(1) : '—'}
              align="end"
            />
          </div>
        </div>

        {/* Inner cell pair — FOR A CUT / OTHERWISE */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            marginTop: 18,
            borderTop: '1px solid var(--hcp-line)',
          }}
        >
          <InnerCell
            eyebrow="FOR A CUT"
            eyebrowIcon={<TrendingDown size={11} strokeWidth={2.6} />}
            eyebrowColor="var(--hcp-good)"
            value={target.toFixed(1)}
            valueColor="var(--hcp-good)"
            subtext={
              oldest
                ? `Replaces weakest counter (${oldest.diff.toFixed(1)})`
                : 'Replaces your weakest counter'
            }
            borderRight
          />
          <InnerCell
            eyebrow="Otherwise you'll stay at"
            eyebrowIcon={<Minus size={11} strokeWidth={2.6} />}
            eyebrowColor="var(--hcp-t-60)"
            value={settle.toFixed(1)}
            valueColor={
              currentHandicap != null && settle < currentHandicap - 0.05
                ? 'var(--hcp-good)'
                : 'var(--hcp-t-100)'
            }
            subtext="With no risk of going up"
          />
        </div>

        {/* Pulse line */}
        {last5Avg != null && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px 16px',
              fontFamily: FONT,
              fontSize: 12.5,
              fontVariantNumeric: 'tabular-nums',
              borderTop: '1px solid var(--hcp-line)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="hcp-live-dot" />
              <span
                style={{
                  textTransform: 'uppercase',
                  fontSize: 10.5,
                  letterSpacing: '0.14em',
                  fontWeight: 700,
                  color: 'var(--hcp-good)',
                }}
              >
                Last 5 avg
              </span>
              <span style={{ color: 'var(--hcp-t-40)' }}>·</span>
              <span style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                {last5Avg.toFixed(1)}
              </span>
            </span>
            <span
              style={{
                color: isBeatingTarget ? 'var(--hcp-good)' : 'var(--hcp-amber)',
                fontWeight: 600,
              }}
            >
              {isBeatingTarget
                ? `${(target - last5Avg).toFixed(1)} below target`
                : `${(last5Avg - target).toFixed(1)} above target`}
            </span>
          </div>
        )}
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
  atPercent: string;
  align?: 'start' | 'center' | 'end';
}> = ({ label, value, highlight, atPercent, align = 'center' }) => (
  <span
    style={{
      position: 'absolute',
      left: atPercent,
      transform:
        align === 'start' ? 'translateX(0)' :
        align === 'end'   ? 'translateX(-100%)' :
        'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      alignItems: 'center',
      whiteSpace: 'nowrap',
    }}
  >
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

const BarStack: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
  align?: 'start' | 'center' | 'end';
}> = ({ label, value, valueColor, align = 'center' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems:
        align === 'start' ? 'flex-start' :
        align === 'end' ? 'flex-end' : 'center',
      gap: 4,
    }}
  >
    <span
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: valueColor ?? 'var(--hcp-t-100)',
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-40)',
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  </div>
);

const InnerCell: React.FC<{
  eyebrow: string;
  eyebrowIcon: React.ReactNode;
  eyebrowColor: string;
  value: string;
  valueColor: string;
  subtext: string;
  borderRight?: boolean;
}> = ({ eyebrow, eyebrowIcon, eyebrowColor, value, valueColor, subtext, borderRight }) => (
  <div
    style={{
      padding: '14px 18px 16px',
      borderRight: borderRight ? '1px solid var(--hcp-line)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textTransform: 'uppercase',
        fontSize: 10.5,
        letterSpacing: '0.14em',
        fontWeight: 700,
        color: eyebrowColor,
      }}
    >
      {eyebrowIcon}
      {eyebrow}
    </span>
    <span
      style={{
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1,
        color: valueColor,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontSize: 12,
        color: 'var(--hcp-t-60)',
        lineHeight: 1.4,
      }}
    >
      {subtext}
    </span>
  </div>
);

export default NextRoundWatch;
