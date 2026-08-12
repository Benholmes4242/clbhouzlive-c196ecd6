/**
 * TourStatusBlock — the ONE position / score / thru treatment on the Tour Hub.
 *
 * Replaces the old grey pill (NeutralLiveChip / BannerRow "on course" bar).
 * No container, no background, no dots between values:
 *
 *   -6  T4          <- score leads 17/800 tabular in its TOUR colour
 *   THRU 12         <- 7/800/0.14em DIM label, never a bare "F"
 *
 * TOUR COLOUR RULE (broadcast convention, deliberately the opposite of the
 * member-analytics surfaces): under par RED, level and over par INK.
 */
import { useTranslation } from 'react-i18next';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';

/** Broadcast red — under par on every tour surface. */
export const TOUR_UNDER = '#C0392B';

export function tourScoreColor(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return A.INK;
  return score < 0 ? TOUR_UNDER : A.INK;
}

/** "−6" (true minus) / "+2" / "E". */
export function formatTourScore(score: number | null | undefined): string | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `\u2212${Math.abs(score)}`;
}

interface Props {
  score: number | null | undefined;
  position?: number | null;
  positionTied?: boolean | null;
  thru?: number | null;
  /** Non-scoring statuses (MC/WD/DQ) render as the leading token instead. */
  status?: string | null;
  align?: 'left' | 'right';
}

const DEMOTED = new Set(['CUT', 'MC', 'MDF', 'WD', 'DQ', 'DNS']);

export function TourStatusBlock({
  score,
  position,
  positionTied,
  thru,
  status,
  align = 'right',
}: Props) {
  const { t } = useTranslation('tourhub');
  const s = (status ?? '').toUpperCase();
  const demoted = DEMOTED.has(s);

  const scoreText = demoted ? (s === 'CUT' ? 'MC' : s) : formatTourScore(score);
  if (scoreText == null && position == null) return null;

  const posText = position != null && !demoted ? `${positionTied ? 'T' : ''}${position}` : null;
  const label = demoted
    ? null
    : thru == null
      ? null
      : thru >= 18
        ? t('overview.status.finished')
        : t('overview.status.thru', { n: thru });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        gap: 2,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        {scoreText != null && (
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: demoted ? A.BODY : tourScoreColor(score),
              ...FIGS,
            }}
          >
            {scoreText}
          </span>
        )}
        {posText && (
          <span style={{ fontSize: 12, fontWeight: 700, color: A.INK, ...FIGS }}>{posText}</span>
        )}
      </div>
      {label && (
        <span
          style={{
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
            ...FIGS,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default TourStatusBlock;
