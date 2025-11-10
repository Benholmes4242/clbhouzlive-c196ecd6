import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Shield, ShieldAlert, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Metrics = {
  total_users: number;
  active_7d: number;
  panel_full_admins: number;
  panel_limited_admins: number;
  invites_pending: number;
  expiring_7d: number;
};

export function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc("admin_overview_metrics");
      if (error) throw error;
      if (data && data.length > 0) {
        setMetrics(data[0]);
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen overflow-x-hidden flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">System overview and metrics</p>
        </div>

        {/* Warning banners */}
        {metrics.expiring_7d > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {metrics.expiring_7d} admin membership{metrics.expiring_7d > 1 ? 's' : ''} expiring within 7 days
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => navigate("/admin/admins")}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/users")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">All registered users</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active (7d)
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_7d.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.total_users > 0 
                  ? `${((metrics.active_7d / metrics.total_users) * 100).toFixed(1)}% of total`
                  : 'No users yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/admins")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Full Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.panel_full_admins}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.panel_limited_admins} limited admin{metrics.panel_limited_admins !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/invites")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Invites
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.invites_pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.invites_pending > 0 ? 'Awaiting acceptance' : 'No pending invites'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/admin/admins")}>
                <Shield className="mr-2 h-4 w-4" />
                Manage Admins
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/admin/invites")}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                View Invites
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={loadMetrics}>
                Refresh Metrics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
