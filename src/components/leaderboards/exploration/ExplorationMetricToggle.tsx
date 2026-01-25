import { cn } from '@/lib/utils';
import type { ExplorationMetric } from '@/types/leaderboards';

interface ExplorationMetricToggleProps {
  value: ExplorationMetric;
  onChange: (metric: ExplorationMetric) => void;
}

const metricOptions: { value: ExplorationMetric; label: string }[] = [
  { value: 'countries', label: 'Countries' },
  { value: 'continents', label: 'Continents' },
];

export function ExplorationMetricToggle({
  value,
  onChange,
}: ExplorationMetricToggleProps) {
  return (
    <div className="flex justify-center px-4">
      <div className="inline-flex items-center bg-[#e2e8f0]/50 p-0.5 rounded-full border border-[#e2e8f0]/80">
        {metricOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-4 py-1.5 text-xs font-medium rounded-full transition-all',
              value === option.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
