import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users, MoreHorizontal, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  useBusinessTeam,
  useBusinessInvites,
  useRemoveMember,
  useUpdateMemberRole,
  useRevokeInvite,
  useSetMemberVisibility,
  BUSINESS_ROLE_LABELS,
  BusinessMember,
  BusinessRole,
  AssignableBusinessRole,
} from '@/hooks/useBusinessTeam';
import { AccessRequestsSection } from '@/components/business/AccessRequestsSection';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const ROLE_DESCRIPTIONS: Record<BusinessRole, string> = {
  owner: 'Full control, including verification and team access.',
  admin: 'Manage the business profile, posts, and team.',
  editor: 'Create and publish posts as the business.',
  analyst: 'View insights and analytics only.',
};

const ASSIGNABLE_ROLES: AssignableBusinessRole[] = ['admin', 'editor', 'analyst'];

const SectionEyebrow = ({ label, tone = 'amber' }: { label: string; tone?: 'amber' | 'slate' }) => {
  const color = tone === 'amber' ? '#F7931E' : '#475569';
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div style={{ width: 3, height: 8, background: color, borderRadius: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 900, color, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
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
  const setVisibility = useSetMemberVisibility(businessId || '');
  const { user } = useSupabaseSession();
  const currentUserId = user?.id;

  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; member: BusinessMember | null }>({
    open: false,
    member: null,
  });

  const canManage = !!membership?.canManage;

  const pendingInvites = (invites || []).filter((i) => i.status === 'pending');

  const grouped: Record<BusinessRole, BusinessMember[]> = {
    owner: [],
    admin: [],
    editor: [],
    analyst: [],
  };
  (team || []).forEach((m) => {
    if (grouped[m.role]) grouped[m.role].push(m);
  });

  const handleRemoveMember = async () => {
    if (!removeConfirm.member) return;
    try {
      await removeMember.mutateAsync(removeConfirm.member.user_profile_id);
    } catch {
      // toast handled in hook
    }
    setRemoveConfirm({ open: false, member: null });
  };

  const handleRoleChange = async (member: BusinessMember, newRole: AssignableBusinessRole) => {
    try {
      await updateRole.mutateAsync({ memberUserId: member.user_profile_id, newRole });
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (!businessId) return null;

  const MemberRow = ({ member, manageable }: { member: BusinessMember; manageable: boolean }) => {
    const profile = member.user_profile;
    const isSelf = !!currentUserId && member.user_profile_id === currentUserId;
    const canToggleVisibility = canManage || isSelf;
    const isPublic = member.is_public === true;
    return (
      <div className="flex items-center gap-3 py-3">
        <SquircleAvatar
          src={profile?.profile_photo_url || undefined}
          alt={profile?.display_name || 'Member'}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[15px] text-foreground truncate">
            {profile?.display_name || profile?.username || 'Unknown'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {profile?.username ? `@${profile.username}` : BUSINESS_ROLE_LABELS[member.role]}
          </p>
          {canToggleVisibility && (
            <div className="flex items-center gap-2 mt-2">
              <Switch
                checked={isPublic}
                disabled={setVisibility.isPending}
                onCheckedChange={async (next) => {
                  try {
                    await setVisibility.mutateAsync({
                      memberUserId: member.user_profile_id,
                      isPublic: next,
                    });
                  } catch {
                    // toast handled in hook
                  }
                }}
                aria-label="Show on public profile"
              />
              <span className="text-[11px] text-muted-foreground">
                {isPublic ? 'Shown on public profile' : 'Hidden from public profile'}
              </span>
            </div>
          )}
        </div>
        {manageable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Change role
              </div>
              {ASSIGNABLE_ROLES.map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => handleRoleChange(member, r)}
                  disabled={member.role === r}
                  className="text-sm"
                >
                  {BUSINESS_ROLE_LABELS[r]}
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

  const RoleGroup = ({ role, members }: { role: BusinessRole; members: BusinessMember[] }) => {
    if (role !== 'owner' && members.length === 0) return null;
    const labelPlural =
      role === 'owner' ? 'OWNER' : `${BUSINESS_ROLE_LABELS[role].toUpperCase()}S`;
    return (
      <section>
        <SectionEyebrow label={labelPlural} tone="slate" />
        <p className="text-xs text-muted-foreground mb-2">{ROLE_DESCRIPTIONS[role]}</p>
        <div className="[&>*+*]:border-t [&>*+*]:[border-top-color:rgba(15,23,42,0.07)]">
          {role === 'owner' && teamLoading && members.length === 0 ? (
            <div className="space-y-3 py-2">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : role === 'owner' && members.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">No owner</div>
          ) : (
            members.map((m) => (
              <MemberRow key={m.id} member={m} manageable={canManage && role !== 'owner'} />
            ))
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background md:max-w-[620px] md:mx-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-xl"
        style={{
          background: 'rgba(248,250,252,0.97)',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
        }}
      >
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-foreground active:scale-[0.97] transition-transform"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <SectionEyebrow label="TEAM" />
            <h1 className="text-[18px] text-foreground leading-none" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>
              Manage team
            </h1>
          </div>
          {canManage ? (
            <button
              onClick={() => navigate(`/business/${businessId}/team/invite`)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white active:scale-[0.97] transition-transform"
              style={{ background: '#F7931E' }}
              aria-label="Invite teammate"
            >
              <Plus className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-11" />
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <AccessRequestsSection
          businessId={businessId}
          businessName={business?.name || 'Business'}
          businessAvatarUrl={business?.logo_url}
          canManage={canManage}
        />

        <RoleGroup role="owner" members={grouped.owner} />
        <RoleGroup role="admin" members={grouped.admin} />
        <RoleGroup role="editor" members={grouped.editor} />
        <RoleGroup role="analyst" members={grouped.analyst} />

        {canManage && pendingInvites.length > 0 && (
          <section>
            <SectionEyebrow label="PENDING" tone="slate" />
            <div className="[&>*+*]:border-t [&>*+*]:[border-top-color:rgba(15,23,42,0.07)]">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center gap-3 py-3">
                  <div
                    className="h-11 w-11 rounded-sq-md flex items-center justify-center"
                    style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
                  >
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[15px] truncate">{invite.invitee_email}</p>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          background: 'rgba(234,179,8,0.10)',
                          color: '#CA8A04',
                          border: '1px solid rgba(234,179,8,0.25)',
                        }}
                      >
                        {BUSINESS_ROLE_LABELS[invite.role]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Invitation pending</p>
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
              ))}
            </div>
          </section>
        )}

        {canManage && (
          <Button
            className="w-full text-white border-0"
            style={{ background: '#F7931E' }}
            onClick={() => navigate(`/business/${businessId}/team/invite`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite teammate
          </Button>
        )}
      </div>

      <ConfirmModal
        isOpen={removeConfirm.open}
        onClose={() => setRemoveConfirm({ open: false, member: null })}
        onConfirm={handleRemoveMember}
        title="Remove team member"
        message={`Remove ${removeConfirm.member?.user_profile?.display_name || 'this member'} from the team? They will lose access to this business.`}
        confirmText="Remove"
        confirmVariant="destructive"
      />
    </div>
  );
}
