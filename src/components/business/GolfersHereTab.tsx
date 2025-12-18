import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useBusinessTeamMembers, TeamMember } from '@/hooks/useBusinessTeamMembers';
import { useBusinessClubMembers, ClubMember } from '@/hooks/useBusinessClubMembers';

interface GolfersHereTabProps {
  businessId: string;
  businessName?: string;
  businessLocation?: string;
}

type SubTab = 'members' | 'team';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  director: 'Director',
  admin: 'Admin',
  coach: 'Coach',
  staff: 'Staff',
};

export function GolfersHereTab({ businessId, businessName }: GolfersHereTabProps) {
  const navigate = useNavigate();
  const { data: teamMembers = [], isLoading: teamLoading } = useBusinessTeamMembers(businessId);
  const { data: clubMembers = [], isLoading: membersLoading } = useBusinessClubMembers(businessId);

  // Default to Members, but if Members is empty and Team exists, default to Team
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('members');

  useEffect(() => {
    if (!membersLoading && !teamLoading) {
      if (clubMembers.length === 0 && teamMembers.length > 0) {
        setActiveSubTab('team');
      }
    }
  }, [clubMembers.length, teamMembers.length, membersLoading, teamLoading]);

  const isLoading = activeSubTab === 'team' ? teamLoading : membersLoading;
  const currentCount = activeSubTab === 'team' ? teamMembers.length : clubMembers.length;

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div>
      {/* Sub-tabs: Members / Team - matches Activity/Tagged styling exactly */}
      <div className="flex justify-center border-b border-border/50 bg-white">
        <button
          onClick={() => setActiveSubTab('members')}
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            activeSubTab === 'members'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Members
          {activeSubTab === 'members' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('team')}
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            activeSubTab === 'team'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Team
          {activeSubTab === 'team' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Count header - consistent spacing with Activity */}
      <div className="py-3 px-4">
        <p className="text-sm text-muted-foreground">
          {activeSubTab === 'team' 
            ? `${currentCount} team member${currentCount !== 1 ? 's' : ''}`
            : `${currentCount} member${currentCount !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-3 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-3 rounded-sq-md animate-pulse bg-muted">
              <div className="w-16 h-16 rounded-full bg-muted-foreground/20 mb-2" />
              <div className="w-16 h-3 bg-muted-foreground/20 rounded mb-1" />
              <div className="w-12 h-2 bg-muted-foreground/20 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Team content */}
      {!isLoading && activeSubTab === 'team' && (
        teamMembers.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 px-4">
            {teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onClick={() => member.profile && handleProfileClick(member.profile.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Briefcase className="h-8 w-8 text-muted-foreground/60" />}
            title="No team members yet"
            description="This business hasn't added any team members."
          />
        )
      )}

      {/* Members content */}
      {!isLoading && activeSubTab === 'members' && (
        clubMembers.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 px-4">
            {clubMembers.map((member) => (
              <ClubMemberCard
                key={member.id}
                member={member}
                onClick={() => handleProfileClick(member.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground/60" />}
            title="No members yet"
            description={`Be the first to set ${businessName || 'this club'} as your home club.`}
          />
        )
      )}
    </div>
  );
}

// Team member card component
function TeamMemberCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  const profile = member.profile;
  if (!profile) return null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 rounded-sq-md bg-white border border-border/50 hover:border-border hover:shadow-sm transition-all text-center"
    >
      <SquircleAvatar
        src={profile.profile_photo_url}
        alt={profile.display_name || 'Team member'}
        size={64}
        className="mb-2"
      />
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
          {profile.display_name || profile.username || 'Unknown'}
        </span>
        {profile.is_verified_golfer && <VerifiedBadge size="sm" />}
      </div>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-sq-pill">
        {ROLE_LABELS[member.role] || member.role}
      </span>
    </button>
  );
}

// Club member card component
function ClubMemberCard({ member, onClick }: { member: ClubMember; onClick: () => void }) {
  const showHandicap = member.show_handicap !== false && member.eg_handicap_index != null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-3 rounded-sq-md bg-white border border-border/50 hover:border-border hover:shadow-sm transition-all text-center"
    >
      <SquircleAvatar
        src={member.profile_photo_url}
        alt={member.display_name || 'Member'}
        size={64}
        className="mb-2"
      />
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
          {member.display_name || member.username || 'Unknown'}
        </span>
        {member.is_verified_golfer && <VerifiedBadge size="sm" />}
      </div>
      {showHandicap && (
        <span className="text-xs text-muted-foreground">
          HCP {member.eg_handicap_index!.toFixed(1)}
        </span>
      )}
    </button>
  );
}

// Empty state component
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted">
        {icon}
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
        {description}
      </p>
    </div>
  );
}
