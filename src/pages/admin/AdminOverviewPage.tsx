import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  AlertTriangle,
  ClipboardCheck,
  Clock,
  Mail,
  Database,
} from "lucide-react";

import { AdminOverviewHeader } from "@/components/admin/overview/AdminOverviewHeader";
import { MetricTile } from "@/components/admin/overview/MetricTile";
import { ActionQueueCard } from "@/components/admin/overview/ActionQueueCard";
import { RecentActivityList } from "@/components/admin/overview/RecentActivityList";
import { QuickActionsGrid } from "@/components/admin/overview/QuickActionsGrid";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/telemetry";

type Metrics = {
  total_users: number;
  active_7d: number;
  panel_full_admins: number;
  panel_limited_admins: number;
  invites_pending: number;
  expiring_7d: number;
};

type QueueCounts = {
  pendingVerifications: number | null;
  pendingInvites: number | null;
  expiringAdmins: number | null;
};

type BackfillResult = {
  matched: number;
  unmatched: number;
  alreadySet: number;
  unmatchedClubs: string[];
};

export function AdminOverviewPage() {
  const navigate = useNavigate();
  
  // Metrics state
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Queue counts (derived from metrics + additional queries)
  const [queues, setQueues] = useState<QueueCounts>({
    pendingVerifications: null,
    pendingInvites: null,
    expiringAdmins: null,
  });
  const [queuesLoading, setQueuesLoading] = useState(true);
  const [queuesError, setQueuesError] = useState<string | null>(null);

  // Backfill state
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);

  const runBackfill = async (dryRun: boolean) => {
    setBackfillLoading(true);
    setBackfillResult(null);
    
    try {
      const { data: usersToBackfill, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, home_club, primary_club_id')
        .not('home_club', 'is', null)
        .neq('home_club', '');
      
      if (usersError) throw usersError;

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
          await supabase
            .from('user_profiles')
            .update({ primary_club_id: update.clubId })
            .eq('id', update.id);
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

  useEffect(() => {
    track("admin_overview_opened");
    loadMetrics();
    loadQueues();
  }, []);

  const loadMetrics = async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const { data, error } = await supabase.rpc("admin_overview_metrics");
      if (error) throw error;
      if (data && data.length > 0) {
        setMetrics(data[0]);
      }
    } catch (e: any) {
      console.error("[AdminOverview] Metrics failed:", e);
      setMetricsError("Failed to load metrics");
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadQueues = async () => {
    setQueuesLoading(true);
    setQueuesError(null);
    try {
      // Parallel fetch for queue counts
      const [businessVerif, golferVerif, invites, expiringAdmins] = await Promise.all([
        supabase
          .from("business_verification_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("golfer_verification_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("admin_invitations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("admin_memberships")
          .select("user_id", { count: "exact", head: true })
          .not("expires_at", "is", null)
          .gte("expires_at", new Date().toISOString())
          .lte("expires_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setQueues({
        pendingVerifications: (businessVerif.count ?? 0) + (golferVerif.count ?? 0),
        pendingInvites: invites.count ?? 0,
        expiringAdmins: expiringAdmins.count ?? 0,
      });
    } catch (e: any) {
      console.error("[AdminOverview] Queues failed:", e);
      setQueuesError("Failed to load queues");
    } finally {
      setQueuesLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <AdminOverviewHeader />

      <div className="space-y-6">
        {/* Today Snapshot - Horizontal scroll on mobile, grid on desktop */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Today Snapshot</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible sm:pb-0">
            <MetricTile
              label="Total Users"
              value={metrics?.total_users ?? null}
              icon={Users}
              loading={metricsLoading}
              error={!!metricsError}
              subtitle="All registered"
              onClick={() => navigate("/admin/users")}
            />
            <MetricTile
              label="Signed in (7d)"
              value={metrics?.active_7d ?? null}
              icon={UserCheck}
              loading={metricsLoading}
              error={!!metricsError}
              subtitle={metrics ? `${((metrics.active_7d / Math.max(metrics.total_users, 1)) * 100).toFixed(0)}% of total` : undefined}
              tooltip="Based on authentication sign-ins in the last 7 days"
            />
            <MetricTile
              label="Full Admins"
              value={metrics?.panel_full_admins ?? null}
              icon={Shield}
              loading={metricsLoading}
              error={!!metricsError}
              subtitle={metrics ? `${metrics.panel_limited_admins} limited` : undefined}
              onClick={() => navigate("/admin/admins")}
            />
            <MetricTile
              label="Pending Invites"
              value={metrics?.invites_pending ?? null}
              icon={ShieldAlert}
              loading={metricsLoading}
              error={!!metricsError}
              subtitle={metrics?.invites_pending ? "Awaiting acceptance" : "No pending"}
              onClick={() => navigate("/admin/invites")}
            />
            <MetricTile
              label="Expiring (7d)"
              value={metrics?.expiring_7d ?? null}
              icon={AlertTriangle}
              loading={metricsLoading}
              error={!!metricsError}
              subtitle="Admin memberships"
              onClick={() => navigate("/admin/admins")}
            />
          </div>
        </section>

        {/* Action Queues */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Action Queues</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ActionQueueCard
              title="Pending Verifications"
              count={queues.pendingVerifications}
              description="Business & golfer verification requests"
              ctaLabel="Review Verifications"
              ctaPath="/admin/verification"
              icon={ClipboardCheck}
              loading={queuesLoading}
              error={!!queuesError}
            />
            <ActionQueueCard
              title="Admin Invites Pending"
              count={queues.pendingInvites}
              description="Invitations awaiting acceptance"
              ctaLabel="View Invites"
              ctaPath="/admin/invites"
              icon={Mail}
              loading={queuesLoading}
              error={!!queuesError}
            />
            <ActionQueueCard
              title="Expiring Admin Access"
              count={queues.expiringAdmins}
              description="Memberships expiring within 7 days"
              ctaLabel="Review Admins"
              ctaPath="/admin/admins"
              icon={Clock}
              loading={queuesLoading}
              error={!!queuesError}
            />
          </div>
        </section>

        {/* Recent Admin Activity */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h2>
          <RecentActivityList />
        </section>

        {/* Quick Actions */}
        <section>
          <QuickActionsGrid />
        </section>

        {/* Home Club Backfill (Temporary) */}
        <section className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-amber-600" />
            <h3 className="font-medium">Home Club ID Backfill</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Match home_club text → golf_clubs → populate primary_club_id
          </p>
          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => runBackfill(true)}
              disabled={backfillLoading}
            >
              {backfillLoading ? 'Running...' : 'Dry Run'}
            </Button>
            <Button 
              size="sm"
              onClick={() => runBackfill(false)}
              disabled={backfillLoading}
            >
              Run Backfill
            </Button>
          </div>
          {backfillResult && (
            <div className="text-sm space-y-1">
              <p className="text-green-600">✓ Matched: {backfillResult.matched}</p>
              <p className="text-muted-foreground">○ Already set: {backfillResult.alreadySet}</p>
              <p className="text-amber-600">✗ Unmatched: {backfillResult.unmatched}</p>
              {backfillResult.unmatchedClubs.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">Unmatched clubs ({backfillResult.unmatchedClubs.length})</summary>
                  <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 max-h-24 overflow-y-auto">
                    {backfillResult.unmatchedClubs.map((club, i) => (
                      <li key={i}>{club}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
