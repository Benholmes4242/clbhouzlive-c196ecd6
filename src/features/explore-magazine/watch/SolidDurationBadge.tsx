import { formatDuration } from '@/features/watch-v2/utils/formatDuration';

const BADGE_INK = '#FFFFFF';
const BADGE_FILL = 'rgba(0,0,0,0.62)';

/** Shared solid duration presentation; Shorts, Community and see-all grids agree. */
export function SolidDurationBadge({ seconds }: { seconds: number | null | undefined }) {
  const label = seconds ? formatDuration(seconds) : '';
  if (!label) return null;
  return (
    <span
      data-watch-badge="duration"
      style={{
        position: 'absolute', right: 6, bottom: 6, zIndex: 2, pointerEvents: 'none',
        fontSize: 10, fontWeight: 700, color: BADGE_INK, background: BADGE_FILL,
        borderRadius: 5, padding: '2px 5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2,
      }}
    >
      {label}
    </span>
  );
}