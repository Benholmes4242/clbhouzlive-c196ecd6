/**
 * FormSection — last 6 results as chips.
 *
 * Wins render with a gold gradient chip + 800 weight. MC/WD/DQ mute.
 * Section self-hides when < 2 rendered chips.
 */

import type { PlayerTournamentResult } from '../../hooks/usePlayerResults';
import { AMBER, GOLD, GOLD_DEEP, HAIRLINE_INK_8, INK, INK_FAINT, INK_TINT_07, SLATE_50, SURFACE } from '../../_shared/tokens';

interface FormSectionProps {
  results: PlayerTournamentResult[];
}

function chipLabel(r: PlayerTournamentResult): string {
  const st = r.status?.toUpperCase();
  if (st === 'CUT' || st === 'MC') return 'MC';
  if (st === 'WD') return 'WD';
  if (st === 'DQ') return 'DQ';
  if (r.position === null) return '—';
  if (r.position === 1) return '1';
  return `${r.position_tied ? 'T' : ''}${r.position}`;
}

export function FormSection({ results }: FormSectionProps) {
  const last6 = results.slice(0, 6);
  if (last6.length < 2) return null;

  return (
    <section
      style={{
        background: SLATE_50,
        borderTop: `0.5px solid ${INK_TINT_07}`,
        padding: '18px 0 14px',
      }}
    >
      <p
        style={{
          margin: '0 16px 10px',
          fontSize: 8,
          fontWeight: 700,
          color: INK_FAINT,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        Last 6 · Most Recent First
      </p>
      <div
        style={{
          padding: '0 16px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {last6.map((r) => {
          const label = chipLabel(r);
          const isWin = r.position === 1 && r.status?.toUpperCase() !== 'WD';
          const isMissed = ['MC', 'WD', 'DQ'].includes(label);
          return (
            <div
              key={r.id}
              style={{
                flex: '0 0 auto',
                minWidth: 56,
                padding: '9px 12px',
                borderRadius: 10,
                border: isWin ? `1px solid ${GOLD_DEEP}` : `0.5px solid ${HAIRLINE_INK_8}`,
                background: isWin
                  ? `linear-gradient(135deg, ${GOLD} 0%, ${AMBER} 100%)`
                  : SURFACE,
                textAlign: 'center' as const,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isWin ? 800 : 700,
                  color: isWin ? '#0A0E14' : isMissed ? INK_FAINT : INK,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.005em',
                  lineHeight: 1,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
