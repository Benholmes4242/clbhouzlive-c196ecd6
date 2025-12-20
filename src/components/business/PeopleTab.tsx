import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase } from 'lucide-react';
import { useBusinessTeamMembers, TeamMember } from '@/hooks/useBusinessTeamMembers';
import { useBusinessClubMembers } from '@/hooks/useBusinessClubMembers';
import { ManageTeamModal } from './ManageTeamModal';
import { SegmentedTabs } from './people/SegmentedTabs';
import { PeopleList } from './people/PeopleList';
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

// ========== MOCK DATA FLAG - Set to false to disable mock team members ==========
const SHOW_MOCK_TEAM_MEMBERS = true;

const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { id: 'mock-1', role: 'admin', created_at: '2024-01-01', profile: { id: 'mock-1', display_name: 'Sarah Mitchell', username: 'sarahmitchell', profile_photo_url: null, is_verified_golfer: true } },
  { id: 'mock-2', role: 'coach', created_at: '2024-01-02', profile: { id: 'mock-2', display_name: 'James Chen', username: 'jameschen', profile_photo_url: null, is_verified_golfer: true } },
  { id: 'mock-3', role: 'staff', created_at: '2024-01-03', profile: { id: 'mock-3', display_name: 'Emma Thompson', username: 'emmathompson', profile_photo_url: null, is_verified_golfer: false } },
  { id: 'mock-4', role: 'coach', created_at: '2024-01-04', profile: { id: 'mock-4', display_name: 'Michael Brooks', username: 'michaelbrooks', profile_photo_url: null, is_verified_golfer: true } },
  { id: 'mock-5', role: 'staff', created_at: '2024-01-05', profile: { id: 'mock-5', display_name: 'Olivia Parker', username: 'oliviaparker', profile_photo_url: null, is_verified_golfer: false } },
  { id: 'mock-6', role: 'director', created_at: '2024-01-06', profile: { id: 'mock-6', display_name: 'William Foster', username: 'williamfoster', profile_photo_url: null, is_verified_golfer: true } },
  { id: 'mock-7', role: 'staff', created_at: '2024-01-07', profile: { id: 'mock-7', display_name: 'Sophie Adams', username: 'sophieadams', profile_photo_url: null, is_verified_golfer: false } },
  { id: 'mock-8', role: 'coach', created_at: '2024-01-08', profile: { id: 'mock-8', display_name: 'Daniel Wright', username: 'danielwright', profile_photo_url: null, is_verified_golfer: true } },
  { id: 'mock-9', role: 'staff', created_at: '2024-01-09', profile: { id: 'mock-9', display_name: 'Isabella Scott', username: 'isabellascott', profile_photo_url: null, is_verified_golfer: false } },
  { id: 'mock-10', role: 'staff', created_at: '2024-01-10', profile: { id: 'mock-10', display_name: 'Alexander Hughes', username: 'alexanderhughes', profile_photo_url: null, is_verified_golfer: true } },
];
// ================================================================================

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

  // Combine real team members with mock data if flag is enabled
  const allTeamMembers = useMemo(() => {
    if (SHOW_MOCK_TEAM_MEMBERS) {
      return [...teamMembers, ...MOCK_TEAM_MEMBERS];
    }
    return teamMembers;
  }, [teamMembers]);

  // Default to Members for golf clubs, Team for others
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(isGolfClub ? 'members' : 'team');

  useEffect(() => {
    // For golf clubs: if Members is empty and Team exists, default to Team
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
    return [...allTeamMembers].sort((a, b) => {
      const orderA = roleOrder[a.role] ?? 10;
      const orderB = roleOrder[b.role] ?? 10;
      if (orderA !== orderB) return orderA - orderB;
      // Then by name
      const nameA = a.profile?.display_name || a.profile?.username || '';
      const nameB = b.profile?.display_name || b.profile?.username || '';
      return nameA.localeCompare(nameB);
    });
  }, [allTeamMembers]);

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

  // Build tabs array - only show Members tab for Golf Clubs
  const tabs = isGolfClub
    ? [
        { id: 'members', label: 'Members', count: clubMembers.length },
        { id: 'team', label: 'Team', count: allTeamMembers.length },
      ]
    : [
        { id: 'team', label: 'Team', count: allTeamMembers.length },
      ];

  return (
    <div 
      className="-mx-5 px-0"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      {/* Header + tabs - white card */}
      <div className="bg-white max-w-full px-4">
        {/* Header */}
        <div className="pt-4 pb-1">
          <h2 className="text-lg font-semibold text-foreground text-center">People</h2>
        </div>

        {/* Centered Segmented Tabs */}
        {isGolfClub && (
          <SegmentedTabs
            tabs={tabs}
            activeTab={activeSubTab}
            onTabChange={(tabId) => setActiveSubTab(tabId as SubTab)}
          />
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="px-4 py-4 space-y-3 bg-white mt-3">
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
          <div className="flex flex-col gap-3 mt-3">
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
          </div>
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
      {!isLoading && activeSubTab === 'members' && isGolfClub && (
        sortedClubMembers.length > 0 ? (
          <div className="flex flex-col gap-3 mt-3">
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
      />
    </div>
  );
}

// Re-export for backwards compatibility
export { PeopleTab as GolfersHereTab };
