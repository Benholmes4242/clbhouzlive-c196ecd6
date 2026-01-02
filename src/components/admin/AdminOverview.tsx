
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Shield, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AdminUser } from '@/hooks/useAdmin';

interface AdminOverviewProps {
  users: AdminUser[];
}

interface BackfillResult {
  matched: number;
  unmatched: number;
  alreadySet: number;
  unmatchedClubs: string[];
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ users }) => {
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.last_sign_in_at).length;
  const adminUsers = users.filter(user => user.role === 'admin' || user.role === 'limited_admin').length;
  const recentUsers = users.filter(user => {
    if (!user.auth_created_at) return false;
    const createdAt = new Date(user.auth_created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdAt > sevenDaysAgo;
  }).length;

  const runBackfill = async (dryRun: boolean) => {
    setBackfillLoading(true);
    setBackfillResult(null);
    
    try {
      // Get all users with home_club text but no primary_club_id
      const { data: usersToBackfill, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, home_club, primary_club_id')
        .not('home_club', 'is', null)
        .neq('home_club', '');
      
      if (usersError) throw usersError;

      // Get all golf clubs
      const { data: clubs, error: clubsError } = await supabase
        .from('golf_clubs')
        .select('id, name');
      
      if (clubsError) throw clubsError;

      const result: BackfillResult = {
        matched: 0,
        unmatched: 0,
        alreadySet: 0,
        unmatchedClubs: []
      };

      const updates: { id: string; clubId: string }[] = [];

      for (const user of usersToBackfill || []) {
        if (user.primary_club_id) {
          result.alreadySet++;
          continue;
        }

        const homeClubLower = user.home_club?.toLowerCase().trim();
        const matchedClub = clubs?.find(c => 
          c.name?.toLowerCase().trim() === homeClubLower
        );

        if (matchedClub) {
          result.matched++;
          updates.push({ id: user.id, clubId: matchedClub.id });
        } else {
          result.unmatched++;
          if (user.home_club && !result.unmatchedClubs.includes(user.home_club)) {
            result.unmatchedClubs.push(user.home_club);
          }
        }
      }

      if (!dryRun && updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('user_profiles')
            .update({ primary_club_id: update.clubId })
            .eq('id', update.id);
          
          if (error) {
            console.error('Failed to update user:', update.id, error);
          }
        }
        toast.success(`Backfill complete! Updated ${updates.length} users.`);
      } else if (dryRun) {
        toast.info(`Dry run complete. Would update ${updates.length} users.`);
      }

      setBackfillResult(result);
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('Backfill failed');
    } finally {
      setBackfillLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold mb-2">Admin Overview</h2>
        <p className="text-muted-foreground">Monitor your platform's key metrics</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users who have signed in
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Admins and limited admins
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-bold">{recentUsers}</div>
            <p className="text-xs text-muted-foreground">
              Users registered in last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Home Club Backfill Panel */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Home Club ID Backfill
          </CardTitle>
          <CardDescription>
            Match home_club text to golf_clubs and populate primary_club_id
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => runBackfill(true)}
              disabled={backfillLoading}
            >
              {backfillLoading ? 'Running...' : 'Dry Run (Preview)'}
            </Button>
            <Button 
              onClick={() => runBackfill(false)}
              disabled={backfillLoading}
            >
              Run Backfill
            </Button>
          </div>

          {backfillResult && (
            <div className="space-y-2 text-sm">
              <p className="text-green-600">✓ Matched: {backfillResult.matched}</p>
              <p className="text-muted-foreground">○ Already set: {backfillResult.alreadySet}</p>
              <p className="text-amber-600">✗ Unmatched: {backfillResult.unmatched}</p>
              {backfillResult.unmatchedClubs.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Unmatched club names:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground max-h-32 overflow-y-auto">
                    {backfillResult.unmatchedClubs.slice(0, 20).map((club, i) => (
                      <li key={i}>{club}</li>
                    ))}
                    {backfillResult.unmatchedClubs.length > 20 && (
                      <li>...and {backfillResult.unmatchedClubs.length - 20} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users
                .sort((a, b) => new Date(b.auth_created_at).getTime() - new Date(a.auth_created_at).getTime())
                .slice(0, 5)
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.display_name || user.username || 'No name set'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.auth_created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Distribution of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { role: 'admin', count: users.filter(u => u.role === 'admin').length },
                { role: 'limited_admin', count: users.filter(u => u.role === 'limited_admin').length },
                { role: 'moderator', count: users.filter(u => u.role === 'moderator').length },
                { role: 'user', count: users.filter(u => u.role === 'user').length },
                { role: 'no role', count: users.filter(u => !u.role).length },
              ].map(({ role, count }) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
