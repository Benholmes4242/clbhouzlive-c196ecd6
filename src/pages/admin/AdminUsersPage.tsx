import { useState, useEffect } from "react";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/telemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  home_club: string | null;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  total_count: number;
};

export function AdminUsersPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    track("admin_users_opened");
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const { data, error } = await supabase.rpc("get_users_paged", {
        q: debouncedSearch || null,
        p_limit: pageSize,
        p_offset: offset,
      });

      if (error) throw error;

      setRows(data || []);
      setTotal(data?.[0]?.total_count ?? 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "admin": return "destructive";
      case "limited_admin": return "default";
      case "moderator": return "default";
      case "user": return "secondary";
      default: return "outline";
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    switch (role) {
      case "limited_admin": return "Limited Admin";
      case "admin": return "Admin";
      case "moderator": return "Moderator";
      case "user": return "User";
      default: return "No role";
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            All application users (visible to Limited + Full admins).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Users Management</span>
              {!can.dangerousOps && <Badge variant="secondary">Read Only</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search bar */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <Input
                type="text"
                placeholder="Search by email, ID, name, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-md"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-sm font-medium">No users found</div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchQuery ? "Try a different search term" : "Users will appear here once they sign up."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Home Club</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Last Sign In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.display_name || "—"}</TableCell>
                          <TableCell>{user.username || "—"}</TableCell>
                          <TableCell>{user.home_club || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card view */}
                <div className="sm:hidden space-y-3">
                  {rows.map((user) => (
                    <div key={user.id} className="rounded-lg border p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium break-all">{user.email}</div>
                        <div className="text-xs text-muted-foreground break-all">ID: {user.id}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Display Name</div>
                          <div className="font-medium">{user.display_name || "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Username</div>
                          <div className="font-medium">{user.username || "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Home Club</div>
                          <div className="font-medium">{user.home_club || "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Last Sign In</div>
                          <div className="font-medium">
                            {user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : "Never"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Page {page} of {totalPages} ({total.toLocaleString()} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))}
                      disabled={page * pageSize >= total || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
