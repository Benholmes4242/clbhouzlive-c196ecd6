import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ChevronRight } from 'lucide-react';
import { useBusinessTeamMembers, TeamMember } from '@/hooks/useBusinessTeamMembers';
import { useBusinessClubMembers } from '@/hooks/useBusinessClubMembers';
import { ManageTeamModal } from './ManageTeamModal';
import { SegmentedTabs } from './people/SegmentedTabs';
import { PersonRow } from './people/PersonRow';
import { TeamRow } from './people/TeamRow';
import { EmptyState } from './people/EmptyState';

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
  const isGolfClub = category === 'Golf Club';
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  const { data: teamMembers = [], isLoading: teamLoading } = useBusinessTeamMembers(businessId);
  const { data: clubMembers = [], isLoading: membersLoading } = useBusinessClubMembers(businessId);

  // Default to Members for golf clubs, Team for others
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(isGolfClub ? 'members' : 'team');

  useEffect(() => {
    if (isGolfClub && !membersLoading && !teamLoading) {
      if (clubMembers.length === 0 && teamMembers.length > 0) {
        setActiveSubTab('team');
      }
    }
  }, [isGolfClub, clubMembers.length, teamMembers.length, membersLoading, teamLoading]);

  const isLoading = activeSubTab === 'team' ? teamLoading : membersLoading;

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Sort team members
  const sortedTeamMembers = useMemo(() => {
    const roleOrder: Record<string, number> = {
      owner: 0, primary_manager: 1, admin: 2, manager: 3,
      director: 4, coach: 5, staff: 6, team: 7,
    };
    return [...teamMembers].sort((a, b) => {
      const orderA = roleOrder[a.role] ?? 10;
      const orderB = roleOrder[b.role] ?? 10;
      if (orderA !== orderB) return orderA - orderB;
      const nameA = a.profile?.display_name || a.profile?.username || '';
      const nameB = b.profile?.display_name || b.profile?.username || '';
      return nameA.localeCompare(nameB);
    });
  }, [teamMembers]);

  // Sort club members
  const sortedClubMembers = useMemo(() => {
    return [...clubMembers].sort((a, b) => {
      if (a.is_verified_golfer !== b.is_verified_golfer) {
        return a.is_verified_golfer ? -1 : 1;
      }
      const nameA = a.display_name || a.username || '';
      const nameB = b.display_name || b.username || '';
      return nameA.localeCompare(nameB);
    });
  }, [clubMembers]);

  // Build tabs array
  const tabs = isGolfClub
    ? [
        { id: 'members', label: 'Members', count: clubMembers.length },
        { id: 'team', label: 'Team', count: teamMembers.length },
      ]
    : [
        { id: 'team', label: 'Team', count: teamMembers.length },
      ];

  return (
    <div className="-mx-5 px-0">
      {/* Header + tabs */}
      <div className="max-w-full px-4">
        {/* Centered Segmented Tabs (golf clubs only) */}
        {isGolfClub && (
          <SegmentedTabs
            tabs={tabs}
            activeTab={activeSubTab}
            onTabChange={(tabId) => setActiveSubTab(tabId as SubTab)}
          />
        )}
      </div>

      {/* Manage team entry point for owners */}
      {canManage && activeSubTab === 'team' && !isLoading && (
        <button
          type="button"
          onClick={() => setManageModalOpen(true)}
          className="w-full flex items-center justify-between px-4 min-h-[44px] mt-2 active:opacity-70 transition-opacity"
        >
          <span className="text-sm text-muted-foreground font-semibold">Manage team</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="px-4 py-4 space-y-3 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-16 h-16 rounded-sq-md bg-muted" />
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
          <div className="flex flex-col" style={{ gap: '24px' }}>
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
                  displayTitle={member.display_title}
                  canManage={canManage}
                  onProfileClick={() => handleProfileClick(profile.id)}
                  onEditAccess={canManage ? () => setEditingMember(member) : undefined}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Briefcase className="h-7 w-7 text-muted-foreground" />}
            title="No team yet"
            description="Add the people who represent this business on Clbhouz."
            showActionButton={canManage}
            onActionClick={() => setManageModalOpen(true)}
            actionButtonLabel="Add team member"
          />
        )
      )}

      {/* Members list - only for Golf Clubs */}
      {!isLoading && activeSubTab === 'members' && isGolfClub && (
        sortedClubMembers.length > 0 ? (
          <div className="flex flex-col" style={{ gap: '24px' }}>
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
                homeClub={null}
                alsoPlaysAt={member.also_plays_at || []}
                onClick={() => handleProfileClick(member.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-7 w-7 text-muted-foreground" />}
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
      />
    </div>
  );
}

// Re-export for backwards compatibility
export { PeopleTab as GolfersHereTab };
