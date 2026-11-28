/** Overview-only five-tour switcher. The parent retains slide selection and
 * debounced viewing-state ownership, so this control cannot change the lens. */
import { Button } from '@/components/ui/button';
import type { TourId } from '../../hooks/useOverviewData';

const SEGMENTS: ReadonlyArray<{ tour: TourId; label: string }> = [
  { tour: 'pga', label: 'PGA' },
  { tour: 'lpga', label: 'LPGA' },
  { tour: 'euro', label: 'DP World' },
  { tour: 'champ', label: 'Champs' },
  { tour: 'pgad', label: 'KF' },
];

export function OverviewTourSwitcher({ selectedTour, onSelect }: { selectedTour: string; onSelect: (tour: TourId) => void }) {
  return <div className="ov48-switcher" data-overview-chip-row role="group" aria-label="Tour">
    {SEGMENTS.map(({ tour, label }) => <Button key={tour} variant={null} size={null} aria-pressed={selectedTour === tour} onClick={() => onSelect(tour)}>{label}</Button>)}
  </div>;
}