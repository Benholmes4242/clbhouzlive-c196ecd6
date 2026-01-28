import React from 'react';
import { Users, UserCheck, AlertTriangle, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnalyticsDateRangePicker } from '@/components/admin/analytics/AnalyticsDateRangePicker';
import { DateRange } from '@/hooks/admin/useAnalyticsData';
import { AuthMonitoringStats } from '@/hooks/admin/useAuthMonitoringStats';

interface AuthMonitoringHeaderProps {
  stats: AuthMonitoringStats | null;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  loading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  isWarning?: boolean;
}

function StatCard({ icon, label, value, subtitle, trend, isWarning }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {icon}
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${isWarning ? 'text-amber-500' : ''}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AuthMonitoringHeader({ stats, dateRange, onDateRangeChange, loading }: AuthMonitoringHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auth Monitoring</h2>
          <p className="text-muted-foreground text-sm">
            Monitor authentication health, signups, and profile issues
          </p>
        </div>
        <AnalyticsDateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Total Profiles"
          value={loading ? '...' : stats?.totalProfiles.toLocaleString() || '0'}
          subtitle="All registered users"
        />
        <StatCard
          icon={<UserCheck className="w-4 h-4" />}
          label="Signups (24h)"
          value={loading ? '...' : stats?.signups24h || 0}
          subtitle={`${stats?.signups7d || 0} in 7 days`}
          trend={stats?.signupTrend}
        />
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Onboarding Rate"
          value={loading ? '...' : `${stats?.onboardingRate || 0}%`}
          subtitle={`${stats?.completedOnboarding || 0} completed`}
          isWarning={stats ? stats.onboardingRate < 50 : false}
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Profile Errors"
          value={loading ? '...' : stats?.profileErrorsCount || 0}
          subtitle="Creation failures"
          isWarning={stats ? stats.profileErrorsCount > 0 : false}
        />
      </div>
    </div>
  );
}
