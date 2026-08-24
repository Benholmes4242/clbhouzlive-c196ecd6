import { memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEdgeFades } from '@/components/watch/shared/useEdgeFades';
import { FilterChips } from '@/components/ui/FilterChips';
import { TOUR_CONFIG, type TourId } from '../../hooks/useOverviewData';

interface SectionTourLensProps {
  value: TourId | null;
  onChange: (t: TourId | null) => void;
  /**
   * When false, the "All Tours" chip is omitted entirely. Callers using
   * showAllTours={false} should treat `value` as always a TourId.
   * Defaults to true — existing callers are unchanged.
   */
  showAllTours?: boolean;
  /** Tour ids to omit from the pill row (page-specific exclusions). */
  excludeTours?: TourId[];
}

const TOUR_ORDER: TourId[] = ['pga', 'lpga', 'euro', 'liv', 'champ', 'pgad'];


type LensId = '__all__' | TourId;

/**
 * SectionTourLens — per-section tour filter primitive.
 *
 * A horizontally-scrolling chip row defaulting to "All Tours" (unless
 * showAllTours=false). Controlled by the parent section; no internal
 * state, no auto-scroll. Right-edge fade appears only when the row
 * overflows. Uses the canonical FilterChips pill language.
 */
function SectionTourLensInner({ value, onChange, showAllTours = true, excludeTours }: SectionTourLensProps) {
  const { t } = useTranslation('tourhub');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEdgeFades(scrollerRef, wrapperRef);

  const filterAriaLabel = t('overview.sectionTourLens.filterAriaLabel');

  const options = useMemo(() => {
    const list: { id: LensId; label: string }[] = [];
    if (showAllTours) {
      list.push({ id: '__all__', label: t('overview.sectionTourLens.allTours') });
    }
    const excluded = new Set(excludeTours ?? []);
    TOUR_ORDER.forEach((id) => {
      if (excluded.has(id)) return;
      const config = TOUR_CONFIG[id];
      // NEVER-KEY: config.name is a tour display name (proper noun).
      list.push({ id, label: config.name });
    });
    return list;
  }, [showAllTours, excludeTours, t]);


  return (
    <div
      ref={wrapperRef}
      className="relative hrail-edge-fade"
    >
      <div
        ref={scrollerRef}
        role="tablist"
        aria-label={filterAriaLabel}
        className="overflow-x-auto scrollbar-hide"
        style={{ padding: '8.5px 16px' }}
      >
        <FilterChips
          options={options}
          value={value ?? '__all__'}
          onChange={(id) => onChange(id === '__all__' ? null : (id as TourId))}
          ariaLabel={filterAriaLabel}
          className="!overflow-visible !p-0"
        />
      </div>

      {/* Right-edge fade (only when scrollable) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full hrail-fade hrail-fade-right"
        style={{
          width: 5,
          // Canvas (#15171F) at full alpha on the masked edge. Both stops were
          // flattened to alpha 0, which painted nothing while useEdgeFades kept
          // toggling it; the zero-alpha stops were the bug, not the element.
          background: 'linear-gradient(to left, rgba(21,23,31,0) 0%, rgba(21,23,31,1) 100%)',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
      />
    </div>
  );
}

export const SectionTourLens = memo(SectionTourLensInner);
export default SectionTourLens;
