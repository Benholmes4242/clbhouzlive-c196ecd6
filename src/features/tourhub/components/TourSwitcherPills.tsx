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
    <div className={cn("flex w-full justify-center gap-2 px-4", className)}>
      {TOURS.map(tour => {
        const isActive = selectedTour === tour.key;
        return (
          <button
            key={tour.key}
            onClick={() => onSelect(tour.key)}
            className="px-4 min-h-[36px] text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.97] font-semibold"
            style={{
              borderRadius: 8,
              background: isActive ? 'hsl(var(--foreground))' : 'transparent',
              color: isActive ? 'hsl(var(--background))' : 'hsl(var(--muted-foreground))',
              border: isActive ? 'none' : '1.5px solid hsl(var(--border))',
            }}
          >
            {tour.label}
          </button>
        );
      })}
    </div>
  );
}
