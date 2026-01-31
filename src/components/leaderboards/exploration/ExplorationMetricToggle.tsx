import { cn } from '@/lib/utils';
import type { ExplorationMetric } from '@/types/leaderboards';

interface ExplorationMetricToggleProps {
  value: ExplorationMetric;
  onChange: (metric: ExplorationMetric) => void;
}

const metricOptions: { id: ExplorationMetric; label: string }[] = [
  { id: 'countries', label: 'Countries' },
  { id: 'continents', label: 'Continents' },
];

/**
 * Compact metric toggle matching the height of LeaderboardScopeSelector
 */
export function ExplorationMetricToggle({
  value,
  onChange,
}: ExplorationMetricToggleProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex bg-gray-100 rounded-full p-0.5">
        {metricOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ease-out whitespace-nowrap',
              value === option.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
