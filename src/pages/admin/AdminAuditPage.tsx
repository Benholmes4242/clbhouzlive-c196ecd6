import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format, subDays, subHours, isToday } from "date-fns";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw, 
  ChevronRight, 
  ChevronDown,
  Calendar,
  Search,
  Clock,
  Copy,
  Check,
  X,
  FilterX,
  Download,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { AdminListCard } from "@/components/admin/mobile/AdminListCard";
import { AdminBottomSheet } from "@/components/admin/mobile/AdminBottomSheet";
import { AdminListSkeleton } from "@/components/admin/mobile/AdminListSkeleton";
import { AdminEmptyState } from "@/components/admin/mobile/AdminEmptyState";
import { toast } from "sonner";

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
  bulk_approve: "Bulk approved",
  bulk_reject: "Bulk rejected",
  import_courses: "Imported courses",
};

// Map actions to categories
const ACTION_CATEGORIES: Record<string, string> = {
  delete_user: "user",
  reset_password: "user",
  grant_admin: "admin_role",
  revoke_admin: "admin_role",
  update_role: "admin_role",
  extend_expiry: "admin_role",
  downgrade: "admin_role",
  upgrade: "admin_role",
  approve_verification: "verification",
  reject_verification: "verification",
  bulk_approve: "verification",
  bulk_reject: "verification",
  create_invite: "invite",
  revoke_invite: "invite",
  import_courses: "import",
};

const DATE_RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "blocked", label: "Blocked" },
  { value: "failed", label: "Failed" },
];

const ACTION_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "user", label: "User" },
  { value: "verification", label: "Verification" },
  { value: "admin_role", label: "Admin Role" },
  { value: "invite", label: "Invite" },
  { value: "import", label: "Import" },
];

// Copy to clipboard helper
function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(label ? `${label} copied` : "Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

export function AdminAuditPage() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Read initial state from URL
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [dateRange, setDateRange] = useState(searchParams.get("date") || "7d");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [actionType, setActionType] = useState(searchParams.get("type") || "all");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  
  const debouncedSearch = useDebounce(search, 300);

  // Keyboard shortcut for search focus (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !detailOpen && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailOpen]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (dateRange !== "7d") params.set("date", dateRange);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (actionType !== "all") params.set("type", actionType);
    setSearchParams(params, { replace: true });
  }, [search, dateRange, statusFilter, actionType, setSearchParams]);

  // Calculate date range filter
  const getDateFilter = useCallback(() => {
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
  }, [dateRange]);

  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-audit-feed", debouncedSearch, dateRange, statusFilter, actionType],
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

      // Action type filter (client-side since it's derived)
      if (actionType !== "all") {
        results = results.filter((e) => {
          const category = ACTION_CATEGORIES[e.action] || "other";
          return category === actionType;
        });
      }

      // Client-side search filter
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        results = results.filter(
          (e) =>
            e.action.toLowerCase().includes(term) ||
            e.target_email?.toLowerCase().includes(term) ||
            e.actor_id?.toLowerCase().includes(term) ||
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
    setRequestInfoOpen(false);
  };

  const clearFilters = () => {
    setSearch("");
    setDateRange("7d");
    setStatusFilter("all");
    setActionType("all");
  };

  const hasActiveFilters = search || dateRange !== "7d" || statusFilter !== "all" || actionType !== "all";

  // Stats calculations
  const stats = useMemo(() => {
    const total = entries.length;
    const today = entries.filter(e => isToday(new Date(e.created_at))).length;
    const uniqueAdmins = new Set(entries.map(e => e.actor_id)).size;
    const successCount = entries.filter(e => e.status === "success").length;
    return { total, today, uniqueAdmins, successCount };
  }, [entries]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (entries.length === 0) {
      toast.error("No entries to export");
      return;
    }

    const headers = ["Time", "Action", "Target Email", "Target User ID", "Status", "Actor ID", "IP Address"];
    const rows = entries.map(e => [
      format(new Date(e.created_at), "yyyy-MM-dd HH:mm:ss"),
      e.action,
      e.target_email || "",
      e.target_user_id || "",
      e.status,
      e.actor_id,
      e.ip_address || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${entries.length} entries`);
  }, [entries]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
            Success
          </Badge>
        );
      case "blocked":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
            Failed
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "blocked":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action] || action.replace(/_/g, " ");
  };

  // Detail content component with collapsible request info
  const DetailContent = ({ entry }: { entry: AuditEntry }) => (
    <div className="space-y-6 py-4">
      {/* Summary section */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</h3>
        <div className="flex items-center gap-3">
          {getStatusIcon(entry.status)}
          <div>
            <div className="font-medium">{getActionLabel(entry.action)}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(entry.created_at), "PPpp")}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(entry.status)}
          <Badge variant="outline" className="text-xs">
            {entry.source === "audit_log" ? "Audit" : "Role Audit"}
          </Badge>
        </div>
      </section>

      {/* Actor section */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actor</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">User ID</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="truncate max-w-[180px]">{entry.actor_id}</span>
              <CopyButton value={entry.actor_id} label="Actor ID" />
            </div>
          </div>
        </div>
      </section>

      {/* Target section */}
      {(entry.target_email || entry.target_user_id) && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target</h3>
          <div className="space-y-2 text-sm">
            {entry.target_email && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <div className="flex items-center gap-1">
                  <span>{entry.target_email}</span>
                  <CopyButton value={entry.target_email} label="Email" />
                </div>
              </div>
            )}
            {entry.target_user_id && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="truncate max-w-[180px]">{entry.target_user_id}</span>
                  <CopyButton value={entry.target_user_id} label="Target ID" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Metadata section */}
      {entry.details && Object.keys(entry.details).length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metadata</h3>
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            {Object.entries(entry.details).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-right max-w-[60%] break-words">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Request Info - Collapsible */}
      {(entry.ip_address || entry.user_agent) && (
        <Collapsible open={requestInfoOpen} onOpenChange={setRequestInfoOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full">
            <ChevronDown className={cn("h-4 w-4 transition-transform", requestInfoOpen && "rotate-180")} />
            Request Info
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 space-y-3 text-sm">
              {entry.ip_address && (
                <div>
                  <div className="text-muted-foreground text-xs mb-1">IP Address</div>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span>{entry.ip_address}</span>
                    <CopyButton value={entry.ip_address} label="IP" />
                  </div>
                </div>
              )}
              {entry.user_agent && (
                <div>
                  <div className="text-muted-foreground text-xs mb-1">User Agent</div>
                  <div className="text-xs text-muted-foreground break-all">{entry.user_agent}</div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );

  // Filter chips for action type
  const ActionTypeChips = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {ACTION_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setActionType(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            actionType === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  // Stats cards
  const StatsCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Entries</span>
          </div>
          <p className="text-xl font-semibold mt-1">{stats.total}</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <p className="text-xl font-semibold mt-1">{stats.today}</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Unique Admins</span>
          </div>
          <p className="text-xl font-semibold mt-1">{stats.uniqueAdmins}</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs text-muted-foreground">Success Rate</span>
          </div>
          <p className="text-xl font-semibold mt-1">
            {stats.total > 0 ? Math.round((stats.successCount / stats.total) * 100) : 0}%
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Filters bar
  const FiltersBar = () => (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actor, target, action..."
                  className="pl-9 pr-12"
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                ) : (
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    /
                  </kbd>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Press <kbd className="ml-1 font-mono text-xs">/</kbd> to focus</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
          <SelectTrigger className="w-full sm:w-32">
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
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={exportToCSV} title="Export CSV">
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export to CSV</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
            <FilterX className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>
      <ActionTypeChips />
    </div>
  );

  // Empty state with clear filters
  const EmptyState = () => (
    <div className="rounded-lg border bg-card p-12 text-center">
      <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
      <p className="text-muted-foreground font-medium">No activity found for this filter</p>
      <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
        Try adjusting your filters to see more results
      </p>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <FilterX className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      )}
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

      {!isLoading && <StatsCards />}
      <FiltersBar />

      {/* Mobile view */}
      {isMobile ? (
        <>
          {isLoading ? (
            <AdminListSkeleton count={8} />
          ) : entries.length === 0 ? (
            <AdminEmptyState
              icon={Clock}
              title="No activity found for this filter"
              description={hasActiveFilters ? "Try adjusting your filters" : undefined}
            />
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <AdminListCard
                  key={entry.id}
                  primary={getActionLabel(entry.action)}
                  secondary={entry.target_email || entry.target_user_id?.slice(0, 8) || "System"}
                  metadata={[{ label: "Time", value: formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }) }]}
                  status={{
                    label: entry.status,
                    variant: entry.status === "success" ? "success" : entry.status === "blocked" ? "warning" : "error",
                  }}
                  onClick={() => handleEntryClick(entry)}
                />
              ))}
            </div>
          )}
          {hasActiveFilters && entries.length === 0 && (
            <div className="text-center py-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <FilterX className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
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
            <EmptyState />
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
