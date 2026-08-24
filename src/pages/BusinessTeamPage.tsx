import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Crown, Shield, Edit3, BarChart3, MoreHorizontal, Trash2,
  Eye, EyeOff, Mail, AtSign, UserPlus, Plus, Pencil, ChevronRight,
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
import { useTranslation } from 'react-i18next';
import {
  A, BIZ_KICKER, BIZ_LABEL, BIZ_BODY, bizFigure,
} from '@/features/courses/components/holes/analytical/tokens';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const CARD_BG = '#FFFFFF';

const ASSIGNABLE_ROLES: AssignableBusinessRole[] = ['admin', 'editor', 'analyst'];

const ROLE_ICON: Record<BusinessRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Edit3,
  analyst: BarChart3,
};

/**
 * The role is a LABEL, not a pill. The ROLE_ICON glyph stays as a category
 * marker; the tinted capsule and the eleventh amber-deep variant
 * are gone. Vocabulary is unchanged.
 */
function RoleLabel({ role }: { role: BusinessRole }) {
  const Icon = ROLE_ICON[role];
  return (
    <span className="inline-flex items-center gap-1" style={{ ...BIZ_LABEL, fontSize: 7.5 }}>
      <Icon size={9} strokeWidth={2.5} />
      {BUSINESS_ROLE_LABELS[role]}
    </span>
  );
}

const JOB_TITLE_MAX = 40;

function JobTitleField({
  initialTitle,
  onSave,
  addLabel,
  addAria,
  editAria,
}: {
  initialTitle: string;
  onSave: (next: string) => Promise<void>;
  addLabel: string;
  addAria: string;
  editAria: string;
}) {
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedTitle(initialTitle);
    if (!editing) setValue(initialTitle);
  }, [initialTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const beginEdit = () => {
    setValue(savedTitle);
    setEditing(true);
  };

  const commit = async () => {
    const next = value.trim().slice(0, JOB_TITLE_MAX);
    setEditing(false);
    if (next === savedTitle) {
      setValue(savedTitle);
      return;
    }
    const prev = savedTitle;
    setSavedTitle(next);
    setSaving(true);
    try {
      await onSave(next);
    } catch {
      setSavedTitle(prev);
      setValue(prev);
    } finally {
      setSaving(false);
    }
  };

  const handleFocus = () => {
    setTimeout(() => {
      wrapRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 250);
  };

  if (!editing) {
    // HAS A TITLE -> the title as text with a pencil. Tapping opens the input.
    if (savedTitle) {
      return (
        <button
          type="button"
          onClick={beginEdit}
          className="inline-flex items-center gap-1.5 text-left active:opacity-70"
          style={{ minHeight: 20, background: 'transparent', border: 0, padding: 0 }}
          aria-label={editAria}
        >
          <span style={{ ...BIZ_BODY, fontWeight: 600, color: A.INK, lineHeight: 1.2 }}>
            {savedTitle}
          </span>
          <Pencil size={11.5} color={A.DIM} strokeWidth={2.25} />
        </button>
      );
    }
    // NO TITLE -> a quiet text action. A list row is not a form: no bordered
    // box, no briefcase, no placeholder sitting in a members list.
    return (
      <button
        type="button"
        onClick={beginEdit}
        className="inline-flex items-center gap-1 text-left active:opacity-70"
        style={{ minHeight: 20, background: 'transparent', border: 0, padding: 0 }}
        aria-label={addAria}
      >
        <span style={{ ...BIZ_LABEL, fontSize: 7.5 }}>{addLabel}</span>
        <ChevronRight size={9} color={A.DIM} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="flex items-center gap-2"
      style={{
        background: '#F8FAFC',
        border: `1.5px solid ${A.INK}`,
        borderRadius: 10,
        padding: '9px 11px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        maxLength={JOB_TITLE_MAX}
        placeholder={addLabel}
        onChange={(e) => setValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => { if (editing) void commit(); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          if (e.key === 'Escape') { setValue(savedTitle); setEditing(false); }
        }}
        disabled={saving && !editing}
        className="flex-1 min-w-0 bg-transparent outline-none"
        style={{
          fontSize: 13,
          color: value ? A.INK : A.DIM,
          fontWeight: value ? 600 : 400,
        }}
      />
      <span className="tabular-nums" style={{ fontSize: 11, color: A.DIM, flexShrink: 0 }}>
        {value.length}/{JOB_TITLE_MAX}
      </span>
    </div>
  );
}

export default function BusinessTeamPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  useHideBottomNav();

  const { data: membership } = useBusinessMembership(businessId);
  const { data: business } = useBusinessProfile(businessId);
  const { data: team, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useBusinessTeam(businessId);
  const { data: invites } = useBusinessInvites(businessId);
  const removeMember = useRemoveMember(businessId || '');
  const updateRole = useUpdateMemberRole(businessId || '');
  const revokeInvite = useRevokeInvite(businessId || '');
  const setVisibility = useSetMemberVisibility(businessId || '');
  const setJobTitle = useSetMemberJobTitle(businessId || '');
  const { user } = useSupabaseSession();
  const { t } = useTranslation('common');
  const currentUserId = user?.id;

  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; member: BusinessMember | null }>({
    open: false, member: null,
  });

  const canManage = !!membership?.canManage;
  const pendingInvites = (invites || []).filter((i) => i.status === 'pending');

  const handleRemoveMember = async () => {
    if (!removeConfirm.member) return;
    try { await removeMember.mutateAsync(removeConfirm.member.user_profile_id); } catch { /* toast fired inside mutation */ }
    setRemoveConfirm({ open: false, member: null });
  };

  if (!businessId) return null;

  const MemberRow = ({ m }: { m: BusinessMember }) => {
    const profile = m.user_profile;
    const isOwner = m.role === 'owner';
    const isSelf = !!currentUserId && m.user_profile_id === currentUserId;
    const canToggleVisibility = canManage || isSelf;
    const canRowManage = canManage && !isOwner;
    const canEditTitle = canManage || isSelf;
    const isPublic = m.is_public === true;
    const name = profile?.display_name || profile?.username || t('business.team.member');
    const title = m.job_title?.trim() || '';

    return (
      /* items-START: the avatar belongs beside the NAME, not the job title. */
      <div className="flex items-start gap-3" style={{ padding: '13px 0' }}>
        <SquircleAvatar
          src={profile?.profile_photo_url || undefined}
          alt={name}
          size={44}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />

        {/* LEFT COLUMN - identity only */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="truncate"
              style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK }}
            >
              {name}
            </p>
            <RoleLabel role={m.role} />
          </div>
          {profile?.username && (
            <p className="truncate" style={{ fontSize: 11.5, fontWeight: 400, color: A.DIM }}>
              @{profile.username}
            </p>
          )}
          {/* ONE job title slot, fixed min-height so rows stay aligned. */}
          <div style={{ minHeight: 20, marginTop: 3 }}>
            {canEditTitle ? (
              <JobTitleField
                initialTitle={title}
                addLabel={t('business.team.manage.addJobTitle')}
                addAria={t('business.team.manage.addJobTitleAria')}
                editAria={t('business.team.manage.editJobTitleAria')}
                onSave={async (next) => {
                  await setJobTitle.mutateAsync({
                    memberUserId: m.user_profile_id,
                    jobTitle: next,
                  });
                }}
              />
            ) : title ? (
              <p className="truncate" style={{ ...BIZ_BODY, color: A.INK, lineHeight: 1.2 }}>
                {title}
              </p>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN - the controls. Same gates, same handlers. */}
        {(canRowManage || canToggleVisibility) && (
          <div className="flex flex-col items-end shrink-0" style={{ gap: 4 }}>
            {canRowManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="h-8 w-8 flex items-center justify-center rounded-full active:bg-black/[0.04]"
                    aria-label="Member actions"
                  >
                    <MoreHorizontal size={16} color={A.MUTE} />
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
            {canToggleVisibility && (
              /* Visibility is a STATUS: no colour. The glyph, the handler and
                 the full aria-label are unchanged. */
              <button
                type="button"
                onClick={async () => {
                  try {
                    await setVisibility.mutateAsync({
                      memberUserId: m.user_profile_id,
                      isPublic: !isPublic,
                    });
                  } catch { /* toast fired inside mutation */ }
                }}
                disabled={setVisibility.isPending}
                className="inline-flex items-center gap-1 active:opacity-70"
                style={{
                  ...BIZ_LABEL,
                  fontSize: 7.5,
                  color: isPublic ? A.MUTE : A.DIM,
                  minHeight: 20,
                  paddingRight: canRowManage ? 8 : 0,
                }}
                aria-label={isPublic ? 'Hide from public profile' : 'Show on public profile'}
              >
                {isPublic ? <Eye size={11} strokeWidth={2.25} /> : <EyeOff size={11} strokeWidth={2.25} />}
                {isPublic ? t('business.team.manage.public') : t('business.team.manage.hidden')}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <ManagePageShell title="Manage team">
      <main className="px-4 pt-4 pb-22 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-4" style={BIZ_BODY}>
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
              <span style={BIZ_KICKER}>{t('business.team.manage.members')}</span>
              <span style={bizFigure(15)}>{(team || []).length}</span>
            </div>
            {/* No rule between member rows: separation is whitespace. */}
            <div>
              {teamLoading ? (
                [0, 1, 2].map(i => (
                  <div key={i} className="flex items-start gap-3" style={{ padding: '13px 0' }}>
                    <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : teamError ? (
                <div className="py-6 text-center">
                  <div className="text-[13px] font-semibold" style={{ color: INK }}>
                    Couldn't load your team
                  </div>
                  <p className="text-[12px] mt-1" style={{ color: INK_45 }}>
                    Check your connection and try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchTeam()}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12.5px] active:opacity-90"
                    style={{ background: A.INK, color: A.CANVAS, border: 'none', fontSize: 12.5, fontWeight: 700 }}
                  >
                    Retry
                  </button>
                </div>
              ) : (team || []).length === 0 ? (
                <div className="py-6 text-center text-[13px]" style={{ color: INK_45 }}>
                  No members yet.
                </div>
              ) : (
                (team || []).map(m => (
                  <MemberRow key={m.id} m={m} />
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
                <span style={BIZ_KICKER}>{t('business.team.manage.pendingInvites')}</span>
                <span style={bizFigure(15)}>{pendingInvites.length}</span>
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
                minHeight: 50,
                borderRadius: 999,
                background: INK,
                color: '#FFFFFF',
                fontSize: 14.5,
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
    </ManagePageShell>
  );
}
