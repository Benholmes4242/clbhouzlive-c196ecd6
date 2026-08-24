import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { A, Panel, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import { useBusinessTeam, type BusinessRole } from '@/hooks/useBusinessTeam';
import { analyticsEvents } from '@/utils/analyticsEvents';

const ROLE_KEY: Record<BusinessRole, string> = {
  owner: 'business.team.role.owner',
  admin: 'business.team.role.admin',
  editor: 'business.team.role.editor',
  analyst: 'business.team.role.analyst',
};

/** Owner first, then manager, editor, analyst. */
const ROLE_RANK: Record<BusinessRole, number> = {
  owner: 0,
  admin: 1,
  editor: 2,
  analyst: 3,
};

interface BusinessTeamTabProps {
  businessId: string;
}

/**
 * Public team tab - lists only members with is_public = true.
 * Parent should already have determined the list is non-empty before
 * exposing the Team tab, but we still guard here defensively.
 */
export const BusinessTeamTab: React.FC<BusinessTeamTabProps> = ({ businessId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: members, isLoading } = useBusinessTeam(businessId);

  const publicMembers = React.useMemo(() => {
    const rows = (members ?? []).filter(m => m.is_public === true);
    return rows.slice().sort((a, b) => {
      const rank = (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9);
      if (rank !== 0) return rank;
      const an = a.user_profile?.display_name || a.user_profile?.username || '';
      const bn = b.user_profile?.display_name || b.user_profile?.username || '';
      return an.localeCompare(bn);
    });
  }, [members]);

  if (isLoading) {
    return (
      <Panel kicker={t('business.team.kicker')}>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <Skeleton className="w-10 h-10 rounded-[34%]" />
            <div className="flex-1">
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </Panel>
    );
  }

  if (publicMembers.length === 0) return null;

  return (
    <Panel
      kicker={t('business.team.kicker')}
      aside={t('business.team.count', { count: publicMembers.length })}
    >
      {publicMembers.map((m) => {
        const name = m.user_profile?.display_name || m.user_profile?.username || t('business.team.member');
        const key = m.user_profile?.username || m.user_profile?.id || m.user_profile_id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              void analyticsEvents.track('business_team_member_tapped', {
                business_id: businessId,
                role: m.role,
              });
              navigate(`/profile/${key}`);
            }}
            className="flex items-center gap-3 w-full py-2.5 text-left active:opacity-70 transition-opacity"
          >
            <SquircleAvatar
              size={40}
              src={m.user_profile?.profile_photo_url || undefined}
              alt={name}
              fallback={name.charAt(0).toUpperCase()}
              hairlineRing
            />
            <div className="min-w-0 flex-1">
              <p
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: A.INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {name}
              </p>
              <p style={{ ...LABEL, marginTop: 3 }}>
                {m.job_title || t(ROLE_KEY[m.role])}
              </p>
            </div>
            <span
              aria-hidden="true"
              style={{ fontSize: 15, fontWeight: 700, color: A.DIM, flexShrink: 0 }}
            >
              {'\u203A'}
            </span>
          </button>
        );
      })}
    </Panel>
  );
};

export default BusinessTeamTab;
