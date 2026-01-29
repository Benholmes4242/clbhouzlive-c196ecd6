import React from 'react';
import { Shield, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthMonitoringStats } from '@/hooks/admin/useAuthMonitoringStats';

interface AuthHealthDashboardProps {
  stats: AuthMonitoringStats | null;
  loading?: boolean;
}

type HealthStatus = 'healthy' | 'warning' | 'error';

interface HealthMetric {
  label: string;
  value: number;
  target: number;
  status: HealthStatus;
  description: string;
}

function getHealthIcon(status: HealthStatus) {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
}

function getHealthColor(status: HealthStatus) {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'warning':
      return 'bg-amber-500';
    case 'error':
      return 'bg-red-500';
  }
}

function HealthMetricRow({ metric }: { metric: HealthMetric }) {
  const progressValue = Math.min((metric.value / metric.target) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getHealthIcon(metric.status)}
          <span className="text-sm font-medium">{metric.label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{metric.value}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div 
          className={`h-full transition-all ${getHealthColor(metric.status)}`}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{metric.description}</p>
    </div>
  );
}

export function AuthHealthDashboard({ stats, loading }: AuthHealthDashboardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Auth Health Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate profile richness (users with avatar, bio, and home club set)
  // For now, we approximate using onboarding + a slight penalty for incomplete data
  const profileRichness = stats?.totalProfiles 
    ? Math.max(0, Math.round((stats.completedOnboarding / stats.totalProfiles) * 100) - (stats.incompleteOnboarding > 0 ? 5 : 0))
    : 0;

  const metrics: HealthMetric[] = [
    {
      label: 'Onboarding Completion',
      value: stats?.onboardingRate || 0,
      target: 100,
      status: (stats?.onboardingRate || 0) >= 70 ? 'healthy' : (stats?.onboardingRate || 0) >= 50 ? 'warning' : 'error',
      description: `${stats?.completedOnboarding || 0} of ${stats?.totalProfiles || 0} users completed setup wizard`,
    },
    {
      label: 'Profile Creation Success',
      value: stats?.totalProfiles 
        ? Math.round(((stats.totalProfiles - stats.profileErrorsCount) / stats.totalProfiles) * 100)
        : 100,
      target: 100,
      status: (stats?.profileErrorsCount || 0) === 0 ? 'healthy' : (stats?.profileErrorsCount || 0) <= 5 ? 'warning' : 'error',
      description: `${stats?.profileErrorsCount || 0} profile creation errors`,
    },
    {
      label: 'Profile Richness',
      value: profileRichness,
      target: 100,
      status: profileRichness >= 80 ? 'healthy' : profileRichness >= 50 ? 'warning' : 'error',
      description: `${stats?.incompleteOnboarding || 0} users missing avatar or bio`,
    },
  ];

  const overallHealth: HealthStatus = metrics.some(m => m.status === 'error') 
    ? 'error' 
    : metrics.some(m => m.status === 'warning') 
      ? 'warning' 
      : 'healthy';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Auth Health Dashboard
          </CardTitle>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            overallHealth === 'healthy' ? 'bg-green-500/10 text-green-500' :
            overallHealth === 'warning' ? 'bg-amber-500/10 text-amber-500' :
            'bg-red-500/10 text-red-500'
          }`}>
            {getHealthIcon(overallHealth)}
            {overallHealth === 'healthy' ? 'All Systems Healthy' : 
             overallHealth === 'warning' ? 'Minor Issues' : 'Issues Detected'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => (
          <HealthMetricRow key={index} metric={metric} />
        ))}
      </CardContent>
    </Card>
  );
}
