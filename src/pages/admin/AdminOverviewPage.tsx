import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  AlertTriangle,
  ClipboardCheck,
  Clock,
  Mail,
} from "lucide-react";

import { AdminOverviewHeader } from "@/components/admin/overview/AdminOverviewHeader";
import { MetricTile } from "@/components/admin/overview/MetricTile";
import { ActionQueueCard } from "@/components/admin/overview/ActionQueueCard";
import { RecentActivityList } from "@/components/admin/overview/RecentActivityList";
import { QuickActionsGrid } from "@/components/admin/overview/QuickActionsGrid";
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
      </div>
    </div>
  );
}
