/**
 * TourPickerControl — the tour lens as ONE control in the header's left group.
 *
 * BRIEF_TOUR_HERO_FLUSH_AND_PICKER §2/§3. The horizontal chip rail is gone: it
 * rendered BETWEEN the fixed header and the hero (which is what pushed the hero
 * off the header border) and it hid KORN FERRY behind a scroll gesture with no
 * affordance. This control sits 8px right of the burger, reads the CURRENT
 * selection, and opens the vertical TourPickerSheet.
 *
 * Glass comes from GlassDurationBadge (GLASS_CHROME) — the same source as the
 * burger, so the two read as one family and neither can drift.
 *
 * WIDTH. The label varies; the widest option ("KORN FERRY" at 12/700 uppercase)
 * measures ~120px including padding and chevron, which fits at 390pt beside the
 * right cluster. MAX_W is set just above it so nothing truncates in practice,
 * with ellipsis as the backstop rather than the plan.
 */
import { ChevronDown } from 'lucide-react';
import { GLASS_CHROME } from '@/components/media/GlassDurationBadge';
import { useTourShortLabel } from './TourPickerSheet';

const MAX_W = 132;

export function TourPickerControl({ onTap }: { onTap: () => void }) {
  const label = useTourShortLabel();
  return (
    <button
      type="button"
      onClick={onTap}
      aria-haspopup="dialog"
      aria-label={`Filter by tour: ${label}`}
      style={{
        height: 30,
        maxWidth: MAX_W,
        minWidth: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '0 11px',
        border: 0,
        borderRadius: 999,
        ...GLASS_CHROME,
        color: '#fff',
        cursor: 'pointer',
        flexShrink: 1,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
        }}
      >
        {label}
      </span>
      <ChevronDown size={14} strokeWidth={2.6} aria-hidden style={{ flexShrink: 0 }} />
    </button>
  );
}

export default TourPickerControl;
