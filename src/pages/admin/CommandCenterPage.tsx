import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommandCenterMetrics } from '@/features/admin/hooks/useCommandCenterMetrics';
import { 
  PlatformHealthSection, 
  ActionQueuesSection, 
  TrendsSection,
  RecentActivitySection,
  TourRankingsHealthSection
} from '@/components/admin/command-center';
import { QuickActionsGrid } from '@/components/admin/overview/QuickActionsGrid';
import { track } from '@/lib/telemetry';

export function CommandCenterPage() {
  const {
    platformHealth,
    actionQueues,
    content,
    trends,
    auditLog,
    systemStatus,
    isLoading,
    refetchAll
  } = useCommandCenterMetrics({
    refetchInterval: 60000, // 1 minute
    trendDays: 14
  });

  useEffect(() => {
    track('admin_command_center_opened');
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time platform overview and action queues
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={refetchAll}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {/* Major sections with 24px spacing (space-y-6) */}
      <div className="space-y-6">
        {/* Platform Health with System Status */}
        <PlatformHealthSection
          data={platformHealth.data}
          systemStatus={systemStatus.data}
          isLoading={platformHealth.isLoading}
          systemStatusLoading={systemStatus.isLoading}
        />

        {/* Tour Rankings Health */}
        <TourRankingsHealthSection />

        {/* Action Queues */}
        <ActionQueuesSection
          data={actionQueues.data}
          isLoading={actionQueues.isLoading}
        />

        {/* Activity Trends */}
        <TrendsSection
          trendsData={trends.data}
          contentData={content.data}
          trendsLoading={trends.isLoading}
          contentLoading={content.isLoading}
        />

        {/* Recent Admin Activity */}
        <RecentActivitySection
          data={auditLog.data}
          isLoading={auditLog.isLoading}
        />

        {/* Quick Actions - extra spacing before since it's a different content type */}
        <section className="pt-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <QuickActionsGrid />
        </section>
      </div>
    </div>
  );
}

export default CommandCenterPage;
