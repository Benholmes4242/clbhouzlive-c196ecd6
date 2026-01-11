import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  AlertCircle,
  Activity,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthStats {
  total_users: number;
  verified_users: number;
  unverified_users: number;
  active_24h: number;
  active_7d: number;
  signups_24h: number;
  signups_7d: number;
  total_profiles: number;
  completed_onboarding: number;
  incomplete_onboarding: number;
  orphaned_users: number;
  profile_errors_24h: number;
}

export function AuthMonitoringDashboard() {
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Fetch profile stats
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding', { count: 'exact' });

      if (profileError) throw profileError;

      const totalProfiles = profileData?.length || 0;
      const completedOnboarding = profileData?.filter(p => p.has_completed_onboarding).length || 0;
      const incompleteOnboarding = totalProfiles - completedOnboarding;

      // Fetch profile creation errors (last 24h)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: errorCount } = await supabase
        .from('profile_creation_errors')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday);

      setStats({
        total_users: totalProfiles, // Approximate from profiles
        verified_users: completedOnboarding,
        unverified_users: incompleteOnboarding,
        active_24h: 0, // Would need auth.users access
        active_7d: 0,
        signups_24h: 0,
        signups_7d: 0,
        total_profiles: totalProfiles,
        completed_onboarding: completedOnboarding,
        incomplete_onboarding: incompleteOnboarding,
        orphaned_users: 0, // Would need auth.users access
        profile_errors_24h: errorCount || 0,
      });

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to load auth stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Refresh every 60 seconds
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const hasHealthIssues = stats && (
    stats.orphaned_users > 0 ||
    stats.profile_errors_24h > 5 ||
    (stats.total_profiles > 0 && stats.completed_onboarding / stats.total_profiles < 0.5)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auth Monitoring</h2>
          {lastUpdated && (
            <p className="text-muted-foreground text-sm mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {hasHealthIssues && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="text-amber-500 font-medium text-sm">Issues Detected</span>
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title="Total Profiles"
          value={stats?.total_profiles.toLocaleString() || '0'}
          subtitle={`${stats?.completed_onboarding || 0} completed onboarding`}
        />

        <StatCard
          icon={<UserCheck className="w-5 h-5" />}
          title="Onboarding Rate"
          value={stats?.total_profiles 
            ? `${Math.round((stats.completed_onboarding / stats.total_profiles) * 100)}%`
            : '0%'
          }
          subtitle={`${stats?.incomplete_onboarding || 0} incomplete`}
          isWarning={stats?.total_profiles ? (stats.completed_onboarding / stats.total_profiles) < 0.5 : false}
        />

        <StatCard
          icon={<Activity className="w-5 h-5" />}
          title="Profile Errors (24h)"
          value={stats?.profile_errors_24h.toLocaleString() || '0'}
          subtitle="Creation failures"
          isWarning={stats?.profile_errors_24h ? stats.profile_errors_24h > 5 : false}
        />

        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Orphaned Users"
          value={stats?.orphaned_users.toLocaleString() || '0'}
          subtitle="Users without profiles"
          isWarning={stats?.orphaned_users ? stats.orphaned_users > 0 : false}
        />
      </div>

      {/* Auth Health Summary */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Health Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthItem
            label="Profile Creation"
            status={!stats?.profile_errors_24h || stats.profile_errors_24h === 0 ? 'healthy' : stats.profile_errors_24h > 5 ? 'error' : 'warning'}
            message={stats?.profile_errors_24h === 0 ? 'No errors' : `${stats?.profile_errors_24h} errors in 24h`}
          />
          <HealthItem
            label="Onboarding Completion"
            status={stats?.total_profiles && (stats.completed_onboarding / stats.total_profiles) >= 0.7 ? 'healthy' : 'warning'}
            message={stats?.total_profiles ? `${Math.round((stats.completed_onboarding / stats.total_profiles) * 100)}% completion rate` : 'No data'}
          />
          <HealthItem
            label="Orphaned Users"
            status={!stats?.orphaned_users || stats.orphaned_users === 0 ? 'healthy' : 'error'}
            message={stats?.orphaned_users === 0 ? 'None detected' : `${stats?.orphaned_users} orphaned`}
          />
        </div>
      </div>

      {/* Note about limited access */}
      <p className="text-xs text-muted-foreground">
        Note: Some metrics (active users, signups) require direct auth.users access which is restricted. 
        Consider using Supabase Edge Functions with service role key for complete metrics.
      </p>
    </div>
  );
}

// Helper Components
function StatCard({ 
  icon, 
  title, 
  value, 
  subtitle,
  isWarning = false
}: { 
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  isWarning?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <h3 className="text-sm text-muted-foreground mb-1">{title}</h3>
      <p className={`text-3xl font-bold mb-1 ${isWarning ? 'text-amber-500' : ''}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function HealthItem({ 
  label, 
  status,
  message
}: { 
  label: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
}) {
  const statusColors = {
    healthy: 'text-green-500',
    warning: 'text-amber-500',
    error: 'text-red-500'
  };

  const statusBg = {
    healthy: 'bg-green-500/10',
    warning: 'bg-amber-500/10',
    error: 'bg-red-500/10'
  };

  return (
    <div className={`p-4 rounded-lg ${statusBg[status]}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className={`text-sm ${statusColors[status]}`}>{message}</p>
    </div>
  );
}

export default AuthMonitoringDashboard;
