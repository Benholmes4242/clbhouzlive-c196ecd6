import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, User, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLogEntry {
  id: string;
  action: string;
  admin_user_id: string;
  target_email: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
}

const ACTION_LABELS: Record<string, string> = {
  delete_user: "Deleted user",
  reset_password: "Reset password",
  grant_admin: "Granted admin access",
  revoke_admin: "Revoked admin access",
  approve_verification: "Approved verification",
  reject_verification: "Rejected verification",
};

export function RecentActivityList() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("admin_audit_log")
        .select("id, action, admin_user_id, target_email, created_at, details")
        .order("created_at", { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setEntries((data ?? []) as AuditLogEntry[]);
    } catch (e: any) {
      console.error("[RecentActivityList] Failed to load:", e);
      setError("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No admin activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium text-sm">Recent Admin Activity</h3>
        <Button variant="ghost" size="sm" onClick={load} className="h-7 px-2">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      <div className="divide-y">
        {entries.map((entry) => {
          const hasError = entry.details && typeof entry.details === 'object' && 'error' in entry.details;
          const actionLabel = ACTION_LABELS[entry.action] || entry.action;
          
          return (
            <div key={entry.id} className="p-3 sm:p-4 flex items-start gap-3">
              {/* Status icon */}
              <div className={`mt-0.5 rounded-full p-1.5 ${hasError ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                {hasError ? (
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{actionLabel}</span>
                  {entry.target_email && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      → {entry.target_email}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
