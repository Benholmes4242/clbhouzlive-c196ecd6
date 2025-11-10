import { useEffect, useState } from "react";
import { adminRoleManage } from "@/lib/adminRoleApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users as UsersIcon } from "lucide-react";

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

  useEffect(() => { load(); }, []);

  const grantLimited = async (user_id: string, notes?: string, expires_at?: string) => {
    try {
      await adminRoleManage("grant_limited", { user_id, notes, expires_at });
      toast({ title: "Success", description: "Limited admin access granted" });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const grantFull = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("grant_full", { user_id, notes });
      toast({ title: "Success", description: "Full admin access granted" });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const downgrade = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("downgrade", { user_id, notes });
      toast({ title: "Success", description: "Admin downgraded to limited" });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const revoke = async (user_id: string, notes?: string) => {
    try {
      await adminRoleManage("revoke", { user_id, notes });
      toast({ title: "Success", description: "Admin access revoked" });
      await load();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const openAudit = async (target_user_id: string) => {
    try {
      const res = await adminRoleManage<{ data: AuditEntry[] }>("list_audit", { target_user_id });
      setAuditFor(target_user_id);
      setAuditRows(res.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Members
        </h1>
        <p className="text-sm text-muted-foreground">
          Panel admins & roles (Full admins only).
        </p>
      </div>

      {/* Quick-add by User ID */}
      <AddMemberInline
        onGrantLimited={(user_id, notes, expires_at) => grantLimited(user_id, notes, expires_at)}
        onGrantFull={(user_id, notes) => grantFull(user_id, notes)}
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
            <div className="p-8 text-center text-sm text-muted-foreground">
              No admin members yet.
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
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
                              onClick={() => downgrade(r.user_id)}
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
                            variant="outline" 
                            onClick={() => revoke(r.user_id)}
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
          )}
        </CardContent>
      </Card>

      {/* Audit drawer/modal */}
      {auditFor && (
        <AuditModal onClose={() => setAuditFor(null)} title={`Audit for ${auditFor}`} rows={auditRows} />
      )}
    </div>
  );
}

/** Inline component for adding members */
function AddMemberInline(props: {
  onGrantLimited: (user_id: string, notes?: string, expires_at?: string) => void;
  onGrantFull: (user_id: string, notes?: string) => void;
}) {
  const [userId, setUserId] = useState("");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Admin Member</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1 font-mono text-sm"
            placeholder="Paste target user_id (UUID)"
            value={userId}
            onChange={e => setUserId(e.target.value)}
          />
          <Button 
            onClick={() => {
              props.onGrantLimited(userId);
              setUserId("");
            }}
            disabled={!userId}
          >
            Grant Limited
          </Button>
          <Button 
            onClick={() => {
              props.onGrantFull(userId);
              setUserId("");
            }}
            disabled={!userId}
            variant="destructive"
          >
            Grant Full
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
