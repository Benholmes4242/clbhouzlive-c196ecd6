import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/telemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, Trash2, RefreshCw } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Invitation = {
  id: string;
  email: string;
  role: "limited" | "full";
  token: string;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  notes: string | null;
};

export function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"limited" | "full">("limited");
  const [notes, setNotes] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvites();
    track("admin_invites_opened");
  }, []);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-manage", {
        body: { action: "list_invites", limit: 50, offset: 0 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setInvites(data.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load invites: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!email || !role) {
      toast({ title: "Error", description: "Email and role are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-manage", {
        body: { action: "create_invite", email, role, notes },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Success", description: `Invitation sent to ${email}` });
      track("admin_invite_created", { email, role });
      
      // Reset form
      setEmail("");
      setRole("limited");
      setNotes("");
      
      await loadInvites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create invite: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeInvite = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-invite-manage", {
        body: { action: "revoke_invite", id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Success", description: "Invitation revoked" });
      track("admin_invite_revoked", { id });
      setConfirmRevoke(null);
      await loadInvites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to revoke invite: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/admin/invite-accept?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Success", description: "Invite link copied to clipboard" });
  };

  const pendingInvites = invites.filter(inv => !inv.accepted_at && new Date(inv.expires_at) > new Date());
  const expiredInvites = invites.filter(inv => !inv.accepted_at && new Date(inv.expires_at) <= new Date());
  const acceptedInvites = invites.filter(inv => inv.accepted_at);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin Invitations
          </h1>
          <p className="text-sm text-muted-foreground">
            Invite new admins by email (Full admins only).
          </p>
        </div>

        {/* Create invite form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "limited" | "full")} disabled={creating}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limited">Limited Admin</SelectItem>
                    <SelectItem value="full">Full Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Purpose or context for this invite"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={creating}
              />
            </div>
            <Button onClick={createInvite} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Invitation"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Pending invitations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Pending Invitations
              {pendingInvites.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingInvites.length}</Badge>
              )}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={loadInvites} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No pending invitations
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{inv.email}</span>
                        <Badge variant={inv.role === "full" ? "destructive" : "default"}>
                          {inv.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expires: {new Date(inv.expires_at).toLocaleString()}
                      </div>
                      {inv.notes && (
                        <div className="text-xs text-muted-foreground">
                          Notes: {inv.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(inv.token)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmRevoke(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accepted invitations */}
        {acceptedInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Accepted Invitations
                <Badge variant="secondary" className="ml-2">{acceptedInvites.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {acceptedInvites.map((inv) => (
                  <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{inv.email}</span>
                        <Badge variant={inv.role === "full" ? "destructive" : "default"}>
                          {inv.role}
                        </Badge>
                        <Badge variant="outline">Accepted</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Accepted: {new Date(inv.accepted_at!).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expired invitations */}
        {expiredInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Expired Invitations
                <Badge variant="secondary" className="ml-2">{expiredInvites.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiredInvites.map((inv) => (
                  <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg opacity-60">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{inv.email}</span>
                        <Badge variant={inv.role === "full" ? "destructive" : "default"}>
                          {inv.role}
                        </Badge>
                        <Badge variant="outline">Expired</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expired: {new Date(inv.expires_at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmRevoke(inv.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => confirmRevoke && revokeInvite(confirmRevoke)}
        title="Revoke Invitation?"
        message="This will permanently delete this invitation and prevent it from being accepted."
        confirmText="Revoke"
        confirmVariant="destructive"
      />
    </div>
  );
}
