import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Building2, MapPin, Shield, Mail, ClipboardCheck, Loader2, History, CheckCircle, UserCheck, ChevronRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "verification_business" | "verification_golfer" | "invite" | "admin" | "user" | "audit";
  primary: string;
  secondary?: string;
  status?: string;
  link: string;
  // For deep linking context
  entityId?: string;
  entityType?: string;
}

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESULT_ICONS: Record<string, React.ElementType> = {
  verification_business: Building2,
  verification_golfer: UserCheck,
  user: User,
  admin: Shield,
  invite: Mail,
  audit: History,
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600",
  pending: "bg-amber-500/10 text-amber-600",
  expired: "bg-red-500/10 text-red-600",
  verified: "bg-green-500/10 text-green-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
  invited: "bg-blue-500/10 text-blue-600",
  success: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
  blocked: "bg-amber-500/10 text-amber-600",
};

// Intent-based ranking order (lower = higher priority)
const TYPE_PRIORITY: Record<string, number> = {
  verification_business: 1,
  verification_golfer: 2,
  invite: 3,
  admin: 4,
  user: 5,
  audit: 6,
};

const TYPE_LABELS: Record<string, string> = {
  verification_business: "Business Verifications",
  verification_golfer: "Golfer Verifications",
  invite: "Admin Invites",
  admin: "Admin Members",
  user: "Users",
  audit: "Audit Log",
};

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debouncedQuery = useDebounce(query, 250);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Search function
  const performSearch = useCallback(async (q: string) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    try {
      const searchTerm = `%${q}%`;
      
      // Parallel searches with limits - prioritized by intent
      const [
        businessVerifications,
        golferVerifications,
        invites,
        adminMembers,
        users,
        auditEntries,
      ] = await Promise.all([
        // Pending business verifications (highest priority)
        supabase
          .from("business_verification_requests")
          .select(`
            id,
            status,
            business:business_accounts!business_id (id, name)
          `)
          .eq("status", "pending")
          .limit(5),
        // Pending golfer verifications
        supabase
          .from("golfer_verification_requests")
          .select("id, status, user_id")
          .eq("status", "pending")
          .limit(5),
        // Admin invites
        supabase
          .from("admin_invitations")
          .select("id, email, status")
          .ilike("email", searchTerm)
          .limit(5),
        // Admin members - fetch profiles for email search
        supabase
          .from("admin_memberships")
          .select("user_id, role, expires_at")
          .limit(5),
        // Users
        supabase
          .from("user_profiles")
          .select("id, display_name, username")
          .or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm}`)
          .limit(5),
        // Audit log entries
        supabase
          .from("admin_audit_log")
          .select("id, action, target_email, created_at, details")
          .or(`action.ilike.${searchTerm},target_email.ilike.${searchTerm}`)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const allResults: SearchResult[] = [];

      // Map business verifications - filter by search term
      if (businessVerifications.data) {
        const filtered = businessVerifications.data.filter((v) => {
          const business = v.business as { id: string; name: string } | null;
          const businessName = business?.name?.toLowerCase() || "";
          const requestId = v.id.toLowerCase();
          const searchLower = q.toLowerCase();
          return businessName.includes(searchLower) || 
                 requestId.includes(searchLower) ||
                 "pending".includes(searchLower) ||
                 "verification".includes(searchLower);
        });
        filtered.slice(0, 5).forEach((v) => {
          const business = v.business as { id: string; name: string } | null;
          allResults.push({
            id: v.id,
            type: "verification_business",
            primary: business?.name || "Unknown Business",
            secondary: "Business verification request",
            status: v.status,
            link: `/admin/verification?tab=business&request=${v.id}`,
            entityId: v.id,
            entityType: "business_verification",
          });
        });
      }

      // Map golfer verifications - filter by search term
      if (golferVerifications.data) {
        // Need to fetch user profiles for these
        const userIds = golferVerifications.data.map(v => v.user_id);
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, display_name, username")
          .in("id", userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);
        
        const filtered = golferVerifications.data.filter((v) => {
          const profile = profileMap.get(v.user_id);
          const name = (profile?.display_name || profile?.username || "").toLowerCase();
          const searchLower = q.toLowerCase();
          return name.includes(searchLower) ||
                 v.id.toLowerCase().includes(searchLower) ||
                 "pending".includes(searchLower) ||
                 "verification".includes(searchLower) ||
                 "golfer".includes(searchLower);
        });
        
        filtered.slice(0, 5).forEach((v) => {
          const profile = profileMap.get(v.user_id);
          allResults.push({
            id: v.id,
            type: "verification_golfer",
            primary: profile?.display_name || profile?.username || "Unknown Golfer",
            secondary: "Golfer verification request",
            status: v.status,
            link: `/admin/verification?tab=golfer&request=${v.id}`,
            entityId: v.id,
            entityType: "golfer_verification",
          });
        });
      }

      // Map invites
      if (invites.data) {
        invites.data.forEach((i) => {
          allResults.push({
            id: i.id,
            type: "invite",
            primary: i.email,
            secondary: "Admin invitation",
            status: i.status,
            link: `/admin/invites?highlight=${i.id}`,
            entityId: i.id,
          });
        });
      }

      // Map admin members
      if (adminMembers.data) {
        // Fetch profiles for admin members
        const userIds = adminMembers.data.map(m => m.user_id);
        const { data: adminProfiles } = await supabase
          .from("admin_profiles")
          .select("user_id, email, first_name, last_name")
          .in("user_id", userIds);
        
        const profileMap = new Map(adminProfiles?.map(p => [p.user_id, p]) ?? []);
        
        const filtered = adminMembers.data.filter((m) => {
          const profile = profileMap.get(m.user_id);
          const email = profile?.email?.toLowerCase() || "";
          const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.toLowerCase();
          const searchLower = q.toLowerCase();
          return email.includes(searchLower) || 
                 name.includes(searchLower) ||
                 m.role.toLowerCase().includes(searchLower);
        });
        
        filtered.slice(0, 5).forEach((m) => {
          const profile = profileMap.get(m.user_id);
          allResults.push({
            id: m.user_id,
            type: "admin",
            primary: profile?.email || "Unknown",
            secondary: `${m.role} admin`,
            status: m.expires_at && new Date(m.expires_at) < new Date() ? "expired" : "active",
            link: `/admin/admins?user=${m.user_id}`,
            entityId: m.user_id,
          });
        });
      }

      // Map users
      if (users.data) {
        users.data.forEach((u) => {
          allResults.push({
            id: u.id,
            type: "user",
            primary: u.display_name || u.username || "Unknown",
            secondary: u.username ? `@${u.username}` : undefined,
            link: `/admin/users?q=${encodeURIComponent(u.username || u.id)}`,
            entityId: u.id,
          });
        });
      }

      // Map audit entries
      if (auditEntries.data) {
        auditEntries.data.forEach((a) => {
          const details = a.details as Record<string, unknown> | null;
          allResults.push({
            id: a.id,
            type: "audit",
            primary: formatAuditAction(a.action),
            secondary: a.target_email || (details?.target_id as string) || undefined,
            link: `/admin/audit?q=${encodeURIComponent(a.action)}`,
            entityId: a.id,
          });
        });
      }

      // Sort by intent priority
      allResults.sort((a, b) => {
        const priorityA = TYPE_PRIORITY[a.type] ?? 99;
        const priorityB = TYPE_PRIORITY[b.type] ?? 99;
        return priorityA - priorityB;
      });

      setResults(allResults);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("[AdminCommandPalette] Search error:", error);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.link);
    onOpenChange(false);
    setQuery("");
  };

  // Group results by type, maintaining priority order
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    if (acc[result.type].length < 5) {
      acc[result.type].push(result);
    }
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Sort groups by priority
  const sortedGroups = Object.entries(groupedResults).sort(([a], [b]) => {
    return (TYPE_PRIORITY[a] ?? 99) - (TYPE_PRIORITY[b] ?? 99);
  });

  // Mobile full-screen search
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full h-full sm:max-w-full p-0 gap-0">
          <DialogTitle className="sr-only">Admin Search</DialogTitle>
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search verifications, invites, users..."
              className="flex-1 border-0 focus-visible:ring-0 text-base"
              autoFocus
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <ScrollArea className="flex-1">
            {!query && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Start typing to search</p>
                <p className="text-xs mt-2 opacity-70">Try "pending", an email, or a name</p>
              </div>
            )}
            {query && results.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}
            {sortedGroups.map(([type, items]) => (
              <div key={type}>
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {TYPE_LABELS[type] || type}
                  </span>
                  {items.length === 5 && (
                    <button
                      onClick={() => {
                        navigate(getViewAllLink(type, query));
                        onOpenChange(false);
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      View all <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {items.map((result) => {
                  const Icon = RESULT_ICONS[result.type] || Search;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{result.primary}</div>
                        {result.secondary && (
                          <div className="text-xs text-muted-foreground truncate">{result.secondary}</div>
                        )}
                      </div>
                      {result.status && (
                        <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[result.status])}>
                          {result.status}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop command dialog
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search verifications, invites, users, audit..."
      />
      <CommandList>
        {loading && (
          <div className="p-4 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          </div>
        )}
        {!loading && query && results.length === 0 && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}
        {!query && (
          <CommandEmpty>
            <div className="text-center py-6">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">Start typing to search</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try "pending", an email, or a name
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘K</kbd> anytime to open
              </p>
            </div>
          </CommandEmpty>
        )}
        {sortedGroups.map(([type, items], index) => (
          <React.Fragment key={type}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={
              <div className="flex items-center justify-between">
                <span>{TYPE_LABELS[type] || type}</span>
                {items.length === 5 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(getViewAllLink(type, query));
                      onOpenChange(false);
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                  >
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            }>
              {items.map((result) => {
                const Icon = RESULT_ICONS[result.type] || Search;
                return (
                  <CommandItem
                    key={result.id}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{result.primary}</span>
                      {result.secondary && (
                        <span className="text-muted-foreground ml-2 text-xs">{result.secondary}</span>
                      )}
                    </div>
                    {result.status && (
                      <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[result.status])}>
                        {result.status}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// Helper to format audit action into human-readable text
function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    verify_business_approve: "Business verification approved",
    verify_business_reject: "Business verification rejected",
    verify_golfer_approve: "Golfer verification approved",
    verify_golfer_reject: "Golfer verification rejected",
    verify_business_bulk_approve: "Bulk business approvals",
    verify_golfer_bulk_approve: "Bulk golfer approvals",
    invite_created: "Admin invite created",
    invite_accepted: "Admin invite accepted",
    invite_revoked: "Admin invite revoked",
    admin_role_granted: "Admin role granted",
    admin_role_revoked: "Admin role revoked",
    admin_role_updated: "Admin role updated",
  };
  return actionMap[action] || action.replace(/_/g, " ");
}

// Helper to get "View all" link for a result type
function getViewAllLink(type: string, query: string): string {
  const encodedQuery = encodeURIComponent(query);
  switch (type) {
    case "verification_business":
      return `/admin/verification?tab=business`;
    case "verification_golfer":
      return `/admin/verification?tab=golfer`;
    case "invite":
      return `/admin/invites`;
    case "admin":
      return `/admin/admins`;
    case "user":
      return `/admin/users?q=${encodedQuery}`;
    case "audit":
      return `/admin/audit?q=${encodedQuery}`;
    default:
      return "/admin";
  }
}

// Search trigger button for header
export function AdminSearchTrigger({ onClick }: { onClick: () => void }) {
  const isMobile = useIsMobile();

  return (
    <Button
      variant="outline"
      size={isMobile ? "icon" : "default"}
      onClick={onClick}
      className={cn(
        "text-muted-foreground",
        !isMobile && "w-64 justify-start"
      )}
    >
      <Search className="h-4 w-4" />
      {!isMobile && (
        <>
          <span className="ml-2 flex-1 text-left">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </>
      )}
    </Button>
  );
}
