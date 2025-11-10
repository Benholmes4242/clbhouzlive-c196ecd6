import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminInvite } from "@/lib/adminInviteApi";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";

type InviteRow = {
  id: string;
  email: string;
  role: "limited" | "full";
  token: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  invited_by: string;
  notes: string | null;
};

export function AdminInvitesPage() {
  const { toast } = useToast();
  const { role } = usePanelRole();
  const can = panelCan(role);
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"limited" | "full">("limited");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminInvite("list_invites", { limit: 100, offset: 0 });
      setRows(res?.data ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load invites", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      if (!email.trim()) {
        toast({ title: "Email required", variant: "destructive" });
        return;
      }
      await adminInvite("create_invite", { email: email.trim(), role: inviteRole, notes: notes || undefined });
      toast({ title: "Invite created" });
      setEmail("");
      setNotes("");
      setInviteRole("limited");
      await load();
    } catch (e: any) {
      toast({ title: "Failed to create invite", description: e.message, variant: "destructive" });
    }
  };

  const revoke = async (id: string) => {
    try {
      await adminInvite("revoke_invite", { id });
      toast({ title: "Invite revoked" });
      await load();
    } catch (e: any) {
      toast({ title: "Failed to revoke invite", description: e.message, variant: "destructive" });
    }
  };

  const copyLink = async (token?: string | null) => {
    if (!token) {
      toast({ title: "No token on invite", variant: "destructive" });
      return;
    }
    const base = window?.location?.origin || "https://www.clbhouz.co.uk";
    const url = `${base}/admin/invite-accept?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Invite link copied" });
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast({ title: "Invite link copied" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!can.manageAdmins) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <div className="p-4 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Full admin access required.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Invites</CardTitle>
            <CardDescription>Create and manage invitation links for new admins (Full only).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input placeholder="Invitee email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "limited" | "full")}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button onClick={createInvite} disabled={loading}>Create Invite</Button>
            </div>

            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Expires</th>
                    <th className="text-left p-2">Accepted</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-4">Loading…</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No invites yet.</td></tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2">{r.email}</td>
                        <td className="p-2 capitalize">{r.role}</td>
                        <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2">{r.expires_at ? new Date(r.expires_at).toLocaleString() : "—"}</td>
                        <td className="p-2">{r.accepted_at ? new Date(r.accepted_at).toLocaleString() : "—"}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            {!r.accepted_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyLink(r.token)}
                                title="Copy invite link"
                              >
                                Copy Link
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!r.accepted_at}
                              onClick={() => revoke(r.id)}
                              title={r.accepted_at ? "Already accepted" : "Revoke"}
                            >
                              Revoke
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
