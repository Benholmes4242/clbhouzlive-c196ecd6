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
      "flex w-full justify-center gap-2 px-4",
      className
    )}>
      {TOURS.map(tour => {
        const isActive = selectedTour === tour.key;
        return (
          <button
            key={tour.key}
            onClick={() => onSelect(tour.key)}
            className={cn(
              "px-4 min-h-[36px] rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold",
              isActive
                ? "text-white"
                : "text-muted-foreground bg-muted"
            )}
            style={isActive ? { backgroundColor: 'hsl(var(--tab-sub-active))' } : undefined}
          >
            {tour.label}
          </button>
        );
      })}
    </div>
  );
}
