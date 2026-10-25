import { useParams, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessTeam, useBusinessInvites } from '@/hooks/useBusinessTeam';
import { AccessRequestsSection } from '@/components/business/AccessRequestsSection';
import { TeamSummary, TeamSubtitle } from '@/components/business/TeamSummary';
import { TeamListSection } from '@/components/business/TeamListSection';
import { TeamInvitesSection } from '@/components/business/TeamInvitesSection';
import { TeamRoleTable, TeamActivityCard } from '@/components/business/TeamRolesActivity';
import { useBusinessAccessRequests } from '@/hooks/useBusinessAccessRequests';
import { Button } from '@/components/ui/button';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTranslation } from 'react-i18next';

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
  const { user } = useSupabaseSession();
  const { t } = useTranslation('common');
  const currentUserId = user?.id;

  const canManage = !!membership?.canManage;
  const requestsQuery = useBusinessAccessRequests(businessId, canManage);

  if (!businessId) return null;

  return (
    <ManagePageShell
      title={t('business.team.sectionOne.title')}
      subtitle={business?.name ? <TeamSubtitle name={business.name} /> : undefined}
      right={canManage ? <Button variant="ghost" className="team-header-invite" onClick={() => navigate(`/business/${businessId}/team/invite`, { state: { fromTeam: true } })}><Plus size={16} strokeWidth={1.9} />{t('business.team.sectionOne.invite')}</Button> : undefined}
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

          {/* CB77: section three, invites (rules in teamInvites.ts). Draws nothing until invites load. */}
          <TeamInvitesSection
            businessId={businessId}
            businessName={business?.name || ''}
            team={team || []}
            invites={invitesQuery.isError ? undefined : invites}
            canManage={canManage}
            viewerId={currentUserId}
          />

          {/* CB78: section four, the role table and recent team activity (rules in teamFeed.ts). */}
          <TeamRoleTable businessName={business?.name || ''} viewerRole={membership?.role} />
          <TeamActivityCard businessId={businessId} businessName={business?.name || ''} canManage={canManage} viewerId={currentUserId} />
        </motion.div>
      </main>

    </ManagePageShell>
  );
}
