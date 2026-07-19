import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Crown, Shield, Edit3, BarChart3, MoreHorizontal, Trash2,
  Eye, EyeOff, Mail, AtSign, UserPlus, Plus, Briefcase, Pencil,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  useBusinessTeam, useBusinessInvites, useRemoveMember, useUpdateMemberRole,
  useRevokeInvite, useSetMemberVisibility, useSetMemberJobTitle,
  BUSINESS_ROLE_LABELS, BusinessMember, BusinessRole, AssignableBusinessRole,
} from '@/hooks/useBusinessTeam';
import { AccessRequestsSection } from '@/components/business/AccessRequestsSection';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_SOFT = 'rgba(247,147,30,0.10)';
const CARD_BG = '#FFFFFF';

const ASSIGNABLE_ROLES: AssignableBusinessRole[] = ['admin', 'editor', 'analyst'];

const ROLE_ICON: Record<BusinessRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Edit3,
  analyst: BarChart3,
};

function RoleChip({ role }: { role: BusinessRole }) {
  const Icon = ROLE_ICON[role];
  const isOwner = role === 'owner';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        background: isOwner ? AMBER_SOFT : 'rgba(15,23,42,0.05)',
        color: isOwner ? '#B4650C' : INK_45,
        border: `1px solid ${isOwner ? 'rgba(247,147,30,0.22)' : HAIR}`,
      }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {BUSINESS_ROLE_LABELS[role]}
    </span>
  );
}

export default function BusinessTeamPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  useHideBottomNav();

  const { data: membership } = useBusinessMembership(businessId);
  const { data: business } = useBusinessProfile(businessId);
  const { data: team, isLoading: teamLoading } = useBusinessTeam(businessId);
  const { data: invites } = useBusinessInvites(businessId);
  const removeMember = useRemoveMember(businessId || '');
  const updateRole = useUpdateMemberRole(businessId || '');
  const revokeInvite = useRevokeInvite(businessId || '');
  const setVisibility = useSetMemberVisibility(businessId || '');
  const setJobTitle = useSetMemberJobTitle(businessId || '');
  const { user } = useSupabaseSession();
  const currentUserId = user?.id;

  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; member: BusinessMember | null }>({
    open: false, member: null,
  });

  const canManage = !!membership?.canManage;
  const pendingInvites = (invites || []).filter((i) => i.status === 'pending');

  const handleRemoveMember = async () => {
    if (!removeConfirm.member) return;
    try { await removeMember.mutateAsync(removeConfirm.member.user_profile_id); } catch {}
    setRemoveConfirm({ open: false, member: null });
  };

  if (!businessId) return null;

  const MemberRow = ({ m }: { m: BusinessMember }) => {
    const profile = m.user_profile;
    const isOwner = m.role === 'owner';
    const isSelf = !!currentUserId && m.user_profile_id === currentUserId;
    const canToggleVisibility = canManage || isSelf;
    const canRowManage = canManage && !isOwner;
    const isPublic = m.is_public === true;
    const name = profile?.display_name || profile?.username || 'Team member';

    return (
      <div className="flex items-center gap-3 py-3">
        <SquircleAvatar
          src={profile?.profile_photo_url || undefined}
          alt={name}
          size={44}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[15px] truncate" style={{ color: INK }}>{name}</p>
            <RoleChip role={m.role} />
          </div>
          {profile?.username && (
            <p className="text-[12px] truncate" style={{ color: INK_45 }}>@{profile.username}</p>
          )}
          {(() => {
            const canEditTitle = canManage || isSelf;
            const title = m.job_title?.trim() || '';
            const label = title || 'Add job title';
            const color = title ? INK : INK_45;
            const weight = title ? 600 : 500;
            if (canEditTitle) {
              return (
                <button
                  type="button"
                  onClick={() => setTitleSheet({ open: true, member: m })}
                  className="mt-0.5 block text-left active:opacity-70"
                  style={{ fontSize: 12.5, color, fontWeight: weight, background: 'transparent', border: 0, padding: 0 }}
                >
                  {label}
                </button>
              );
            }
            return title ? (
              <p className="mt-0.5 truncate" style={{ fontSize: 12.5, color: INK, fontWeight: 600 }}>{title}</p>
            ) : null;
          })()}
          {canToggleVisibility && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await setVisibility.mutateAsync({
                    memberUserId: m.user_profile_id,
                    isPublic: !isPublic,
                  });
                } catch {}
              }}
              disabled={setVisibility.isPending}
              className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] active:opacity-70"
              style={{ color: isPublic ? '#059669' : INK_45 }}
              aria-label={isPublic ? 'Hide from public profile' : 'Show on public profile'}
            >
              {isPublic ? <Eye size={12} strokeWidth={2.25} /> : <EyeOff size={12} strokeWidth={2.25} />}
              {isPublic ? 'Shown on public profile' : 'Hidden from public profile'}
            </button>
          )}
        </div>
        {canRowManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-full active:bg-black/[0.04]"
                aria-label="Member actions"
              >
                <MoreHorizontal size={16} color={INK_45} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: INK_45 }}>
                Change role
              </div>
              {ASSIGNABLE_ROLES.map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => updateRole.mutate({ memberUserId: m.user_profile_id, newRole: r })}
                  disabled={m.role === r}
                  className="text-sm"
                >
                  {BUSINESS_ROLE_LABELS[r]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive text-sm"
                onClick={() => setRemoveConfirm({ open: true, member: m })}
              >
                <Trash2 size={14} className="mr-2" />
                Remove access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <ManagePageShell title="Manage team">
      <main className="px-4 pt-4 pb-22 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: INK_45 }}>
            Invite people to help manage this business. Public members appear on your profile's Team tab.
          </p>

          <AccessRequestsSection
            businessId={businessId}
            businessName={business?.name || 'Business'}
            businessAvatarUrl={business?.logo_url}
            canManage={canManage}
          />

          {/* MEMBERS */}
          <div
            className="mb-6"
            style={{
              background: CARD_BG,
              border: `1px solid ${HAIR}`,
              borderRadius: 14,
              padding: '4px 16px',
            }}
          >
            <div className="pt-3 pb-1 flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{ color: INK_45 }}>
                Members
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: INK_45 }}>
                {(team || []).length}
              </span>
            </div>
            <div className="[&>*+*]:border-t" style={{ ['--tw-border-opacity' as any]: 1 }}>
              {teamLoading ? (
                [0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : (team || []).length === 0 ? (
                <div className="py-6 text-center text-[13px]" style={{ color: INK_45 }}>
                  No members yet.
                </div>
              ) : (
                (team || []).map(m => (
                  <div key={m.id} style={{ borderTopColor: HAIR }}>
                    <MemberRow m={m} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PENDING INVITES */}
          {canManage && pendingInvites.length > 0 && (
            <div
              className="mb-6"
              style={{
                background: CARD_BG,
                border: `1px solid ${HAIR}`,
                borderRadius: 14,
                padding: '4px 16px',
              }}
            >
              <div className="pt-3 pb-1 flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.08em]" style={{ color: INK_45 }}>
                  Pending invites
                </span>
                <span className="text-[11px] tabular-nums" style={{ color: INK_45 }}>
                  {pendingInvites.length}
                </span>
              </div>
              {pendingInvites.map((invite) => {
                const label = invite.invitee_profile?.username
                  ? `@${invite.invitee_profile.username}`
                  : invite.invitee_email || 'Invited user';
                const isUser = !!invite.invitee_user_id;
                return (
                  <div key={invite.id} className="flex items-center gap-3 py-3" style={{ borderTop: `1px solid ${HAIR}` }}>
                    {isUser && invite.invitee_profile ? (
                      <SquircleAvatar
                        src={invite.invitee_profile.profile_photo_url || undefined}
                        alt={label}
                        size={40}
                        hairlineRing
                        ringColor={LIGHT_HAIRLINE}
                      />
                    ) : (
                      <div
                        className="h-10 w-10 flex items-center justify-center"
                        style={{
                          background: 'rgba(15,23,42,0.05)',
                          border: `1px solid ${HAIR}`,
                          borderRadius: 12,
                        }}
                      >
                        {isUser ? <AtSign size={16} color={INK_45} /> : <Mail size={16} color={INK_45} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] truncate" style={{ color: INK }}>
                        {label}
                      </p>
                      <p className="text-[11.5px]" style={{ color: INK_45 }}>
                        Pending · {BUSINESS_ROLE_LABELS[invite.role]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => revokeInvite.mutate(invite.id)}
                      disabled={revokeInvite.isPending}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-full active:opacity-70"
                      style={{
                        color: '#DC2626',
                        background: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.18)',
                      }}
                    >
                      Revoke
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>

      {/* Sticky CTA */}
      {canManage && (
        <div
          className="fixed left-0 right-0 pointer-events-none"
          style={{ bottom: 0, zIndex: 40 }}
        >
          <div
            className="pointer-events-auto md:max-w-[440px] md:mx-auto px-4"
            style={{
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
              paddingTop: 12,
              background: 'linear-gradient(to top, #F8FAFC 60%, rgba(248,250,252,0))',
            }}
          >
            <button
              type="button"
              onClick={() => navigate(`/business/${businessId}/team/invite`)}
              className="w-full flex items-center justify-center gap-2 active:opacity-90"
              style={{
                minHeight: 52,
                borderRadius: 14,
                background: INK,
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                border: 'none',
              }}
            >
              <UserPlus size={18} strokeWidth={2.25} />
              Invite teammate
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={removeConfirm.open}
        onClose={() => setRemoveConfirm({ open: false, member: null })}
        onConfirm={handleRemoveMember}
        title="Remove team member"
        message={`Remove ${removeConfirm.member?.user_profile?.display_name || 'this member'} from the team? They will lose access to this business.`}
        confirmText="Remove"
        confirmVariant="destructive"
      />

      {titleSheet.member && businessId && (
        <JobTitleSheet
          open={titleSheet.open}
          onClose={() => setTitleSheet({ open: false, member: null })}
          businessId={businessId}
          memberUserId={titleSheet.member.user_profile_id}
          currentTitle={titleSheet.member.job_title ?? null}
        />
      )}
    </ManagePageShell>
  );
}
