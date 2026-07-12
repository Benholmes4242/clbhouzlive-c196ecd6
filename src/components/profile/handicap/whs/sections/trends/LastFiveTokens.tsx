import React from 'react';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  /** Last 5 round differentials, newest first. May be empty. */
  diffs: number[];
  /** Average of the 5 differentials (passed in from parent to avoid recomputing). */
  avg: number | null;
  /** Verdict accent colour — e.g. var(--hcp-bad) or var(--hcp-good). */
  accent: string;
  /** Verdict accent ink (used for value text). */
  accentInk: string;
}

/**
 * Magnitude-encoded mini bar chart of the user's last 5 round differentials.
 * Sits between the verdict hero and the convergence chart in Your Form.
 */
const LastFiveTokens: React.FC<Props> = ({ diffs, avg, accent, accentInk }) => {
  if (diffs.length === 0 || avg == null) return null;

  const MIN_HEIGHT_PCT = 0.18;
  const maxMag = Math.max(...diffs.map((d) => Math.abs(d)), 2);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line-2)',
        borderRadius: 12,
        marginBottom: 12,
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--hcp-t-40)',
          }}
        >
          Last 5 rounds
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: accentInk,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          avg {avg.toFixed(1)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 28 }}>
        {[...diffs].reverse().map((d, i) => {
          const heightPct = Math.max(MIN_HEIGHT_PCT, Math.min(1, Math.abs(d) / maxMag));
          const isBlowUp = Math.abs(d) >= 5;
          return (
            <div
              key={i}
              style={{
                width: 10,
                height: `${heightPct * 100}%`,
                borderRadius: '2px 2px 0 0',
                background: `linear-gradient(180deg, ${accent} 0%, ${accent}80 100%)`,
                boxShadow: isBlowUp ? `0 0 8px ${accent}` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LastFiveTokens;
