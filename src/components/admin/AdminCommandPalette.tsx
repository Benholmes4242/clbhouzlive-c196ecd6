import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Building2, MapPin, Shield, Mail, ClipboardCheck, Loader2 } from "lucide-react";
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
  type: "user" | "business" | "course" | "admin" | "invite" | "verification";
  primary: string;
  secondary?: string;
  status?: string;
  link: string;
}

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESULT_ICONS: Record<string, React.ElementType> = {
  user: User,
  business: Building2,
  course: MapPin,
  admin: Shield,
  invite: Mail,
  verification: ClipboardCheck,
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600",
  pending: "bg-amber-500/10 text-amber-600",
  expired: "bg-red-500/10 text-red-600",
  verified: "bg-green-500/10 text-green-600",
};

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${q}%`;
      
      // Parallel searches with limits
      const [users, businesses, courses, admins, invites] = await Promise.all([
        // Users
        supabase
          .from("user_profiles")
          .select("id, display_name, username")
          .or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm}`)
          .limit(5),
        // Businesses
        supabase
          .from("business_accounts")
          .select("id, name, is_verified")
          .ilike("name", searchTerm)
          .eq("is_deleted", false)
          .limit(5),
        // Courses
        supabase
          .from("golf_courses")
          .select("id, name, country")
          .ilike("name", searchTerm)
          .limit(5),
        // Admin members
        supabase
          .from("admin_memberships")
          .select("user_id, role, expires_at")
          .limit(5),
        // Invites
        supabase
          .from("admin_invitations")
          .select("id, email, status")
          .ilike("email", searchTerm)
          .limit(5),
      ]);

      const allResults: SearchResult[] = [];

      // Map users
      if (users.data) {
        users.data.forEach((u) => {
          allResults.push({
            id: u.id,
            type: "user",
            primary: u.display_name || u.username || "Unknown",
            secondary: u.username ? `@${u.username}` : undefined,
            link: `/admin/users?q=${encodeURIComponent(u.username || u.id)}`,
          });
        });
      }

      // Map businesses
      if (businesses.data) {
        businesses.data.forEach((b) => {
          allResults.push({
            id: b.id,
            type: "business",
            primary: b.name,
            status: b.is_verified ? "verified" : undefined,
            link: `/admin/businesses?q=${encodeURIComponent(b.name)}`,
          });
        });
      }

      // Map courses
      if (courses.data) {
        courses.data.forEach((c) => {
          allResults.push({
            id: c.id,
            type: "course",
            primary: c.name,
            secondary: c.country || undefined,
            link: `/admin/golf-courses?q=${encodeURIComponent(c.name)}`,
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
            status: i.status,
            link: `/admin/invites`,
          });
        });
      }

      setResults(allResults);
    } catch (error) {
      console.error("[AdminCommandPalette] Search error:", error);
      setResults([]);
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

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    user: "Users",
    business: "Businesses",
    course: "Golf Courses",
    admin: "Admin Members",
    invite: "Invitations",
    verification: "Verifications",
  };

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
              placeholder="Search users, businesses, courses..."
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
              </div>
            )}
            {query && results.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}
            {Object.entries(groupedResults).map(([type, items]) => (
              <div key={type}>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                  {typeLabels[type] || type}
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
        placeholder="Search users, businesses, courses..."
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
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘K</kbd> anytime to open
              </p>
            </div>
          </CommandEmpty>
        )}
        {Object.entries(groupedResults).map(([type, items], index) => (
          <React.Fragment key={type}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={typeLabels[type] || type}>
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
