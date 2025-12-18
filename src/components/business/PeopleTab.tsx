import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useBusinessTeamMembers, TeamMember } from '@/hooks/useBusinessTeamMembers';
import { useBusinessClubMembers, ClubMember } from '@/hooks/useBusinessClubMembers';
import { ManageTeamModal } from './ManageTeamModal';
import { 
  isMockBusiness, 
  getMockTeamMembers, 
  getMockClubMembers 
} from '@/lib/mockPeopleData';

interface PeopleTabProps {
  businessId: string;
  businessName?: string;
  businessLocation?: string;
  category?: string | null;
  canManage?: boolean;
  isOwner?: boolean;
}

type SubTab = 'members' | 'team';

export function PeopleTab({ 
  businessId, 
  businessName, 
  category,
  canManage = false,
  isOwner = false
}: PeopleTabProps) {
  const navigate = useNavigate();
  const isMockMode = isMockBusiness(businessId);
  const isGolfClub = category === 'Golf Club';
  const [manageModalOpen, setManageModalOpen] = useState(false);
  
  const { data: realTeamMembers = [], isLoading: teamLoading } = useBusinessTeamMembers(businessId);
  const { data: realClubMembers = [], isLoading: membersLoading } = useBusinessClubMembers(businessId);

  // Use mock data when in mock mode
  const teamMembers = useMemo(() => 
    isMockMode ? getMockTeamMembers() as TeamMember[] : realTeamMembers, 
    [isMockMode, realTeamMembers]
  );
  const clubMembers = useMemo(() => 
    isMockMode ? getMockClubMembers() as ClubMember[] : realClubMembers, 
    [isMockMode, realClubMembers]
  );

  // In mock mode, allow Members tab even if not Golf Club (for testing)
  const showMembersTab = isGolfClub || isMockMode;

  // Default to Members for golf clubs (or mock mode), Team for others
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(showMembersTab ? 'members' : 'team');

  useEffect(() => {
    // For golf clubs: if Members is empty and Team exists, default to Team
    if (showMembersTab && !membersLoading && !teamLoading && !isMockMode) {
      if (clubMembers.length === 0 && teamMembers.length > 0) {
        setActiveSubTab('team');
      }
    }
  }, [showMembersTab, clubMembers.length, teamMembers.length, membersLoading, teamLoading, isMockMode]);

  // Loading state - skip if in mock mode
  const isLoading = isMockMode ? false : (activeSubTab === 'team' ? teamLoading : membersLoading);
  const currentCount = activeSubTab === 'team' ? teamMembers.length : clubMembers.length;

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Count label text
  const getCountLabel = () => {
    if (isLoading) return '';
    if (showMembersTab) {
      const membersCount = clubMembers.length;
      const teamCount = teamMembers.length;
      if (membersCount > 0 && teamCount > 0) {
        return `${membersCount} member${membersCount !== 1 ? 's' : ''} · ${teamCount} team`;
      }
    }
    if (activeSubTab === 'team') {
      return `${currentCount} team member${currentCount !== 1 ? 's' : ''}`;
    }
    return `${currentCount} member${currentCount !== 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-white">
      {/* Mock mode indicator */}
      {isMockMode && (
        <div className="mx-4 mt-4 flex items-center gap-2 px-3 py-2 rounded-sq-sm bg-amber-50 border border-amber-200 text-amber-800">
          <Info className="h-4 w-4 shrink-0" />
          <span className="text-xs">Sample data for layout testing</span>
        </div>
      )}

      {/* Header row - NO Manage button here (access via Business Profiles page or 3-dot) */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-lg font-semibold text-foreground text-center">People</h2>
        {!isLoading && (currentCount > 0 || (showMembersTab && (clubMembers.length > 0 || teamMembers.length > 0))) && (
          <p className="text-sm text-muted-foreground mt-0.5 text-center">
            {getCountLabel()}
          </p>
        )}
      </div>

      {/* Sub-tabs: Members / Team - Activity-style underline tabs */}
      {showMembersTab ? (
        <div className="border-b border-border/50">
          <div className="flex px-4">
            <button
              onClick={() => setActiveSubTab('members')}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeSubTab === 'members'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Members
              {activeSubTab === 'members' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('team')}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeSubTab === 'team'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Team
              {activeSubTab === 'team' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          </div>
        </div>
      ) : (
        // For non-Golf Clubs, show a subtle divider
        <div className="border-b border-border/50" />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center p-4 rounded-sq-lg animate-pulse bg-muted/30 border border-border/30">
              <div className="w-16 h-16 rounded-full bg-muted-foreground/10 mb-3" />
              <div className="w-20 h-4 bg-muted-foreground/10 rounded mb-1" />
              <div className="w-14 h-3 bg-muted-foreground/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Team content */}
      {!isLoading && activeSubTab === 'team' && (
        teamMembers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
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
            icon={<Briefcase className="h-10 w-10 text-muted-foreground/40" />}
            title="No team yet"
            description="Add the people who represent this business on Clbhouz."
            showManageButton={canManage}
            onManageClick={() => setManageModalOpen(true)}
            manageButtonLabel="Add team member"
          />
        )
      )}

      {/* Members content - only for Golf Clubs */}
      {!isLoading && activeSubTab === 'members' && showMembersTab && (
        clubMembers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
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
            icon={<Users className="h-10 w-10 text-muted-foreground/40" />}
            title="No members yet"
            description="Golfers who set this as their home club will appear here automatically."
            secondaryDescription="Share your club page so members can find you on Clbhouz."
          />
        )
      )}

      {/* Manage Team Modal */}
      <ManageTeamModal
        open={manageModalOpen}
        onOpenChange={setManageModalOpen}
        businessId={businessId}
        currentTeam={teamMembers}
        isOwner={isOwner}
        mockMode={isMockMode}
      />
    </div>
  );
}

// Role display labels
const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  director: 'Director',
  admin: 'Admin',
  coach: 'Coach',
  staff: 'Team',
};

// Team member card - premium styling with role labels
function TeamMemberCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  const profile = member.profile;
  if (!profile) return null;

  const roleLabel = ROLE_LABELS[member.role] || 'Team';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-sq-lg bg-white border border-border/40 hover:border-border/60 hover:shadow-sm transition-all text-center"
    >
      <SquircleAvatar
        src={profile.profile_photo_url}
        alt={profile.display_name || 'Team member'}
        size={64}
        className="mb-3"
      />
      <div className="flex items-center gap-1 justify-center">
        <span className="text-sm font-medium text-foreground line-clamp-2">
          {profile.display_name || profile.username || 'Unknown'}
        </span>
        {profile.is_verified_golfer && <VerifiedBadge size="sm" />}
      </div>
      <span className="text-xs text-muted-foreground mt-1">
        {roleLabel}
      </span>
    </button>
  );
}

// Club member card with handicap and "Also plays at"
function ClubMemberCard({ member, onClick }: { member: ClubMember; onClick: () => void }) {
  const showHandicap = member.show_handicap !== false && member.eg_handicap_index != null;
  const alsoPlaysAt = member.also_plays_at || [];

  // Format "Also plays at" text
  const getAlsoPlaysAtText = () => {
    if (alsoPlaysAt.length === 0) return null;
    if (alsoPlaysAt.length === 1) return `Also plays at ${alsoPlaysAt[0]}`;
    return `Also plays at ${alsoPlaysAt[0]} +${alsoPlaysAt.length - 1}`;
  };

  const alsoPlaysAtText = getAlsoPlaysAtText();

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-sq-lg bg-white border border-border/40 hover:border-border/60 hover:shadow-sm transition-all text-center"
    >
      <SquircleAvatar
        src={member.profile_photo_url}
        alt={member.display_name || 'Member'}
        size={64}
        className="mb-3"
      />
      <div className="flex items-center gap-1 justify-center">
        <span className="text-sm font-medium text-foreground line-clamp-2">
          {member.display_name || member.username || 'Unknown'}
        </span>
        {member.is_verified_golfer && <VerifiedBadge size="sm" />}
      </div>
      {showHandicap && (
        <span className="text-xs text-muted-foreground mt-1">
          HCP {member.eg_handicap_index!.toFixed(1)}
        </span>
      )}
      {alsoPlaysAtText && (
        <span className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">
          {alsoPlaysAtText}
        </span>
      )}
    </button>
  );
}

// Empty state component - centered, premium
function EmptyState({ 
  icon, 
  title, 
  description,
  secondaryDescription,
  showManageButton,
  onManageClick,
  manageButtonLabel = 'Add team member'
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  secondaryDescription?: string;
  showManageButton?: boolean;
  onManageClick?: () => void;
  manageButtonLabel?: string;
}) {
  return (
    <div className="py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 bg-muted/50">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
        {description}
      </p>
      {secondaryDescription && (
        <p className="text-sm text-muted-foreground/70 max-w-[280px] mx-auto mt-2">
          {secondaryDescription}
        </p>
      )}
      {showManageButton && onManageClick && (
        <Button
          onClick={onManageClick}
          className="mt-6"
        >
          {manageButtonLabel}
        </Button>
      )}
    </div>
  );
}

// Re-export for backwards compatibility
export { PeopleTab as GolfersHereTab };