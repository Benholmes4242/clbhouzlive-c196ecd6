import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessTeam, useBusinessInvites, useRemoveMember, useUpdateMemberRole, useRevokeInvite, BusinessMember, BusinessInvite } from '@/hooks/useBusinessTeam';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { AccessRequestsSection } from '@/components/business/AccessRequestsSection';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

type RoleKey = 'owner' | 'admin' | 'member';

const roleConfig: Record<RoleKey, { label: string; description: string }> = {
  owner: { label: 'Owner', description: 'Full control of this business' },
  admin: { label: 'Admin', description: 'Can manage the business profile and post' },
  member: { label: 'Member', description: 'Can post as the business' },
};

export default function BusinessTeamPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  useHideBottomNav();
  useHideHeader();
  const { data: membership } = useBusinessMembership(businessId);
  const { data: business } = useBusinessProfile(businessId);
  const { data: team, isLoading: teamLoading } = useBusinessTeam(businessId);
  const { data: invites } = useBusinessInvites(businessId);
  const removeMember = useRemoveMember(businessId || '');
  const updateRole = useUpdateMemberRole(businessId || '');
  const revokeInvite = useRevokeInvite(businessId || '');

  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; member: BusinessMember | null }>({ open: false, member: null });

  const isOwner = membership?.role === 'owner';
  const canManage = membership?.canManage;

  const pendingInvites = invites?.filter(i => i.status === 'pending') || [];

  // Group team by role
  const owners = team?.filter(m => m.role === 'owner') || [];
  const admins = team?.filter(m => m.role === 'admin') || [];
  const members = team?.filter(m => m.role === 'member') || [];

  const handleRemoveMember = async () => {
    if (!removeConfirm.member) return;
    try {
      await removeMember.mutateAsync(removeConfirm.member.user_profile_id);
    } catch {
      toast.error('Failed to remove member');
    }
    setRemoveConfirm({ open: false, member: null });
  };

  const handleRoleChange = async (member: BusinessMember, newRole: string) => {
    try {
      await updateRole.mutateAsync({ memberUserId: member.user_profile_id, newRole });
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (!businessId) return null;

  const MemberRow = ({ member, showActions = false }: { member: BusinessMember; showActions?: boolean }) => {
    const profile = member.user_profile;
    const role = roleConfig[member.role as RoleKey] || roleConfig.member;

    return (
      <div className="flex items-center gap-3 py-3">
        <SquircleAvatar
          src={profile?.profile_photo_url || undefined}
          alt={profile?.display_name || 'Member'}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[15px] text-foreground truncate">{profile?.display_name || profile?.username || 'Unknown'}</p>
          <p className="text-sm text-muted-foreground">{role.label}</p>
        </div>

        {showActions && isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Change role</div>
              {(['admin', 'member'] as const).map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => handleRoleChange(member, r)}
                  disabled={member.role === r}
                  className="text-sm"
                >
                  {roleConfig[r].label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive text-sm"
                onClick={() => setRemoveConfirm({ open: true, member })}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}>
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-foreground active:scale-[0.97] transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[16px] font-semibold text-foreground">Team & Access</h1>
          </div>
          <div className="w-11" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Access Requests Section */}
        <AccessRequestsSection 
          businessId={businessId} 
          businessName={business?.name || 'Business'} 
          businessAvatarUrl={business?.logo_url}
          canManage={canManage || false} 
        />
        {/* Owners Section */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Owner</h2>
          <div className="divide-y divide-border">
            {teamLoading ? (
              <div className="space-y-3 py-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded-lg w-1/2" />
                      <div className="h-3 bg-muted animate-pulse rounded-lg w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : owners.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground text-sm">No owner</div>
            ) : (
              owners.map((member) => (
                <MemberRow key={member.id} member={member} showActions={false} />
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">The owner has full control of this business, including verification and team access.</p>
        </section>

        {/* Admins Section */}
        {admins.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Admins</h2>
            <div className="divide-y divide-border">
              {admins.map((member) => (
                <MemberRow key={member.id} member={member} showActions={true} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Admins can manage the business profile and post on behalf of the business.</p>
          </section>
        )}

        {/* Members Section */}
        {members.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Members</h2>
            <div className="divide-y divide-border">
              {members.map((member) => (
                <MemberRow key={member.id} member={member} showActions={true} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Members can post as the business but can't manage settings or team access.</p>
          </section>
        )}

        {/* Pending Invites */}
        {canManage && pendingInvites.length > 0 && (
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Pending</h2>
            <div className="divide-y divide-border">
              {pendingInvites.map((invite) => {
                const role = roleConfig[invite.role as RoleKey] || roleConfig.member;

                return (
                  <div key={invite.id} className="flex items-center gap-3 py-3">
                    <div className="h-11 w-11 rounded-sq-md bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[15px] truncate">{invite.invitee_email}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)]">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {role.label}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          className="text-destructive text-sm"
                          onClick={() => revokeInvite.mutate(invite.id)}
                          disabled={revokeInvite.isPending}
                        >
                          Revoke invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Invitation sent. They'll appear here once accepted.</p>
          </section>
        )}

        {/* Invite CTA */}
        {canManage && (
          <Button 
            className="w-full" 
            onClick={() => navigate(`/business/${businessId}/team/invite`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite teammate
          </Button>
        )}
      </div>

      {/* Remove Confirmation */}
      <ConfirmModal
        isOpen={removeConfirm.open}
        onClose={() => setRemoveConfirm({ open: false, member: null })}
        onConfirm={handleRemoveMember}
        title="Remove team member"
        message={`Are you sure you want to remove ${removeConfirm.member?.user_profile?.display_name || 'this member'} from the team? They will lose access to this business.`}
        confirmText="Remove"
        confirmVariant="destructive"
      />
    </div>
  );
}
