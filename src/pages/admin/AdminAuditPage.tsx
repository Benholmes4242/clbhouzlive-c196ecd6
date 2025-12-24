import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format, subDays, subHours } from "date-fns";
import { 
  CheckCircle2, 
  XCircle, 
  Filter, 
  RefreshCw, 
  ChevronRight, 
  Calendar,
  Search,
  Clock,
  User,
  Shield,
  ClipboardCheck,
  Mail,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { AdminListCard } from "@/components/admin/mobile/AdminListCard";
import { AdminBottomSheet } from "@/components/admin/mobile/AdminBottomSheet";
import { AdminListSkeleton } from "@/components/admin/mobile/AdminListSkeleton";
import { AdminEmptyState } from "@/components/admin/mobile/AdminEmptyState";

interface AuditEntry {
  id: string;
  source: string;
  actor_id: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  status: string;
}

const ACTION_LABELS: Record<string, string> = {
  delete_user: "Deleted user",
  reset_password: "Reset password",
  grant_admin: "Granted admin access",
  revoke_admin: "Revoked admin access",
  approve_verification: "Approved verification",
  reject_verification: "Rejected verification",
  create_invite: "Created invitation",
  revoke_invite: "Revoked invitation",
  update_role: "Updated role",
  extend_expiry: "Extended expiry",
  downgrade: "Downgraded role",
  upgrade: "Upgraded role",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  delete_user: User,
  grant_admin: Shield,
  revoke_admin: Shield,
  approve_verification: ClipboardCheck,
  reject_verification: ClipboardCheck,
  create_invite: Mail,
  revoke_invite: Mail,
};

const DATE_RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

export function AdminAuditPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  const debouncedSearch = useDebounce(search, 300);

  // Calculate date range filter
  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "24h":
        return subHours(now, 24).toISOString();
      case "7d":
        return subDays(now, 7).toISOString();
      case "30d":
        return subDays(now, 30).toISOString();
      default:
        return null;
    }
  };

  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-audit-feed", debouncedSearch, dateRange, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Date filter
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }

      // Status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data ?? []) as AuditEntry[];

      // Client-side search filter
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        results = results.filter(
          (e) =>
            e.action.toLowerCase().includes(term) ||
            e.target_email?.toLowerCase().includes(term) ||
            (ACTION_LABELS[e.action] || e.action).toLowerCase().includes(term)
        );
      }

      return results;
    },
    staleTime: 30 * 1000,
  });

  const handleEntryClick = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return (
        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
          Success
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-red-500/10 text-red-600">
        Failed
      </Badge>
    );
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action.replace(/_/g, " ");
  };

  // Detail content component
  const DetailContent = ({ entry }: { entry: AuditEntry }) => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {entry.status === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <span className="font-medium">{getActionLabel(entry.action)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(entry.created_at), "PPpp")}
        </div>
      </div>

      {/* Details grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Action</div>
            <div className="font-medium">{entry.action}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</div>
            {getStatusBadge(entry.status)}
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Source</div>
            <div>{entry.source}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Actor ID</div>
            <div className="font-mono text-xs truncate">{entry.actor_id}</div>
          </div>
        </div>

        {entry.target_email && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Target</div>
            <div className="text-sm">{entry.target_email}</div>
          </div>
        )}

        {entry.target_user_id && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Target User ID</div>
            <div className="font-mono text-xs">{entry.target_user_id}</div>
          </div>
        )}

        {entry.ip_address && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">IP Address</div>
            <div className="font-mono text-xs">{entry.ip_address}</div>
          </div>
        )}

        {entry.user_agent && (
          <div>
            <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">User Agent</div>
            <div className="text-xs text-muted-foreground break-all">{entry.user_agent}</div>
          </div>
        )}
      </div>

      {/* JSON details */}
      {entry.details && Object.keys(entry.details).length > 0 && (
        <div>
          <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Details</div>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
            {JSON.stringify(entry.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  // Filters component
  const FiltersBar = () => (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search actions, emails..."
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-full sm:w-40">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-36">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={() => refetch()}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Failed to load audit log</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Track admin actions and system events</p>
        </div>
      </div>

      <FiltersBar />

      {/* Mobile view */}
      {isMobile ? (
        <>
          {isLoading ? (
            <AdminListSkeleton count={8} />
          ) : entries.length === 0 ? (
            <AdminEmptyState
              icon={Clock}
              title="No audit entries found"
              description="Adjust your filters to see more results"
            />
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                return (
                  <AdminListCard
                    key={entry.id}
                    primary={getActionLabel(entry.action)}
                    secondary={entry.target_email || entry.target_user_id?.slice(0, 8) || "System"}
                    metadata={[{ label: "Time", value: formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }) }]}
                    status={{
                      label: entry.status,
                      variant: entry.status === "success" ? "success" : "error",
                    }}
                    onClick={() => handleEntryClick(entry)}
                  />
                );
              })}
            </div>
          )}
          <AdminBottomSheet
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            title="Audit Entry Details"
          >
            {selectedEntry && <DetailContent entry={selectedEntry} />}
          </AdminBottomSheet>
        </>
      ) : (
        /* Desktop table */
        <>
          {isLoading ? (
            <div className="rounded-lg border bg-card">
              <div className="p-4 space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48 flex-1" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No audit entries found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Adjust your filters to see more results</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEntryClick(entry)}
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getActionLabel(entry.action)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.target_email || entry.target_user_id?.slice(0, 8) || "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Desktop detail drawer */}
          <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Audit Entry Details</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                {selectedEntry && <DetailContent entry={selectedEntry} />}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}

export default AdminAuditPage;
