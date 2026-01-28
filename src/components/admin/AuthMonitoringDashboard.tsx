import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRange } from '@/hooks/admin/useAnalyticsData';
import { useAuthMonitoringStats } from '@/hooks/admin/useAuthMonitoringStats';
import {
  AuthMonitoringHeader,
  AuthHealthDashboard,
  AuthEventsTable,
  AuthAlertsPanel,
} from '@/components/admin/auth-monitoring';

export function AuthMonitoringDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const { stats, events, issues, loading, error, refresh } = useAuthMonitoringStats(dateRange);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!loading && stats) {
      setLastUpdated(new Date());
    }
  }, [loading, stats]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (error && !stats) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={refresh} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <AuthMonitoringHeader
        stats={stats}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        loading={loading}
      />

      {/* Last updated indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          {loading && <span className="text-primary">Refreshing...</span>}
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Health Dashboard */}
        <div className="lg:col-span-1 space-y-6">
          <AuthHealthDashboard stats={stats} loading={loading} />
          <AuthAlertsPanel issues={issues} stats={stats} loading={loading} />
        </div>

        {/* Right Column - Events Table */}
        <div className="lg:col-span-2">
          <AuthEventsTable events={events} loading={loading} />
        </div>
      </div>

      {/* Note about data sources */}
      <p className="text-xs text-muted-foreground text-center">
        Data sourced from user_profiles and analytics_events. Some metrics require Edge Functions with service role for complete auth.users access.
      </p>
    </div>
  );
}

export default AuthMonitoringDashboard;
