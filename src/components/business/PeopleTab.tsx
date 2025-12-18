import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Info } from 'lucide-react';
import { useBusinessTeamMembers, TeamMember } from '@/hooks/useBusinessTeamMembers';
import { useBusinessClubMembers, ClubMember } from '@/hooks/useBusinessClubMembers';
import { ManageTeamModal } from './ManageTeamModal';
import { SegmentedTabs } from './people/SegmentedTabs';
import { PeopleList } from './people/PeopleList';
import { PersonRow } from './people/PersonRow';
import { TeamRow } from './people/TeamRow';
import { EmptyState } from './people/EmptyState';
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
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
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

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Sort team members: Owner → Admin/Manager → Team
  const sortedTeamMembers = useMemo(() => {
    const roleOrder: Record<string, number> = {
      owner: 0,
      primary_manager: 1,
      admin: 2,
      manager: 3,
      director: 4,
      coach: 5,
      staff: 6,
      team: 7,
    };
    return [...teamMembers].sort((a, b) => {
      const orderA = roleOrder[a.role] ?? 10;
      const orderB = roleOrder[b.role] ?? 10;
      if (orderA !== orderB) return orderA - orderB;
      // Then by name
      const nameA = a.profile?.display_name || a.profile?.username || '';
      const nameB = b.profile?.display_name || b.profile?.username || '';
      return nameA.localeCompare(nameB);
    });
  }, [teamMembers]);

  // Sort club members: verified first, then by name
  const sortedClubMembers = useMemo(() => {
    return [...clubMembers].sort((a, b) => {
      // Verified first
      if (a.is_verified_golfer !== b.is_verified_golfer) {
        return a.is_verified_golfer ? -1 : 1;
      }
      // Then by name
      const nameA = a.display_name || a.username || '';
      const nameB = b.display_name || b.username || '';
      return nameA.localeCompare(nameB);
    });
  }, [clubMembers]);

  // Build tabs array
  const tabs = showMembersTab
    ? [
        { id: 'members', label: 'Members', count: clubMembers.length },
        { id: 'team', label: 'Team', count: teamMembers.length },
      ]
    : [
        { id: 'team', label: 'Team', count: teamMembers.length },
      ];

  return (
    <div className="bg-white">
      {/* Mock mode indicator */}
      {isMockMode && (
        <div className="mx-4 mt-4 flex items-center gap-2 px-3 py-2 rounded-sq-sm bg-amber-50 border border-amber-200 text-amber-800">
          <Info className="h-4 w-4 shrink-0" />
          <span className="text-xs">Sample data for layout testing</span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <h2 className="text-lg font-semibold text-foreground text-center">People</h2>
      </div>

      {/* Centered Segmented Tabs */}
      {showMembersTab && (
        <SegmentedTabs
          tabs={tabs}
          activeTab={activeSubTab}
          onTabChange={(tabId) => setActiveSubTab(tabId as SubTab)}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="px-4 py-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-sq-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-muted rounded" />
                <div className="w-24 h-3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team list */}
      {!isLoading && activeSubTab === 'team' && (
        sortedTeamMembers.length > 0 ? (
          <PeopleList label="Team" count={sortedTeamMembers.length}>
            {sortedTeamMembers.map((member) => {
              const profile = member.profile;
              if (!profile) return null;
              
              return (
                <TeamRow
                  key={member.id}
                  id={member.id}
                  displayName={profile.display_name}
                  username={profile.username}
                  profilePhotoUrl={profile.profile_photo_url}
                  isVerified={profile.is_verified_golfer}
                  role={member.role}
                  canManage={canManage}
                  onProfileClick={() => handleProfileClick(profile.id)}
                  onEditAccess={canManage ? () => setEditingMember(member) : undefined}
                />
              );
            })}
          </PeopleList>
        ) : (
          <EmptyState
            icon={<Briefcase className="h-8 w-8 text-muted-foreground/40" />}
            title="No team yet"
            description="Add the people who represent this business on Clbhouz."
            showActionButton={canManage}
            onActionClick={() => setManageModalOpen(true)}
            actionButtonLabel="Add team member"
          />
        )
      )}

      {/* Members list - only for Golf Clubs */}
      {!isLoading && activeSubTab === 'members' && showMembersTab && (
        sortedClubMembers.length > 0 ? (
          <PeopleList label="Members" count={sortedClubMembers.length}>
            {sortedClubMembers.map((member) => (
              <PersonRow
                key={member.id}
                id={member.id}
                displayName={member.display_name}
                username={member.username}
                profilePhotoUrl={member.profile_photo_url}
                isVerified={member.is_verified_golfer}
                handicap={member.eg_handicap_index}
                showHandicap={member.show_handicap !== false}
                homeClub={null} // They're already at their home club
                alsoPlaysAt={member.also_plays_at || []}
                onClick={() => handleProfileClick(member.id)}
              />
            ))}
          </PeopleList>
        ) : (
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground/40" />}
            title="No members yet"
            description="Golfers who set this as their home club will appear here automatically."
            secondaryDescription="Share your club page so members can find you."
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

// Re-export for backwards compatibility
export { PeopleTab as GolfersHereTab };
