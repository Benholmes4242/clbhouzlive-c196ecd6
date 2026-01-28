import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, ChevronDown, ChevronUp, Loader2, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { UserFilters, type StatusFilter, type RoleFilter, type VerifiedFilter } from "@/components/admin/users/UserFilters";
import { UserDetailDrawer } from "@/components/admin/users/UserDetailDrawer";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { track } from "@/lib/telemetry";
import { format } from "date-fns";
import type { AdminUser } from "@/hooks/useAdmin";

type AdminUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  home_club: string | null;
  role: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  avatar_url: string | null;
  is_verified: boolean;
  total_count: number;
};

type SortField = 'display_name' | 'email' | 'role' | 'created_at' | 'last_sign_in_at';
type SortDirection = 'asc' | 'desc';

export function AdminUsersPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const readOnly = !can.dangerousOps;

  // Data state
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const offset = useMemo(() => page * pageSize, [page, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.rpc("get_users_paged", {
        q: searchQuery || null,
        p_limit: pageSize,
        p_offset: offset,
      });
      if (error) throw error;

      const typedData = (data ?? []) as {
        id: string;
        email: string;
        display_name: string | null;
        username: string | null;
        home_club: string | null;
        role: string | null;
        last_sign_in_at: string | null;
        created_at: string;
        total_count: number;
      }[];

      // Enrich with profile data (avatar, verified status)
      const userIds = typedData.map(u => u.id);
      
      let profilesMap: Record<string, { profile_photo_url: string | null; is_verified_golfer: boolean }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, profile_photo_url, is_verified_golfer')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { profile_photo_url: p.profile_photo_url, is_verified_golfer: p.is_verified_golfer };
            return acc;
          }, {} as Record<string, { profile_photo_url: string | null; is_verified_golfer: boolean }>);
        }
      }

      const enrichedRows: AdminUserRow[] = typedData.map((row) => ({
        ...row,
        avatar_url: profilesMap[row.id]?.profile_photo_url || null,
        is_verified: profilesMap[row.id]?.is_verified_golfer || false,
      }));

      setRows(enrichedRows);
      setTotal(typedData?.[0]?.total_count ?? 0);
    } catch (e: unknown) {
      console.error("[AdminUsersPage] load failed:", e);
      setRows([]);
      setTotal(0);
      setErrorMsg("Couldn't load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, pageSize, offset]);

  useEffect(() => {
    track("admin_users_opened");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Apply client-side filters and sorting
  const filteredAndSortedRows = useMemo(() => {
    let filtered = [...rows];

    // Apply role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'none') {
        filtered = filtered.filter(r => !r.role);
      } else {
        filtered = filtered.filter(r => r.role === roleFilter);
      }
    }

    // Apply verified filter
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(r => verifiedFilter === 'yes' ? r.is_verified : !r.is_verified);
    }

    // Apply status filter (based on last_sign_in_at - active = signed in within 30 days)
    if (statusFilter !== 'all') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      filtered = filtered.filter(r => {
        const lastSignIn = r.last_sign_in_at ? new Date(r.last_sign_in_at) : null;
        const isActive = lastSignIn && lastSignIn > thirtyDaysAgo;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | null = null;
      let bVal: string | null = null;

      switch (sortField) {
        case 'display_name':
          aVal = a.display_name || a.email;
          bVal = b.display_name || b.email;
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'role':
          aVal = a.role || 'zzz';
          bVal = b.role || 'zzz';
          break;
        case 'created_at':
          aVal = a.created_at;
          bVal = b.created_at;
          break;
        case 'last_sign_in_at':
          aVal = a.last_sign_in_at || '';
          bVal = b.last_sign_in_at || '';
          break;
      }

      const comparison = (aVal || '').localeCompare(bVal || '');
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rows, roleFilter, verifiedFilter, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = () => {
    setPage(0);
    load();
  };

  const handleRowClick = (userId: string) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedRows.map(r => r.id)));
    }
  };

  const handleSelectRow = (userId: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(userId);
    } else {
      newSet.delete(userId);
    }
    setSelectedIds(newSet);
  };

  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  const exportCsv = () => {
    const headers = [
      "email", "display_name", "username", "home_club", "role", "verified", "last_sign_in_at", "created_at", "id"
    ];
    const lines = [headers.join(",")];
    filteredAndSortedRows.forEach((r) => {
      const vals = [
        r.email ?? "",
        r.display_name ?? "",
        r.username ?? "",
        r.home_club ?? "",
        r.role ?? "",
        r.is_verified ? "Yes" : "No",
        r.last_sign_in_at ?? "",
        r.created_at ?? "",
        r.id
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_page_${page + 1}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'limited_admin': return 'default';
      case 'moderator': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage users, roles, and permissions {readOnly && "(Read only)"}
          </p>
        </div>

        {/* Filters */}
        <UserFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          roleFilter={roleFilter}
          onRoleChange={setRoleFilter}
          verifiedFilter={verifiedFilter}
          onVerifiedChange={setVerifiedFilter}
          selectedCount={selectedIds.size}
          onExportCsv={exportCsv}
          disabled={loading}
        />

        {/* Error state */}
        {errorMsg && (
          <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 flex items-center justify-between">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!readOnly && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.size === filteredAndSortedRows.length && filteredAndSortedRows.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    <SortableHeader field="display_name">User</SortableHeader>
                    <SortableHeader field="email">Email</SortableHeader>
                    <SortableHeader field="role">Role</SortableHeader>
                    <TableHead>Verified</TableHead>
                    <SortableHeader field="created_at">Joined</SortableHeader>
                    <SortableHeader field="last_sign_in_at">Last Active</SortableHeader>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {!readOnly && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredAndSortedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={readOnly ? 7 : 8} className="text-center py-12 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedRows.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(user.id)}
                      >
                        {!readOnly && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(user.id)}
                              onCheckedChange={(checked) => handleSelectRow(user.id, !!checked)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.display_name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate flex items-center gap-1">
                                {user.display_name || user.email.split('@')[0]}
                                {user.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                              </div>
                              {user.username && (
                                <div className="text-xs text-muted-foreground">@{user.username}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {user.role || 'None'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.is_verified ? (
                            <Badge variant="secondary" className="text-xs">Yes</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_sign_in_at
                            ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy')
                            : 'Never'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem onClick={() => handleRowClick(user.id)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/golfer/${user.username || user.id}`, '_blank')}>
                                View Profile
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {total.toLocaleString()} total • Showing {filteredAndSortedRows.length} • Page {page + 1} / {Math.max(1, maxPage + 1)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <select
              className="border rounded px-2 py-1 bg-background text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        userId={selectedUserId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUserDeleted={load}
      />
    </div>
  );
}
