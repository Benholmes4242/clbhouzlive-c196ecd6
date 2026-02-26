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
      "grid w-full grid-cols-4 bg-transparent border-0 px-0 py-0 gap-0",
      className
    )}>
      {TOURS.map(tour => {
        const isActive = selectedTour === tour.key;
        return (
          <button
            key={tour.key}
            onClick={() => onSelect(tour.key)}
            className={cn(
              "relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none transition-colors duration-200 ease-out",
              "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:rounded-full after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out",
              isActive
                ? "text-foreground after:w-full after:opacity-[0.85]"
                : "text-muted-foreground hover:text-foreground after:w-0 after:opacity-0"
            )}
          >
            {tour.label}
          </button>
        );
      })}
    </div>
  );
}