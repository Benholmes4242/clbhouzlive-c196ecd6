/**
 * TourPill — compact branded tour identifier.
 *
 * Replaces verbose "PGA TOUR EVENT" caps text with a small filled badge
 * using each tour's brand color. Per design spec — Schedule polish brief.
 *
 * Looks up by DB code (`tour_code` from sr_tournaments). DB casing is
 * intentional — colors / display code come from TOUR_MAP centrally.
 */
import { getTourMeta } from '../../constants/tourMap';

interface TourPillProps {
  tourCode: string | null | undefined;
  size?: 'sm' | 'md';
}

export function TourPill({ tourCode, size = 'sm' }: TourPillProps) {
  const meta = getTourMeta(tourCode);
  if (!meta) return null;

  const dims = size === 'sm'
    ? { padding: '3px 7px', fontSize: 10, letterSpacing: 0.4 }
    : { padding: '4px 9px', fontSize: 11, letterSpacing: 0.5 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        ...dims,
        borderRadius: 4,
        background: meta.bg,
        color: meta.fg,
        fontWeight: 900,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {meta.pillCode}
    </span>
  );
}
