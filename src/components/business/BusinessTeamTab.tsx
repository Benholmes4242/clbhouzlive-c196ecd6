import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useBusinessTeam, type BusinessRole } from '@/hooks/useBusinessTeam';

const FRIENDLY_ROLE: Record<BusinessRole, string> = {
  owner: 'Owner',
  admin: 'Manager',
  editor: 'Editor',
  analyst: 'Analyst',
};

interface BusinessTeamTabProps {
  businessId: string;
}

/**
 * Public team tab — lists only members with is_public = true.
 * Parent should already have determined the list is non-empty before
 * exposing the Team tab, but we still guard here defensively.
 */
export const BusinessTeamTab: React.FC<BusinessTeamTabProps> = ({ businessId }) => {
  const navigate = useNavigate();
  const { data: members, isLoading } = useBusinessTeam(businessId);

  const publicMembers = (members ?? []).filter(m => m.is_public === true);

  if (isLoading) {
    return (
      <div className="px-1 pt-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-11 h-11 rounded-[34%] animate-pulse" style={{ background: 'rgba(15,23,42,0.06)' }} />
            <div className="flex-1">
              <div className="h-3.5 w-32 rounded animate-pulse mb-2" style={{ background: 'rgba(15,23,42,0.06)' }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'rgba(15,23,42,0.04)' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (publicMembers.length === 0) return null;

  return (
    <div className="px-1 pt-2 pb-6">
      {publicMembers.map((m) => {
        const name = m.user_profile?.display_name || m.user_profile?.username || 'Team member';
        const key = m.user_profile?.username || m.user_profile?.id || m.user_profile_id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => navigate(`/profile/${key}`)}
            className="flex items-center gap-3 w-full py-3 text-left active:opacity-70 transition-opacity"
          >
            <SquircleAvatar
              size={44}
              src={m.user_profile?.profile_photo_url || undefined}
              alt={name}
              fallback={name.charAt(0).toUpperCase()}
              hideRing
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-foreground truncate">{name}</p>
              <p className="text-xs text-muted-foreground">{FRIENDLY_ROLE[m.role]}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default BusinessTeamTab;
