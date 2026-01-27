import { PillToggle } from '@/components/ui/PillToggle';
import type { ExplorationMetric } from '@/types/leaderboards';

interface ExplorationMetricToggleProps {
  value: ExplorationMetric;
  onChange: (metric: ExplorationMetric) => void;
}

const metricOptions = [
  { id: 'countries', label: 'Countries' },
  { id: 'continents', label: 'Continents' },
];

export function ExplorationMetricToggle({
  value,
  onChange,
}: ExplorationMetricToggleProps) {
  return (
    <div className="flex justify-center px-4">
      <PillToggle 
        options={metricOptions} 
        selected={value} 
        onSelect={(id) => onChange(id as ExplorationMetric)}
      />
    </div>
  );
}
