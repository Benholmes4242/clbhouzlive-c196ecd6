import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UserX, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileIssue, AuthMonitoringStats } from '@/hooks/admin/useAuthMonitoringStats';

interface AuthAlertsPanelProps {
  issues: ProfileIssue[];
  stats: AuthMonitoringStats | null;
  loading?: boolean;
}

interface AlertItem {
  id: string;
  type: 'warning' | 'error';
  title: string;
  description: string;
  count?: number;
  actionLabel?: string;
  actionHref?: string;
}

export function AuthAlertsPanel({ issues, stats, loading }: AuthAlertsPanelProps) {
  const navigate = useNavigate();

  const handleUserClick = (username: string) => {
    navigate(`/admin/users?search=${encodeURIComponent(username)}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5" />
            Alerts & Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build alerts from stats and issues
  const alerts: AlertItem[] = [];

  // Profile errors alert
  if (stats && stats.profileErrorsCount > 0) {
    alerts.push({
      id: 'profile-errors',
      type: 'error',
      title: 'Profile Creation Failures',
      description: `${stats.profileErrorsCount} users encountered errors during profile creation`,
      count: stats.profileErrorsCount,
      actionLabel: 'View Errors',
    });
  }

  // Incomplete onboarding alert
  if (stats && stats.incompleteOnboarding > 5) {
    alerts.push({
      id: 'incomplete-onboarding',
      type: 'warning',
      title: 'Users with Incomplete Onboarding',
      description: `${stats.incompleteOnboarding} users haven't completed their profile setup`,
      count: stats.incompleteOnboarding,
      actionLabel: 'View Users',
      actionHref: '/admin/users?filter=incomplete',
    });
  }

  // Low onboarding rate
  if (stats && stats.onboardingRate < 50 && stats.totalProfiles > 10) {
    alerts.push({
      id: 'low-onboarding',
      type: 'warning',
      title: 'Low Onboarding Completion Rate',
      description: `Only ${stats.onboardingRate}% of users complete onboarding. Consider simplifying the flow.`,
    });
  }

  // Orphaned users
  if (stats && stats.orphanedUsers > 0) {
    alerts.push({
      id: 'orphaned-users',
      type: 'error',
      title: 'Orphaned Users Detected',
      description: `${stats.orphanedUsers} users exist in auth.users but have no profile`,
      count: stats.orphanedUsers,
    });
  }

  const incompleteUsers = issues.filter(i => i.issue_type === 'incomplete_onboarding');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5" />
            Alerts & Issues
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 && incompleteUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-muted-foreground">No active alerts</p>
            <p className="text-xs text-muted-foreground mt-1">
              Auth system is healthy
            </p>
          </div>
        ) : (
          <>
            {/* Alert cards */}
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.type === 'error' 
                    ? 'bg-red-500/5 border-red-500/20' 
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      alert.type === 'error' ? 'bg-red-500/10' : 'bg-amber-500/10'
                    }`}>
                      {alert.type === 'error' ? (
                        <UserX className="w-4 h-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                  </div>
                  {alert.count && (
                    <Badge variant="secondary" className="ml-2">
                      {alert.count}
                    </Badge>
                  )}
                </div>
                {alert.actionLabel && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 w-full justify-between"
                    asChild={!!alert.actionHref}
                  >
                    {alert.actionHref ? (
                      <a href={alert.actionHref}>
                        {alert.actionLabel}
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <>
                        {alert.actionLabel}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}

            {/* Users needing attention */}
            {incompleteUsers.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Users Needing Attention</h4>
                <div className="space-y-2">
                  {incompleteUsers.slice(0, 5).map((user) => (
                    <button 
                      key={user.id}
                      onClick={() => handleUserClick(user.username)}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 w-full text-left hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
                          <UserX className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">{user.username}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {user.issue_type === 'incomplete_onboarding' 
                            ? 'Incomplete' 
                            : user.issue_type === 'no_avatar' 
                              ? 'No Avatar' 
                              : 'Missing Data'}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                  {incompleteUsers.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/admin/users?filter=incomplete')}>
                      View all {incompleteUsers.length} users
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
