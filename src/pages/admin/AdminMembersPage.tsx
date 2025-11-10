import { useEffect, useState } from "react";
import { adminRoleManage } from "@/lib/adminRoleApi";
import { getUserIdByEmail } from "@/lib/usersLookup";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { track } from "@/lib/telemetry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Users as UsersIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type Membership = {
  user_id: string;
  role: "limited" | "full";
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  granted_by: string | null;
  notes: string | null;
};

type AuditEntry = {
  id: string;
  action: string;
  target_user_id: string;
  actor_user_id: string;
  notes: string | null;
  created_at: string;
};

export function AdminMembersPage() {
  const [rows, setRows] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditFor, setAuditFor] = useState<string | null>(null);
  const [auditRows, setAuditRows] = useState<AuditEntry[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    action: () => Promise<void>;
    title: string;
    message: string;
  } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminRoleManage<{ data: Membership[] }>("list_admins");
      setRows(res.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load admins: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    track("admin_members_opened");
  }, [toast]);

  const grantLimited = async (user_id: string, notes?: string, expires_at?: string) => {
    try {
      await adminRoleManage("grant_limited", { user_id, notes, expires_at });
      toast({ title: "Success", description: "Limited admin access granted" });
      track("admin_role_granted", { target_user_id: user_id, role: "limited", expires_at });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const grantFull = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("grant_full", { user_id, notes });
      toast({ title: "Success", description: "Full admin access granted" });
      track("admin_role_granted", { target_user_id: user_id, role: "full" });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const downgrade = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("downgrade", { user_id, notes });
      toast({ title: "Success", description: "Admin downgraded to limited" });
      track("admin_role_downgraded", { target_user_id: user_id });
      await load();
    } catch (error: any) {
      const message = error?.message || "Failed to downgrade admin";
      toast({
        title: message.includes("last full admin") ? "Cannot downgrade" : "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const revoke = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("revoke", { user_id, notes });
      toast({ title: "Success", description: "Admin access revoked" });
      track("admin_role_revoked", { target_user_id: user_id });
      await load();
    } catch (error: any) {
      const message = error?.message || "Failed to revoke admin role";
      toast({
        title: message.includes("last full admin") ? "Cannot revoke" : "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const setExpiry = async (user_id: string, expires_at: string, notes?: string) => {
    try {
      await adminRoleManage("set_expiry", { user_id, expires_at, notes });
      toast({ title: "Success", description: "Expiry date set" });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const clearExpiry = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("clear_expiry", { user_id, notes });
      toast({ title: "Success", description: "Expiry date cleared" });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Bulk operations
  const bulkGrantLimited = async () => {
    try {
      await adminRoleManage("grant_limited_bulk", { user_ids: Array.from(selected) });
      toast({ title: "Success", description: `Granted limited access to ${selected.size} admins` });
      track("admin_bulk_action", { action: "grant_limited_bulk", count: selected.size });
      setSelected(new Set());
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const bulkGrantFull = async () => {
    try {
      await adminRoleManage("grant_full_bulk", { user_ids: Array.from(selected) });
      toast({ title: "Success", description: `Granted full access to ${selected.size} admins` });
      track("admin_bulk_action", { action: "grant_full_bulk", count: selected.size });
      setSelected(new Set());
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const bulkDowngrade = async () => {
    try {
      await adminRoleManage("downgrade_bulk", { user_ids: Array.from(selected) });
      toast({ title: "Success", description: `Downgraded ${selected.size} admins to limited` });
      track("admin_bulk_action", { action: "downgrade_bulk", count: selected.size });
      setSelected(new Set());
      await load();
    } catch (error: any) {
      const message = error?.message || "Failed to downgrade admins";
      toast({
        title: message.includes("last full admin") ? "Cannot downgrade" : "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const bulkRevoke = async () => {
    try {
      await adminRoleManage("revoke_bulk", { user_ids: Array.from(selected) });
      toast({ title: "Success", description: `Revoked access for ${selected.size} admins` });
      track("admin_bulk_action", { action: "revoke_bulk", count: selected.size });
      setSelected(new Set());
      await load();
    } catch (error: any) {
      const message = error?.message || "Failed to revoke admin roles";
      toast({
        title: message.includes("last full admin") ? "Cannot revoke" : "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const toggleSelect = (user_id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(user_id)) {
      newSelected.delete(user_id);
    } else {
      newSelected.add(user_id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map(r => r.user_id)));
    }
  };

  const selectedIds = Array.from(selected);
  const clearSelection = () => setSelected(new Set());

  const openAudit = async (target_user_id: string) => {
    try {
      const res = await adminRoleManage<{ data: AuditEntry[] }>("list_audit", { target_user_id });
      setAuditFor(target_user_id);
      setAuditRows(res.data || []);
      track("admin_audit_viewed", { target_user_id });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Calculate expiring soon warnings
  const expiringSoon = rows.filter(r => {
    if (!r.expires_at) return false;
    const daysUntilExpiry = (new Date(r.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry > 0 && daysUntilExpiry < 7;
  });

  // Check if this is the last full admin (for UI protection)
  const fullAdmins = rows.filter(r => r.role === "full");
  const isLastFullAdmin = (user_id: string) => fullAdmins.length === 1 && fullAdmins[0]?.user_id === user_id;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Panel admins & roles (Full admins only).
          </p>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-md border p-3 bg-muted/30">
            <div className="text-sm">
              <strong>{selected.size}</strong> selected
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirmAction({
                  action: async () => {
                    await adminRoleManage("grant_limited_bulk", { user_ids: selectedIds });
                    await load();
                    clearSelection();
                  },
                  title: "Grant Limited (Bulk)?",
                  message: `Grant limited admin to ${selected.size} users.`,
                })}
              >
                Grant Limited
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmAction({
                  action: async () => {
                    await adminRoleManage("grant_full_bulk", { user_ids: selectedIds });
                    await load();
                    clearSelection();
                  },
                  title: "Upgrade to Full (Bulk)?",
                  message: `Upgrade ${selected.size} users to full admin.`,
                })}
              >
                Upgrade to Full
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmAction({
                  action: async () => {
                    await adminRoleManage("downgrade_bulk", { user_ids: selectedIds });
                    await load();
                    clearSelection();
                  },
                  title: "Downgrade (Bulk)?",
                  message: `Downgrade ${selected.size} users to limited admin.`,
                })}
              >
                Downgrade
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmAction({
                  action: async () => {
                    await adminRoleManage("revoke_bulk", { user_ids: selectedIds });
                    await load();
                    clearSelection();
                  },
                  title: "Revoke (Bulk)?",
                  message: `Revoke admin access for ${selected.size} users.`,
                })}
              >
                Revoke
              </Button>
            </div>
          </div>
        )}

        {/* Expiry warning banner */}
        {expiringSoon.length > 0 && (
          <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
            ⚠️ {expiringSoon.length} admin{expiringSoon.length > 1 ? 's' : ''} expiring within 7 days.
          </div>
        )}

      {/* Quick-add by User ID or email */}
      <AddMemberInline
        onGrantLimited={grantLimited}
        onGrantFull={grantFull}
      />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Current Admin Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-sm font-medium">No admin members yet</div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Use the form above to grant admin access by entering a user ID or email address.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium w-12">
                          <Checkbox
                            checked={rows.length > 0 && rows.every((r) => selected.has(r.user_id))}
                            onCheckedChange={(v) => {
                              if (v) {
                                setSelected(new Set(rows.map(r => r.user_id)));
                              } else {
                                setSelected(new Set());
                              }
                            }}
                            aria-label="Select all"
                          />
                        </th>
                        <th className="text-left p-3 font-medium">User ID</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Expires</th>
                        <th className="text-left p-3 font-medium">Notes</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.user_id} className="border-b last:border-0">
                          <td className="p-3">
                            <Checkbox
                              checked={selected.has(r.user_id)}
                              onCheckedChange={(v) => {
                                if (v) {
                                  setSelected(new Set([...selected, r.user_id]));
                                } else {
                                  const newSelected = new Set(selected);
                                  newSelected.delete(r.user_id);
                                  setSelected(newSelected);
                                }
                              }}
                              aria-label={`Select ${r.user_id}`}
                            />
                          </td>
                          <td className="p-3 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                          <td className="p-3">
                            <Badge variant={r.role === "full" ? "destructive" : "default"}>
                              {r.role}
                            </Badge>
                          </td>
                          <td className="p-3">{r.expires_at ? new Date(r.expires_at).toLocaleString() : "—"}</td>
                          <td className="p-3 max-w-xs truncate">{r.notes ?? "—"}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openAudit(r.user_id)}
                              >
                                Audit
                              </Button>
                              {r.role === "full" ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  disabled={isLastFullAdmin(r.user_id)}
                                  onClick={() => setConfirmAction({
                                    action: () => downgrade(r.user_id),
                                    title: "Downgrade to Limited?",
                                    message: isLastFullAdmin(r.user_id)
                                      ? "Cannot downgrade the last full admin. Promote another admin to full first."
                                      : `This will restrict ${r.user_id.slice(0, 8)}… to read-only access.`
                                  })}
                                  title={isLastFullAdmin(r.user_id) ? "Cannot downgrade the last full admin" : ""}
                                >
                                  Downgrade
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => grantFull(r.user_id)}
                                >
                                  Upgrade
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="destructive"
                                disabled={isLastFullAdmin(r.user_id)}
                                onClick={() => setConfirmAction({
                                  action: () => revoke(r.user_id),
                                  title: "Revoke admin access?",
                                  message: isLastFullAdmin(r.user_id)
                                    ? "Cannot revoke the last full admin. Promote another admin to full first."
                                    : `This will remove all admin permissions for ${r.user_id.slice(0, 8)}…`
                                })}
                                title={isLastFullAdmin(r.user_id) ? "Cannot revoke the last full admin" : ""}
                              >
                                Revoke
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  const expires = prompt("Expiry ISO (e.g., 2026-01-01T00:00:00Z):");
                                  if (expires) setExpiry(r.user_id, expires);
                                }}
                              >
                                Set Expiry
                              </Button>
                              {r.expires_at && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => clearExpiry(r.user_id)}
                                >
                                  Clear Expiry
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="sm:hidden space-y-3">
                  {rows.map(r => (
                    <div key={r.user_id} className="rounded-lg border p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selected.has(r.user_id)}
                              onChange={() => toggleSelect(r.user_id)}
                              className="rounded border-border"
                            />
                            <span className="text-xs font-mono text-muted-foreground break-all">
                              {r.user_id}
                            </span>
                          </div>
                          <Badge variant={r.role === "full" ? "destructive" : "default"} className="text-xs">
                            {r.role}
                          </Badge>
                        </div>
                        {r.expires_at && (
                          <div className="text-xs text-muted-foreground">
                            Expires: {new Date(r.expires_at).toLocaleString()}
                          </div>
                        )}
                        {r.notes && (
                          <div className="text-xs text-muted-foreground">
                            Notes: {r.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-center h-9"
                          onClick={() => openAudit(r.user_id)}
                        >
                          View Audit Log
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {r.role === "full" ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-9"
                              disabled={isLastFullAdmin(r.user_id)}
                              onClick={() => setConfirmAction({
                                action: () => downgrade(r.user_id),
                                title: "Downgrade to Limited?",
                                message: isLastFullAdmin(r.user_id)
                                  ? "Cannot downgrade the last full admin. Promote another admin to full first."
                                  : `This will restrict to read-only access.`
                              })}
                            >
                              Downgrade
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-9"
                              onClick={() => grantFull(r.user_id)}
                            >
                              Upgrade to Full
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="h-9"
                            disabled={isLastFullAdmin(r.user_id)}
                            onClick={() => setConfirmAction({
                              action: () => revoke(r.user_id),
                              title: "Revoke admin access?",
                              message: isLastFullAdmin(r.user_id)
                                ? "Cannot revoke the last full admin. Promote another admin to full first."
                                : `This will remove all admin permissions.`
                            })}
                          >
                            Revoke Access
                          </Button>
                        </div>

                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full h-9"
                          onClick={() => {
                            const expires = prompt("Expiry ISO (e.g., 2026-01-01T00:00:00Z):");
                            if (expires) setExpiry(r.user_id, expires);
                          }}
                        >
                          {r.expires_at ? 'Update Expiry' : 'Set Expiry'}
                        </Button>

                        {r.expires_at && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full h-9"
                            onClick={() => clearExpiry(r.user_id)}
                          >
                            Clear Expiry
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

      {/* Audit drawer/modal */}
      {auditFor && (
        <AuditModal onClose={() => setAuditFor(null)} title={`Audit for ${auditFor}`} rows={auditRows} />
      )}

        {/* Confirmation modal */}
        {confirmAction && (
          <ConfirmModal
            isOpen={true}
            onClose={() => setConfirmAction(null)}
            onConfirm={async () => {
              await confirmAction.action();
              setConfirmAction(null);
            }}
            title={confirmAction.title}
            message={confirmAction.message}
            confirmText="Confirm"
            confirmVariant="destructive"
          />
        )}
      </div>
    </div>
  );
}

/** Inline component for adding members */
function AddMemberInline(props: {
  onGrantLimited: (user_id: string, notes?: string, expires_at?: string) => Promise<void>;
  onGrantFull: (user_id: string, notes?: string) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const handleGrant = async (type: "limited" | "full") => {
    if (!input.trim()) {
      toast({ title: "Please enter a user ID or email", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let userId = input.trim();
      
      // If input looks like email, resolve to UUID
      if (input.includes("@")) {
        const resolved = await getUserIdByEmail(input);
        if (!resolved) {
          toast({ title: "User not found", description: "No user with that email", variant: "destructive" });
          setLoading(false);
          return;
        }
        userId = resolved;
      }

      if (type === "limited") {
        await props.onGrantLimited(userId);
      } else {
        await props.onGrantFull(userId);
      }
      
      setInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Admin Member</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1 text-sm"
            placeholder="Enter user ID (UUID) or email address"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <Button 
            onClick={() => handleGrant("limited")}
            disabled={!input || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Limited"}
          </Button>
          <Button 
            onClick={() => handleGrant("full")}
            disabled={!input || loading}
            variant="destructive"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Full"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Audit modal */
function AuditModal({ title, rows, onClose }: { title: string; rows: AuditEntry[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <Card className="w-[680px] max-h-[70vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No audit entries.</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Time</th>
                    <th className="text-left p-2 font-medium">Action</th>
                    <th className="text-left p-2 font-medium">Notes</th>
                    <th className="text-left p-2 font-medium">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="p-2">{a.action}</td>
                      <td className="p-2">{a.notes ?? "—"}</td>
                      <td className="p-2 font-mono text-xs">{a.actor_user_id.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
