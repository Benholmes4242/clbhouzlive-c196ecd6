import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Shield, Crown, Eye, PenLine, BarChart3, User, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessTeam, useBusinessInvites, useRemoveMember, useUpdateMemberRole, useRevokeInvite, BusinessMember, BusinessInvite } from '@/hooks/useBusinessTeam';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

const roleConfig = {
  owner: { label: 'Owner', icon: Crown, description: 'Full control over business', color: 'text-amber-600' },
  admin: { label: 'Admin', icon: Shield, description: 'Manage team and settings', color: 'text-blue-600' },
  editor: { label: 'Editor', icon: PenLine, description: 'Create and edit content', color: 'text-green-600' },
  analyst: { label: 'Analyst', icon: BarChart3, description: 'View insights only', color: 'text-purple-600' },
  member: { label: 'Member', icon: User, description: 'Basic access', color: 'text-muted-foreground' },
};

export default function BusinessTeamPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { data: membership } = useBusinessMembership(businessId);
  const { data: team, isLoading: teamLoading } = useBusinessTeam(businessId);
  const { data: invites } = useBusinessInvites(businessId);
  const removeMember = useRemoveMember(businessId || '');
  const updateRole = useUpdateMemberRole(businessId || '');
  const revokeInvite = useRevokeInvite(businessId || '');

  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; member: BusinessMember | null }>({ open: false, member: null });

  const isOwner = membership?.role === 'owner';
  const canManage = membership?.canManage;

  const pendingInvites = invites?.filter(i => i.status === 'pending') || [];

  const handleRemoveMember = async () => {
    if (!removeConfirm.member) return;
    await removeMember.mutateAsync(removeConfirm.member.user_profile_id);
    setRemoveConfirm({ open: false, member: null });
  };

  const handleRoleChange = async (member: BusinessMember, newRole: string) => {
    await updateRole.mutateAsync({ memberUserId: member.user_profile_id, newRole });
  };

  if (!businessId) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Team</h1>
            <p className="text-sm text-muted-foreground">{team?.length || 0} members</p>
          </div>
          {canManage && (
            <Button size="sm" onClick={() => navigate(`/business/${businessId}/team/invite`)}>
              <Plus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Team Members */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Team members</h2>
          <div className="bg-card rounded-sq-lg border border-border divide-y divide-border">
            {teamLoading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : team?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No team members</div>
            ) : (
              team?.map((member) => {
                const role = roleConfig[member.role] || roleConfig.member;
                const RoleIcon = role.icon;
                const profile = member.user_profile;

                return (
                  <div key={member.id} className="flex items-center gap-3 p-4">
                    <SquircleAvatar
                      src={profile?.profile_photo_url || undefined}
                      alt={profile?.display_name || 'Member'}
                      size={44}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile?.display_name || profile?.username || 'Unknown'}</p>
                      <div className="flex items-center gap-1.5 text-sm">
                        <RoleIcon className={`h-3.5 w-3.5 ${role.color}`} />
                        <span className="text-muted-foreground">{role.label}</span>
                      </div>
                    </div>

                    {isOwner && member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Change role</div>
                          {(['admin', 'editor', 'analyst', 'member'] as const).map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => handleRoleChange(member, r)}
                              disabled={member.role === r}
                            >
                              {roleConfig[r].label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setRemoveConfirm({ open: true, member })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Pending Invites */}
        {canManage && pendingInvites.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Pending invitations</h2>
            <div className="bg-card rounded-sq-lg border border-border divide-y divide-border">
              {pendingInvites.map((invite) => {
                const role = roleConfig[invite.role] || roleConfig.member;

                return (
                  <div key={invite.id} className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 rounded-sq-md bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{invite.invitee_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {role.label} · Invited {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeInvite.mutate(invite.id)}
                      disabled={revokeInvite.isPending}
                    >
                      Revoke
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Role Permissions */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Role permissions</h2>
          <div className="bg-card rounded-sq-lg border border-border divide-y divide-border">
            {Object.entries(roleConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center gap-3 p-4">
                  <div className={`h-9 w-9 rounded-sq-sm bg-muted flex items-center justify-center ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{config.label}</p>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Remove Confirmation */}
      <ConfirmModal
        isOpen={removeConfirm.open}
        onClose={() => setRemoveConfirm({ open: false, member: null })}
        onConfirm={handleRemoveMember}
        title="Remove team member"
        message={`Are you sure you want to remove ${removeConfirm.member?.user_profile?.display_name || 'this member'} from the team?`}
        confirmText="Remove"
        confirmVariant="destructive"
      />
    </div>
  );
}
