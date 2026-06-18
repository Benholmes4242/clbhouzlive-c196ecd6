import { memo } from 'react';
import ComparisonBars from './ComparisonBars';
import type { HeadlineStats } from '@/hooks/useBusinessAnalytics';

interface ActionsChartProps {
  headline: HeadlineStats;
}

function ActionsChartInner({ headline }: ActionsChartProps) {
  return (
    <ComparisonBars
      rows={[
        { label: 'Click-outs', value: headline.click_outs ?? 0 },
        { label: 'Message clicks', value: headline.message_clicks ?? 0 },
      ]}
      emptyCopy="No actions yet in this period"
    />
  );
}

export default memo(ActionsChartInner);
