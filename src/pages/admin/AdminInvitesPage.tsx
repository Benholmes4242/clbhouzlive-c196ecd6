import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { adminInvite } from "@/lib/adminInviteApi";
import { usePanelRole } from "@/hooks/usePanelRole";
import { panelCan } from "@/lib/panelCan";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminListCard, AdminBottomSheet, AdminListSkeleton, AdminEmptyState, type StatusVariant } from "@/components/admin/mobile";
import { Copy, Trash2, Mail, RefreshCw, AlertTriangle, CheckSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import { BulkActionBar, SelectModeHeader } from "@/components/admin/BulkActionBar";
import { SelectModeButton } from "@/components/admin/SelectModeButton";
import { revokeBulkInvites } from "@/lib/adminBulkApi";

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
  const { role } = usePanelRole();
  const can = panelCan(role);
  const isMobile = useIsMobile();
  
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"limited" | "full">("limited");
  const [notes, setNotes] = useState("");

  // Mobile state
  const [selectedInvite, setSelectedInvite] = useState<InviteRow | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [inviteToRevoke, setInviteToRevoke] = useState<InviteRow | null>(null);

  // Get revocable invites (not accepted, not expired)
  const revocableInvites = rows.filter(r => !r.accepted_at && (!r.expires_at || new Date(r.expires_at) > new Date()));

  // Bulk selection for revocable invites
  const bulkSelect = useBulkSelect(
    rows,
    (r) => !r.accepted_at && (!r.expires_at || new Date(r.expires_at) > new Date())
  );

  // Bulk revoke handler
  const handleBulkRevoke = async () => {
    try {
      const result = await bulkSelect.executeBulk(async (ids) => {
        return await revokeBulkInvites(ids);
      });
      toast.success(`Revoked ${result.success.length} invites`, {
        description: result.failed.length > 0 ? `${result.failed.length} failed` : undefined,
        action: {
          label: 'View Audit Log',
          onClick: () => window.location.href = '/admin/audit',
        },
      });
      await load();
      bulkSelect.exitSelectMode();
    } catch (error: any) {
      toast.error('Bulk revoke failed', { description: error.message });
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminInvite("list_invites", { limit: 100, offset: 0 });
      setRows(res?.data ?? []);
    } catch (e: any) {
      setError("Failed to load invites");
      toast.error("Failed to load invites", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      if (!email.trim()) {
        toast.error("Email required");
        return;
      }
      await adminInvite("create_invite", { email: email.trim(), role: inviteRole, notes: notes || undefined });
      toast.success("Invite created");
      setEmail("");
      setNotes("");
      setInviteRole("limited");
      await load();
    } catch (e: any) {
      toast.error("Failed to create invite", { description: e.message });
    }
  };

  const revoke = async (invite: InviteRow) => {
    try {
      await adminInvite("revoke_invite", { id: invite.id });
      toast.success("Invite revoked");
      setSelectedInvite(null);
      await load();
    } catch (e: any) {
      toast.error("Failed to revoke invite", { description: e.message });
    }
  };

  const copyLink = async (token?: string | null) => {
    if (!token) {
      toast.error("No token on invite");
      return;
    }
    const base = window?.location?.origin || "https://www.clbhouz.co.uk";
    const url = `${base}/admin/invite-accept?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast.success("Invite link copied");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getInviteStatus = (invite: InviteRow): { label: string; variant: StatusVariant } => {
    if (invite.accepted_at) {
      return { label: "Accepted", variant: "success" };
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { label: "Expired", variant: "error" };
    }
    return { label: "Pending", variant: "warning" };
  };

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
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Admin Invites
            </h1>
            <p className="text-sm text-muted-foreground">Create and manage invitation links.</p>
          </div>
          <div className="flex items-center gap-2">
            {revocableInvites.length > 0 && !bulkSelect.selectMode && (
              <SelectModeButton onClick={bulkSelect.enterSelectMode} />
            )}
            <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Bulk action bar */}
        {bulkSelect.selectMode && (
          <BulkActionBar
            selectedCount={bulkSelect.selectedCount}
            onCancel={bulkSelect.exitSelectMode}
            processing={!!bulkSelect.progress && bulkSelect.progress.processed < bulkSelect.progress.total}
            progress={bulkSelect.progress}
            actions={[
              {
                label: 'Revoke Selected',
                onClick: handleBulkRevoke,
                variant: 'destructive',
                icon: <Trash2 className="h-4 w-4" />,
              },
            ]}
          />
        )}

        {/* Create invite form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create New Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input 
                placeholder="Invitee email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "limited" | "full")}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder="Notes (optional)" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
              <Button onClick={createInvite} disabled={loading} className="w-full">
                Create Invite
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={load}>Retry</Button>
          </div>
        )}

        {/* Invites list */}
        {loading ? (
          isMobile ? (
            <AdminListSkeleton count={4} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">Loading…</CardContent>
            </Card>
          )
        ) : rows.length === 0 ? (
          <AdminEmptyState 
            icon={Mail} 
            title="No invites yet" 
            description="Create an invite above to get started."
          />
        ) : isMobile ? (
          /* Mobile: Card list */
          <div className="space-y-3">
            {/* Select mode header */}
            {bulkSelect.selectMode && (
              <SelectModeHeader
                selectedCount={bulkSelect.selectedCount}
                totalCount={bulkSelect.selectableCount}
                allSelected={bulkSelect.allSelected}
                onToggleAll={bulkSelect.toggleSelectAll}
                onCancel={bulkSelect.exitSelectMode}
              />
            )}
            {rows.map((invite) => {
              const isRevocable = !invite.accepted_at && (!invite.expires_at || new Date(invite.expires_at) > new Date());
              return (
                <AdminListCard
                  key={invite.id}
                  primary={invite.email}
                  secondary={`${invite.role.charAt(0).toUpperCase() + invite.role.slice(1)} Admin`}
                  metadata={[
                    { label: "Created", value: formatDistanceToNow(new Date(invite.created_at), { addSuffix: true }) },
                    ...(invite.expires_at ? [{ label: "Expires", value: new Date(invite.expires_at).toLocaleDateString() }] : []),
                  ]}
                  status={getInviteStatus(invite)}
                  onClick={() => { if (!bulkSelect.selectMode) setSelectedInvite(invite); }}
                  selectMode={bulkSelect.selectMode}
                  selected={bulkSelect.isSelected(invite.id)}
                  onSelect={() => bulkSelect.toggleSelect(invite.id)}
                  selectable={isRevocable}
                />
              );
            })}
          </div>
        ) : (
          /* Desktop: Table */
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Expires</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((invite) => {
                      const status = getInviteStatus(invite);
                      return (
                        <tr key={invite.id} className="border-t">
                          <td className="p-3">{invite.email}</td>
                          <td className="p-3 capitalize">{invite.role}</td>
                          <td className="p-3">{new Date(invite.created_at).toLocaleDateString()}</td>
                          <td className="p-3">{invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : "—"}</td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              status.variant === "success" ? "bg-green-500/10 text-green-700" :
                              status.variant === "warning" ? "bg-amber-500/10 text-amber-700" :
                              "bg-destructive/10 text-destructive"
                            }`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {!invite.accepted_at && (
                                <Button size="sm" variant="outline" onClick={() => copyLink(invite.token)}>
                                  Copy Link
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!!invite.accepted_at}
                                onClick={() => {
                                  setInviteToRevoke(invite);
                                  setRevokeConfirmOpen(true);
                                }}
                              >
                                Revoke
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Bottom Sheet */}
        <AdminBottomSheet
          open={!!selectedInvite}
          onClose={() => setSelectedInvite(null)}
          title={selectedInvite?.email || "Invite Details"}
          subtitle={`${selectedInvite?.role.charAt(0).toUpperCase()}${selectedInvite?.role.slice(1)} Admin`}
          actions={
            selectedInvite && !selectedInvite.accepted_at && (
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    copyLink(selectedInvite.token);
                    setSelectedInvite(null);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invite Link
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => {
                    setInviteToRevoke(selectedInvite);
                    setRevokeConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Invite
                </Button>
              </div>
            )
          }
        >
          {selectedInvite && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`text-sm font-medium ${
                    getInviteStatus(selectedInvite).variant === "success" ? "text-green-700" :
                    getInviteStatus(selectedInvite).variant === "warning" ? "text-amber-700" :
                    "text-destructive"
                  }`}>
                    {getInviteStatus(selectedInvite).label}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{new Date(selectedInvite.created_at).toLocaleString()}</span>
                </div>
                {selectedInvite.expires_at && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <span className="text-sm">{new Date(selectedInvite.expires_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedInvite.accepted_at && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Accepted</span>
                    <span className="text-sm text-green-700">{new Date(selectedInvite.accepted_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedInvite.notes && (
                  <div className="py-2">
                    <span className="text-sm text-muted-foreground block mb-1">Notes</span>
                    <span className="text-sm">{selectedInvite.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </AdminBottomSheet>

        {/* Revoke confirmation dialog */}
        <AlertDialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Invite?</AlertDialogTitle>
              <AlertDialogDescription>
                This will invalidate the invite link for <strong>{inviteToRevoke?.email}</strong>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (inviteToRevoke) {
                    revoke(inviteToRevoke);
                  }
                  setRevokeConfirmOpen(false);
                  setInviteToRevoke(null);
                }}
              >
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
