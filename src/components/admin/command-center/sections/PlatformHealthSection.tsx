import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Activity, ShieldCheck } from 'lucide-react';
import { KpiCard } from '../KpiCard';
import { SystemStatusCard } from '../SystemStatusCard';
import type { PlatformHealthMetrics, SystemStatus } from '@/features/admin/hooks/useCommandCenterMetrics';

interface PlatformHealthSectionProps {
  data: PlatformHealthMetrics | undefined;
  systemStatus: SystemStatus | undefined;
  isLoading: boolean;
  systemStatusLoading: boolean;
}

export function PlatformHealthSection({ 
  data, 
  systemStatus,
  isLoading,
  systemStatusLoading 
}: PlatformHealthSectionProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Platform Health</h2>
      
      {/* System Status */}
      <SystemStatusCard 
        status={systemStatus} 
        isLoading={systemStatusLoading}
        className="mb-4"
      />
      
      {/* KPI Grid - 16px gap (gap-4) within section */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Users"
          value={data?.totalUsers.value ?? 0}
          icon={Users}
          isLoading={isLoading}
          variant="highlight"
          onClick={() => navigate('/admin/users')}
        />
        
        <KpiCard
          title="Active (24h)"
          value={data?.activeUsers24h.value ?? 0}
          icon={Activity}
          isLoading={isLoading}
          subtitle="Unique sessions"
        />
        
        <KpiCard
          title="Active (7d)"
          value={data?.activeUsers7d.value ?? 0}
          icon={UserCheck}
          trend={data?.activeUsers7d.trend}
          trendPercent={data?.activeUsers7d.trendPercent}
          previousValue={data?.activeUsers7d.previousValue}
          isLoading={isLoading}
          subtitle="vs prev 7 days"
        />
        
        <KpiCard
          title="New Today"
          value={data?.newUsersToday.value ?? 0}
          icon={Users}
          trend={data?.newUsersToday.trend}
          trendPercent={data?.newUsersToday.trendPercent}
          previousValue={data?.newUsersToday.previousValue}
          isLoading={isLoading}
          subtitle="vs yesterday"
        />
        
        <KpiCard
          title="Admins"
          value={data?.totalAdmins ?? 0}
          icon={ShieldCheck}
          isLoading={isLoading}
          onClick={() => navigate('/admin/team')}
        />
      </div>
    </section>
  );
}
