import { useEffect, useState } from "react";
import { adminRoleManage } from "@/lib/adminRoleApi";
import { getUserIdByEmail } from "@/lib/usersLookup";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { track } from "@/lib/telemetry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Users as UsersIcon, RefreshCw, AlertTriangle, ArrowUp, ArrowDown, X, Clock, History } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminListCard, AdminBottomSheet, AdminListSkeleton, AdminEmptyState, type StatusVariant } from "@/components/admin/mobile";
import { formatDistanceToNow } from "date-fns";

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
  const [error, setError] = useState<string | null>(null);
  const [auditFor, setAuditFor] = useState<string | null>(null);
  const [auditRows, setAuditRows] = useState<AuditEntry[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    action: () => Promise<void>;
    title: string;
    message: string;
  } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Mobile state
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminRoleManage<{ data: Membership[] }>("list_admins");
      setRows(res.data || []);
    } catch (error: any) {
      setError("Failed to load admins");
      toast.error(`Failed to load admins: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    track("admin_members_opened");
  }, []);

  const grantLimited = async (user_id: string, notes?: string, expires_at?: string) => {
    try {
      await adminRoleManage("grant_limited", { user_id, notes, expires_at });
      toast.success("Limited admin access granted");
      track("admin_role_granted", { target_user_id: user_id, role: "limited", expires_at });
      await load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const grantFull = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("grant_full", { user_id, notes });
      toast.success("Full admin access granted");
      track("admin_role_granted", { target_user_id: user_id, role: "full" });
      await load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const downgrade = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("downgrade", { user_id, notes });
      toast.success("Admin downgraded to limited");
      track("admin_role_downgraded", { target_user_id: user_id });
      setSelectedMember(null);
      await load();
    } catch (error: any) {
      const message = error?.message || "Failed to downgrade admin";
      toast.error(message.includes("last full admin") ? "Cannot downgrade" : message);
    }
  };

  const revoke = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("revoke", { user_id, notes });
      toast.success("Admin access revoked");
      track("admin_role_revoked", { target_user_id: user_id });
      setSelectedMember(null);
      await load();
    } catch (error: any) {
      const message = error?.message || "Failed to revoke admin role";
      toast.error(message.includes("last full admin") ? "Cannot revoke" : message);
    }
  };

  const setExpiry = async (user_id: string, expires_at: string, notes?: string) => {
    try {
      await adminRoleManage("set_expiry", { user_id, expires_at, notes });
      toast.success("Expiry date set");
      setSelectedMember(null);
      await load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const clearExpiry = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("clear_expiry", { user_id, notes });
      toast.success("Expiry date cleared");
      setSelectedMember(null);
      await load();
    } catch (error: any) {
      toast.error(error.message);
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

  const selectedIds = Array.from(selected);
  const clearSelection = () => setSelected(new Set());

  const openAudit = async (target_user_id: string) => {
    try {
      const res = await adminRoleManage<{ data: AuditEntry[] }>("list_audit", { target_user_id });
      setAuditFor(target_user_id);
      setAuditRows(res.data || []);
      track("admin_audit_viewed", { target_user_id });
    } catch (error: any) {
      toast.error(error.message);
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
  
  // Helper to calculate days until expiry
  const daysUntil = (iso?: string | null) => {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    return Math.floor(diff / (1000*60*60*24));
  };

  // Get status for member
  const getMemberStatus = (member: Membership): { label: string; variant: StatusVariant } => {
    if (member.expires_at) {
      const days = daysUntil(member.expires_at);
      if (days !== null && days < 0) {
        return { label: "Expired", variant: "error" };
      }
      if (days !== null && days < 7) {
        return { label: `Expires in ${days}d`, variant: "warning" };
      }
    }
    return { label: member.role === "full" ? "Full Admin" : "Limited", variant: member.role === "full" ? "default" : "muted" };
  };

  // Toast for expiring admins on load
  useEffect(() => {
    if (expiringSoon.length > 0 && !loading) {
      toast.warning("Admin memberships expiring soon", {
        description: `${expiringSoon.length} admin${expiringSoon.length>1?"s":""} expiring within 7 days.`,
      });
    }
  }, [rows.length]); // eslint-disable-line

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Members
            </h1>
            <p className="text-sm text-muted-foreground">Panel admins & roles (Full admins only).</p>
          </div>
          <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Bulk actions bar (desktop only) */}
        {selected.size > 0 && !isMobile && (
          <div className="sticky top-0 z-20 mb-3 flex items-center justify-between rounded-md border p-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {expiringSoon.length} admin{expiringSoon.length > 1 ? 's' : ''} expiring within 7 days.
          </div>
        )}

        {/* Quick-add by User ID or email */}
        <AddMemberInline onGrantLimited={grantLimited} onGrantFull={grantFull} />

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>Retry</Button>
          </div>
        )}

        {/* Members list */}
        {loading ? (
          isMobile ? (
            <AdminListSkeleton count={4} />
          ) : (
            <Card>
              <CardContent className="py-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading…</span>
              </CardContent>
            </Card>
          )
        ) : rows.length === 0 ? (
          <AdminEmptyState 
            icon={Shield} 
            title="No admin members yet" 
            description="Use the form above to grant admin access."
          />
        ) : isMobile ? (
          /* Mobile: Card list */
          <div className="space-y-3">
            {rows.map((member) => (
              <AdminListCard
                key={member.user_id}
                primary={member.user_id.slice(0, 8) + "…" + member.user_id.slice(-4)}
                secondary={member.role === "full" ? "Full Admin" : "Limited Admin"}
                metadata={[
                  { label: "Granted", value: formatDistanceToNow(new Date(member.created_at), { addSuffix: true }) },
                  ...(member.expires_at ? [{ label: "Expires", value: new Date(member.expires_at).toLocaleDateString() }] : []),
                ]}
                status={getMemberStatus(member)}
                onClick={() => setSelectedMember(member)}
              />
            ))}
          </div>
        ) : (
          /* Desktop: Table */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Current Admin Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                            onCheckedChange={(v) => toggleSelect(r.user_id)}
                            aria-label={`Select ${r.user_id}`}
                          />
                        </td>
                        <td className="p-3 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                        <td className="p-3">
                          <Badge variant={r.role === "full" ? "destructive" : "default"}>
                            {r.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {r.expires_at ? (
                            <div className="flex items-center gap-2">
                              <span>{new Date(r.expires_at).toLocaleString()}</span>
                              {(() => {
                                const d = daysUntil(r.expires_at);
                                if (d === null || d < 0) return null;
                                const urgent = d < 3;
                                return (
                                  <span className={`text-xs px-2 py-0.5 rounded ${urgent ? "bg-destructive text-destructive-foreground" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
                                    {d}d left
                                  </span>
                                );
                              })()}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="p-3 max-w-xs truncate">{r.notes ?? "—"}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" variant="outline" onClick={() => openAudit(r.user_id)}>
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
                                    ? "Cannot downgrade the last full admin."
                                    : `This will restrict ${r.user_id.slice(0, 8)}… to read-only access.`
                                })}
                              >
                                Downgrade
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => grantFull(r.user_id)}>
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
                                  ? "Cannot revoke the last full admin."
                                  : `This will remove all admin permissions for ${r.user_id.slice(0, 8)}…`
                              })}
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
                              <Button size="sm" variant="outline" onClick={() => clearExpiry(r.user_id)}>
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
            </CardContent>
          </Card>
        )}

        {/* Mobile Bottom Sheet */}
        <AdminBottomSheet
          open={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={selectedMember ? `${selectedMember.user_id.slice(0, 8)}…${selectedMember.user_id.slice(-4)}` : "Admin Details"}
          subtitle={selectedMember?.role === "full" ? "Full Admin" : "Limited Admin"}
          actions={
            selectedMember && (
              <div className="space-y-2">
                {/* Role actions */}
                {selectedMember.role === "full" ? (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={isLastFullAdmin(selectedMember.user_id)}
                    onClick={() => {
                      setConfirmAction({
                        action: () => downgrade(selectedMember.user_id),
                        title: "Downgrade to Limited?",
                        message: "This will restrict to read-only access."
                      });
                    }}
                  >
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Downgrade to Limited
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => grantFull(selectedMember.user_id)}
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Upgrade to Full
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    const expires = prompt("Expiry ISO (e.g., 2026-01-01T00:00:00Z):");
                    if (expires) setExpiry(selectedMember.user_id, expires);
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {selectedMember.expires_at ? "Update Expiry" : "Set Expiry"}
                </Button>

                {selectedMember.expires_at && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => clearExpiry(selectedMember.user_id)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Clear Expiry
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    openAudit(selectedMember.user_id);
                    setSelectedMember(null);
                  }}
                >
                  <History className="h-4 w-4 mr-2" />
                  View Audit Log
                </Button>

                {/* Destructive action separated */}
                <div className="pt-2 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    disabled={isLastFullAdmin(selectedMember.user_id)}
                    onClick={() => {
                      setConfirmAction({
                        action: () => revoke(selectedMember.user_id),
                        title: "Revoke admin access?",
                        message: "This will remove all admin permissions."
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Revoke Access
                  </Button>
                </div>
              </div>
            )
          }
        >
          {selectedMember && (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">User ID</span>
                <span className="text-sm font-mono">{selectedMember.user_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant={selectedMember.role === "full" ? "destructive" : "default"}>
                  {selectedMember.role}
                </Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Granted</span>
                <span className="text-sm">{new Date(selectedMember.created_at).toLocaleString()}</span>
              </div>
              {selectedMember.expires_at && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className={`text-sm ${daysUntil(selectedMember.expires_at)! < 7 ? "text-amber-600" : ""}`}>
                    {new Date(selectedMember.expires_at).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedMember.notes && (
                <div className="py-2">
                  <span className="text-sm text-muted-foreground block mb-1">Notes</span>
                  <span className="text-sm">{selectedMember.notes}</span>
                </div>
              )}
            </div>
          )}
        </AdminBottomSheet>

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
  
  
  const handleGrant = async (type: "limited" | "full") => {
    if (!input.trim()) {
      toast.error("Please enter a user ID or email");
      return;
    }

    setLoading(true);
    try {
      let userId = input.trim();
      
      if (input.includes("@")) {
        const resolved = await getUserIdByEmail(input);
        if (!resolved) {
          toast.error("User not found", { description: "No user with that email" });
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add Admin Member</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Input
            className="flex-1 text-sm"
            placeholder="Enter user ID (UUID) or email"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button 
              className="flex-1 sm:flex-none"
              variant="outline"
              onClick={() => handleGrant("limited")}
              disabled={!input || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Limited"}
            </Button>
            <Button 
              className="flex-1 sm:flex-none"
              onClick={() => handleGrant("full")}
              disabled={!input || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Full"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Audit modal */
function AuditModal({ title, rows, onClose }: { title: string; rows: AuditEntry[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[70vh] overflow-auto">
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
            <div className="rounded-md border overflow-x-auto">
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
