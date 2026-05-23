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

  // Pace bar geometry — scratch (0) on the left, oldest counter + 1 on the right.
  const oldestDiff = oldest?.diff ?? Math.max(target + 2, 5);
  const barMax = oldestDiff + 1;

  // Verdict + gap relative to today's target.
  const isOnPace = last5Avg != null && last5Avg <= target;
  const gap = last5Avg != null ? last5Avg - target : 0;

  const pinPct = Math.min(100, Math.max(0, ((last5Avg ?? 0) / barMax) * 100));
  const targetPct = Math.min(100, Math.max(0, (target / barMax) * 100));


  const verdictColor = isOnPace ? 'var(--hcp-good)' : 'var(--hcp-amber)';
  const sweep = isOnPace
    ? 'linear-gradient(135deg, color-mix(in srgb, var(--hcp-good) 10%, transparent) 0%, transparent 60%)'
    : 'linear-gradient(135deg, color-mix(in srgb, var(--hcp-amber) 10%, transparent) 0%, transparent 60%)';

  return (
    <section style={{ marginTop: 32 }}>

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
          margin: '0 20px',
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line-2)',
          borderRadius: 16,
          overflow: 'hidden',
          fontFamily: FONT,
        }}
      >
        {/* ── HERO BAND ─────────────────────────── */}
        <div
          style={{
            position: 'relative',
            padding: '16px 18px 18px',
            borderBottom: '1px solid var(--hcp-line-2)',
            background: sweep,
          }}
        >
          <div
            style={{
              textTransform: 'uppercase',
              fontSize: 10,
              letterSpacing: '0.18em',
              fontWeight: 700,
              color: 'var(--hcp-t-60)',
            }}
          >
            Shoot {target.toFixed(1)} or better to drop your index
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 0.95,
                color: 'var(--hcp-good)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {target.toFixed(1)}
            </span>
            {last5Avg != null && (
              <span
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.35,
                  color: 'var(--hcp-t-60)',
                  textAlign: 'right',
                  maxWidth: 200,
                  paddingBottom: 6,
                }}
              >
                {isOnPace ? (
                  <>
                    You're{' '}
                    <strong style={{ color: 'var(--hcp-good)', fontWeight: 700 }}>
                      {Math.abs(gap).toFixed(1)} ahead
                    </strong>{' '}
                    of your last 5 avg of{' '}
                    <strong style={{ color: 'var(--hcp-good)', fontWeight: 700 }}>
                      {last5Avg!.toFixed(1)}
                    </strong>
                  </>
                ) : (
                  <>
                    Need{' '}
                    <strong style={{ color: 'var(--hcp-amber)', fontWeight: 700 }}>
                      {gap.toFixed(1)} better
                    </strong>{' '}
                    than your last 5 avg of{' '}
                    <strong style={{ color: 'var(--hcp-amber)', fontWeight: 700 }}>
                      {last5Avg!.toFixed(1)}
                    </strong>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* ── BUBBLE BAR BAND ───────────────────── */}
        {last5Avg != null && (
          <div
            style={{
              padding: '18px 18px 18px',
              borderBottom: '1px solid var(--hcp-line-2)',
            }}
          >
            {/* TOP BUBBLE ROW — target pointing DOWN */}
            <div style={{ position: 'relative', height: 26, marginBottom: 8 }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${targetPct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(34,197,94,0.14)',
                    border: '1px solid rgba(34,197,94,0.30)',
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--hcp-good)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.2,
                    position: 'relative',
                  }}
                >
                  {target.toFixed(1)}
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: -5,
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '5px solid rgba(34,197,94,0.30)',
                    }}
                  />
                </span>
              </div>
            </div>

            {/* Bar */}
            <div
              style={{
                position: 'relative',
                height: 6,
                background: 'var(--hcp-bg-3)',
                borderRadius: 999,
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${targetPct}%`,
                  background: 'var(--hcp-good)',
                  opacity: 0.5,
                  borderRadius: 999,
                }}
              />
              {/* Target CIRCLE */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${targetPct}%`,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--hcp-good)',
                  border: '2px solid var(--hcp-bg-1)',
                  boxShadow: '0 0 0 1px var(--hcp-good)',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                }}
              />
              {/* Last-5 pin */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${pinPct}%`,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: verdictColor,
                  border: '2px solid var(--hcp-bg-1)',
                  boxShadow: `0 0 0 1px ${verdictColor}`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                }}
              />
            </div>

            {/* BOTTOM BUBBLE ROW — last5Avg pointing UP */}
            <div style={{ position: 'relative', height: 26, marginTop: 6 }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${pinPct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: isOnPace ? 'rgba(34,197,94,0.14)' : 'rgba(247,147,30,0.14)',
                    border: `1px solid ${isOnPace ? 'rgba(34,197,94,0.30)' : 'rgba(247,147,30,0.30)'}`,
                    fontSize: 12,
                    fontWeight: 800,
                    color: verdictColor,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.2,
                    position: 'relative',
                  }}
                >
                  {last5Avg.toFixed(1)}
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: -5,
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: `5px solid ${isOnPace ? 'rgba(34,197,94,0.30)' : 'rgba(247,147,30,0.30)'}`,
                    }}
                  />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── TWO-PATH BOTTOM STRIP ─────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <PathCell
            eyebrow="For a cut"
            eyebrowColor="var(--hcp-good)"
            value={target.toFixed(1)}
            valueColor="var(--hcp-good-2)"
            prose={
              oldest ? (
                <>
                  Replaces your weakest{' '}
                  <strong style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                    ({oldest.diff.toFixed(1)})
                  </strong>
                </>
              ) : (
                <>Replaces your weakest counter</>
              )
            }
            borderRight
          />
          <PathCell
            eyebrow="If you don't"
            eyebrowColor="var(--hcp-t-60)"
            value={settle.toFixed(1)}
            valueColor="var(--hcp-t-100)"
            prose={
              <>
                Any score above{' '}
                <strong style={{ color: 'var(--hcp-t-100)', fontWeight: 700 }}>
                  {target.toFixed(1)}
                </strong>{' '}
                stays here
              </>
            }
          />
        </div>
      </div>
    </section>
  );
};

// ── Subcomponents ───────────────────────────────────────────────────

const PathCell: React.FC<{
  eyebrow: string;
  eyebrowColor: string;
  value: string;
  valueColor: string;
  prose: React.ReactNode;
  borderRight?: boolean;
}> = ({ eyebrow, eyebrowColor, value, valueColor, prose, borderRight }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '14px 14px 16px',
      borderRight: borderRight ? '1px solid var(--hcp-line-2)' : 'none',
      fontFamily: FONT,
    }}
  >
    <span
      style={{
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        color: valueColor,
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}
    >
      {value}
    </span>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span
        style={{
          textTransform: 'uppercase',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.16em',
          color: eyebrowColor,
        }}
      >
        {eyebrow}
      </span>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          lineHeight: 1.35,
          color: 'var(--hcp-t-60)',
        }}
      >
        {prose}
      </span>
    </div>
  </div>
);

export default NextRoundWatch;
