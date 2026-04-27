/**
 * RecentResultPill — shows a player's most recent notable finish (last 4 weeks).
 *
 * Label rules (tied → T-prefix at position ≥ 2; ordinal for solo):
 *   1            → WIN
 *   2 solo       → 2nd
 *   2 tied       → T2
 *   3 solo       → 3rd
 *   3 tied       → T3
 *   4-10 solo    → {ordinal}
 *   4-10 tied    → T{position}
 *
 * Colors:
 *   WIN          → amber-soft bg, amber border, amber text
 *   2nd / T2     → green-soft bg, green border, greenDeep text
 *   3rd-10th     → slate-100 bg, slate-200 border, slate-700 text
 */

interface RecentResultPillProps {
  position: number;
  tied: boolean;
}

function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

export function RecentResultPill({ position, tied }: RecentResultPillProps) {
  if (!Number.isFinite(position) || position < 1 || position > 10) return null;

  let label: string;
  if (position === 1) {
    label = 'WIN';
  } else if (tied) {
    label = `T${position}`;
  } else {
    label = ordinal(position);
  }

  // Color tier
  let bg: string;
  let border: string;
  let color: string;
  if (position === 1) {
    bg = 'rgba(247,147,30,0.12)';
    border = 'rgba(247,147,30,0.45)';
    color = '#B45309';
  } else if (position === 2) {
    bg = 'rgba(16,163,74,0.10)';
    border = 'rgba(16,163,74,0.30)';
    color = '#15803D';
  } else {
    bg = '#F1F5F9'; // slate-100
    border = '#E2E8F0'; // slate-200
    color = '#334155'; // slate-700
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 5px',
        borderRadius: 3,
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: '0.3px',
        lineHeight: 1.2,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

export default RecentResultPill;
