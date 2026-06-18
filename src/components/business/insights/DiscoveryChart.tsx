import { memo } from 'react';
import ComparisonBars from './ComparisonBars';
import type { HeadlineStats } from '@/hooks/useBusinessAnalytics';

interface DiscoveryChartProps {
  headline: HeadlineStats;
}

function DiscoveryChartInner({ headline }: DiscoveryChartProps) {
  return (
    <ComparisonBars
      rows={[
        { label: 'Directory impressions', value: headline.directory_impressions ?? 0 },
        { label: 'Mentions', value: headline.mentions ?? 0 },
      ]}
      emptyCopy="No discovery activity yet in this period"
    />
  );
}

export default memo(DiscoveryChartInner);
