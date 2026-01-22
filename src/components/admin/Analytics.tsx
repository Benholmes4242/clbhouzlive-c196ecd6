import React, { useState } from 'react';
import { DateRange, useAnalyticsOverview, useEventTypeBreakdown, useAnalyticsTimeSeries, useTopContent } from '@/hooks/admin/useAnalyticsData';
import { AnalyticsDateRangePicker } from './analytics/AnalyticsDateRangePicker';
import { AnalyticsKPICards } from './analytics/AnalyticsKPICards';
import { AnalyticsEventBreakdown } from './analytics/AnalyticsEventBreakdown';
import { AnalyticsTimeSeries } from './analytics/AnalyticsTimeSeries';
import { AnalyticsTopContent } from './analytics/AnalyticsTopContent';

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  
  const overviewQuery = useAnalyticsOverview(dateRange);
  const eventsQuery = useEventTypeBreakdown(dateRange);
  const timeSeriesQuery = useAnalyticsTimeSeries(dateRange);
  const topContentQuery = useTopContent(dateRange);
  
  return (
    <div className="space-y-6">
      {/* Header with date picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Analytics & Reporting</h2>
          <p className="text-muted-foreground text-sm">Track platform performance and user engagement</p>
        </div>
        <AnalyticsDateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Section 1: KPI Cards */}
      <AnalyticsKPICards 
        data={overviewQuery.data} 
        loading={overviewQuery.isLoading} 
      />

      {/* Section 2: Time Series Chart */}
      <AnalyticsTimeSeries 
        data={timeSeriesQuery.data} 
        loading={timeSeriesQuery.isLoading} 
      />

      {/* Section 3: Event Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsEventBreakdown 
          data={eventsQuery.data} 
          loading={eventsQuery.isLoading} 
        />
        
        {/* Placeholder for additional chart */}
        <div className="hidden lg:block" />
      </div>

      {/* Section 4: Top Content */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Top Content</h3>
        <AnalyticsTopContent 
          data={topContentQuery.data} 
          loading={topContentQuery.isLoading} 
        />
      </div>
    </div>
  );
};

export default Analytics;
