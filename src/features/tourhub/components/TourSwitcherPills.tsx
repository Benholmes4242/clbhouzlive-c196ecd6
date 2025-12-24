import { cn } from '@/lib/utils';

export type TourKey = 'pga' | 'lpga' | 'eur' | 'champions-tour';

interface TourSwitcherPillsProps {
  selectedTour: TourKey;
  onSelect: (tour: TourKey) => void;
  className?: string;
}

const TOURS: { key: TourKey; label: string }[] = [
  { key: 'pga', label: 'PGA' },
  { key: 'lpga', label: 'LPGA' },
  { key: 'eur', label: 'DP World' },
  { key: 'champions-tour', label: 'Champions' },
];

export function TourSwitcherPills({ selectedTour, onSelect, className }: TourSwitcherPillsProps) {
  return (
    <div className={cn(
      "bg-surface-card border border-border-subtle rounded-sq-lg p-1 inline-flex gap-1",
      className
    )}>
      {TOURS.map(tour => (
        <button
          key={tour.key}
          onClick={() => onSelect(tour.key)}
          className={cn(
            "px-4 py-2 rounded-sq-md text-body-sm font-medium transition-all",
            selectedTour === tour.key
              ? "bg-surface-alt text-text-primary shadow-sm"
              : "text-text-secondary hover:bg-surface-alt/50"
          )}
        >
          {tour.label}
        </button>
      ))}
    </div>
  );
}
