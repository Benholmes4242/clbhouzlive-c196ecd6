import React from 'react';
import { cn } from '@/lib/utils';

interface Division {
  id: string;
  name: string;
  color?: string;
}

interface DivisionPillFilterProps {
  divisions: Division[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

/**
 * DivisionPillFilter - Division filter pills with polish
 * 
 * Features:
 * - Consistent height (40px touch target)
 * - Consistent spacing (8px gap)
 * - Active style matches other active states
 * - Smooth horizontal scroll if overflow
 */
export const DivisionPillFilter: React.FC<DivisionPillFilterProps> = ({
  divisions,
  activeId,
  onChange,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 -mx-4">
      {/* All Divisions option */}
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
          activeId === null
            ? "bg-primary text-white"
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        )}
      >
        All Divisions
      </button>

      {divisions.map((division) => (
        <button
          key={division.id}
          onClick={() => onChange(division.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
            activeId === division.id
              ? "bg-primary text-white"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
          style={activeId === division.id && division.color ? { backgroundColor: division.color } : undefined}
        >
          {division.name}
        </button>
      ))}
    </div>
  );
};

export default DivisionPillFilter;
