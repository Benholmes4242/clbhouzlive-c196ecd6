import { useParams, useNavigate } from 'react-router-dom';
import { Mail, AtSign, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import {
  useBusinessTeam, useBusinessInvites, useRevokeInvite, BUSINESS_ROLE_LABELS,
} from '@/hooks/useBusinessTeam';
import { AccessRequestsSection } from '@/components/business/AccessRequestsSection';
import { TeamSummary, TeamSubtitle } from '@/components/business/TeamSummary';
import { TeamListSection } from '@/components/business/TeamListSection';
import { useBusinessAccessRequests } from '@/hooks/useBusinessAccessRequests';
import { Button } from '@/components/ui/button';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTranslation } from 'react-i18next';
import { BIZ_KICKER, bizFigure } from '@/features/courses/components/holes/analytical/tokens';

/* NO PRIVATE PALETTE - see BusinessReviewsPage. Shared manage vocabulary,
   derived from the analytical `A` ramp. Declare a colour here and the next
   import-tracing audit cannot see this file. */
import { INK, INK_45, HAIR, CARD_BG, DANGER } from '@/components/manage/ui';

export default function BusinessTeamPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  useHideBottomNav();

  const membershipQuery = useBusinessMembership(businessId);
  const { data: membership } = membershipQuery;
  const { data: business } = useBusinessProfile(businessId);
  const { data: team, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useBusinessTeam(businessId);
  const invitesQuery = useBusinessInvites(businessId);
  const { data: invites } = invitesQuery;
  const revokeInvite = useRevokeInvite(businessId || '');
  const { user } = useSupabaseSession();
  const { t } = useTranslation('common');
  const currentUserId = user?.id;

  const canManage = !!membership?.canManage;
  const requestsQuery = useBusinessAccessRequests(businessId, canManage);
  const pendingInvites = (invites || []).filter((i) => i.status === 'pending');

  if (!businessId) return null;

  return (
    <ManagePageShell
      title={t('business.team.sectionOne.title')}
      subtitle={business?.name ? <TeamSubtitle name={business.name} /> : undefined}
      right={canManage ? <Button variant="ghost" className="team-header-invite" onClick={() => navigate(`/business/${businessId}/team/invite`)}><Plus size={16} strokeWidth={1.9} />{t('business.team.sectionOne.invite')}</Button> : undefined}
    >
      {/* CB75: shell owns the normal safe-area+32 bottom; no duplicate CTA clearance.
          Summary/card share one requests observer. Section-two contents stay unchanged. */}
      <main className="px-4 pb-0 max-w-lg mx-auto">
        <TeamSummary team={team || []} invites={invitesQuery.isError ? [] : invites || []}
          businessName={business?.name || ''} loading={teamLoading} failed={teamError}
          canManage={canManage} requestCount={requestsQuery.isError ? 0 : requestsQuery.data?.length || 0}
          waitingSettled={!membershipQuery.isPending && !invitesQuery.isPending && (!canManage || !requestsQuery.isPending)} />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <AccessRequestsSection
            businessId={businessId}
            businessName={business?.name || 'Business'}
            businessAvatarUrl={business?.logo_url}
            canManage={canManage}
            clubId={business?.club_id}
            requestsQuery={requestsQuery}
          />

          {/* CB76: section two, the team list (rules in teamList.ts). */}
          <TeamListSection
            businessId={businessId}
            businessName={business?.name || ''}
            team={team || []}
            viewerRole={membership?.role}
            viewerId={currentUserId}
            loading={teamLoading}
            failed={teamError}
            onRetry={() => { void refetchTeam(); }}
          />

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
                        userId={invite.invitee_user_id}
                        size={40}
                        hairlineRing
                        ringColor={DARK_HAIRLINE}
                      />
                    ) : (
                      <div
                        className="h-10 w-10 flex items-center justify-center"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
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
                        {new Date(invite.expires_at).getTime() < Date.now() ? 'Expired' : 'Pending'} · {BUSINESS_ROLE_LABELS[invite.role]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => revokeInvite.mutate(invite.id)}
                      disabled={revokeInvite.isPending}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-full active:opacity-70"
                      style={{
                        color: DANGER,
                        background: 'rgba(255,90,90,0.14)',
                        border: '1px solid rgba(255,90,90,0.28)',
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

    </ManagePageShell>
  );
}
