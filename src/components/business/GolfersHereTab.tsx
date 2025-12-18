import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useBusinessTeamMembers, TeamMember } from '@/hooks/useBusinessTeamMembers';
import { useBusinessClubMembers, ClubMember } from '@/hooks/useBusinessClubMembers';
import { ManageTeamModal } from './ManageTeamModal';

interface GolfersHereTabProps {
  businessId: string;
  businessName?: string;
  businessLocation?: string;
  category?: string | null;
  canManage?: boolean;
  isOwner?: boolean;
}

type SubTab = 'members' | 'team';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  director: 'Director',
  admin: 'Admin',
  coach: 'Coach',
  staff: 'Staff',
};

export function GolfersHereTab({ 
  businessId, 
  businessName, 
  category,
  canManage = false,
  isOwner = false
}: GolfersHereTabProps) {
  const navigate = useNavigate();
  const isGolfClub = category === 'Golf Club';
  const [manageModalOpen, setManageModalOpen] = useState(false);
  
  const { data: teamMembers = [], isLoading: teamLoading } = useBusinessTeamMembers(businessId);
  const { data: clubMembers = [], isLoading: membersLoading } = useBusinessClubMembers(businessId);

  // Default to Team for non-golf-clubs, or Members for golf clubs (unless empty)
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(isGolfClub ? 'members' : 'team');

  useEffect(() => {
    // For golf clubs: if Members is empty and Team exists, default to Team
    if (isGolfClub && !membersLoading && !teamLoading) {
      if (clubMembers.length === 0 && teamMembers.length > 0) {
        setActiveSubTab('team');
      }
    }
  }, [isGolfClub, clubMembers.length, teamMembers.length, membersLoading, teamLoading]);

  // For non-golf-clubs, always show team
  const showMembersTab = isGolfClub;
  const isLoading = activeSubTab === 'team' ? teamLoading : membersLoading;
  const currentCount = activeSubTab === 'team' ? teamMembers.length : clubMembers.length;

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div>
      {/* Sub-tabs: Members / Team - only show Members for Golf Clubs */}
      {showMembersTab ? (
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
      ) : null}

      {/* Count header + Manage button */}
      <div className="py-3 px-4 flex items-center justify-between">
        <div className="flex-1">
          {currentCount > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {activeSubTab === 'team' 
                ? `${currentCount} team member${currentCount !== 1 ? 's' : ''}`
                : `${currentCount} member${currentCount !== 1 ? 's' : ''}`
              }
            </p>
          )}
        </div>
        {canManage && activeSubTab === 'team' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManageModalOpen(true)}
            className="gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage Team
          </Button>
        )}
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

      {/* Team content - shown for non-golf-clubs or when Team tab is active */}
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
            description="Team members will appear here once added."
            showManageButton={canManage}
            onManageClick={() => setManageModalOpen(true)}
          />
        )
      )}

      {/* Members content - only for Golf Clubs */}
      {!isLoading && activeSubTab === 'members' && showMembersTab && (
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
            description="Golfers who set this as their home club will appear here automatically."
            secondaryDescription="Want to grow this? Invite members to set their home club."
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
function EmptyState({ 
  icon, 
  title, 
  description,
  secondaryDescription,
  showManageButton,
  onManageClick
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  secondaryDescription?: string;
  showManageButton?: boolean;
  onManageClick?: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted">
        {icon}
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">{title}</h3>
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
          variant="outline"
          size="sm"
          onClick={onManageClick}
          className="mt-4 gap-1.5"
        >
          <Settings className="h-3.5 w-3.5" />
          Add Team Members
        </Button>
      )}
    </div>
  );
}