import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { track } from "@/lib/telemetry";
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
  total_count: number;
};

export function AdminUsersPage() {
  const { role } = usePanelRole();
  const can = panelCan(role);
  const readOnly = !can.dangerousOps;
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const offset = useMemo(() => page * pageSize, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_users_paged", {
        q: q || null,
        p_limit: pageSize,
        p_offset: offset,
      });
      if (error) throw error;
      const typedData = (data ?? []) as AdminUserRow[];
      
      // Convert to AdminUser format
      const adminUsers: AdminUser[] = typedData.map((row) => ({
        id: row.id,
        email: row.email,
        auth_created_at: row.created_at,
        last_sign_in_at: row.last_sign_in_at,
        email_confirmed_at: null,
        display_name: row.display_name,
        username: row.username,
        home_club: row.home_club,
        is_public: null,
        profile_created_at: null,
        role: row.role as 'admin' | 'moderator' | 'user' | 'limited_admin' | null,
      }));
      
      setRows(adminUsers);
      setTotal(typedData?.[0]?.total_count ?? 0);
    } catch (e) {
      console.error("[AdminUsersPage] load failed:", e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    track("admin_users_opened");
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    load();
  };

  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>All application users (paginated). {readOnly && "Read only."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSearch} className="flex items-center gap-2 mb-4">
              <Input
                placeholder="Search by email, id, username…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="max-w-md"
              />
              <Button type="submit" disabled={loading}>Search</Button>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows:</span>
                <select
                  className="border rounded px-2 py-1 bg-background"
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
              </div>
            </form>

            <UsersTable users={rows} readOnly={readOnly} />

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {total.toLocaleString()} total • page {page + 1} / {Math.max(1, maxPage + 1)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading}>
                  Prev
                </Button>
                <Button variant="outline" onClick={() => setPage((p) => Math.min(maxPage, p + 1))} disabled={page >= maxPage || loading}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
