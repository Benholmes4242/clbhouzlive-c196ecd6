/**
 * LinkedInProfileLayout - New LinkedIn-style profile page layout
 * Hero + Avatar + Identity + CTAs + Stats + Sections
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Settings, MoreHorizontal, Trophy, ChevronRight, Camera, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import PostsTabContent from '@/components/posts-tab/PostsTabContent';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import ProfileAvatarRing from '../header/ProfileAvatarRing';
import { ProfileSocialButtons } from '../actions/ProfileSocialButtons';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

// Tab content components
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { ProfileCoursesTab } from '../ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100PublicJourneyPanel from '@/components/top100/Top100PublicJourneyPanel';
import AchievementsPane from '../AchievementsPane';
import HandicapSection from '../HandicapSection';
import ProfileModalRouter from '../ProfileModalRouter';

// Badge images
import { MILESTONE_BADGE_IMAGES } from '@/config/badgeImages';

// Import the new CSS
import '@/styles/profile-linkedin.css';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  header_photo_url?: string;
  updated_at?: string;
  bio?: string;
  eg_handicap_index?: number;
  user_type?: string | null;
  is_verified_golfer?: boolean | null;
  is_verified_business?: boolean | null;
}

interface LinkedInProfileLayoutProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdate: () => void;
}

const LinkedInProfileLayout: React.FC<LinkedInProfileLayoutProps> = ({
  profile,
  isOwnProfile,
  onProfileUpdate
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  
  // State
  const [activeSection, setActiveSection] = useState('activity');
  const [bioExpanded, setBioExpanded] = useState(false);

  // Data hooks
  const { data: top100Overview } = useTop100Overview(profile?.id);
  const { data: achievements } = useUserAchievements(profile?.id);
  const { data: socialCounts } = useSocialCounts(profile?.id);
  
  // Social counts from centralised hook (Gap 7)
  const followersCount = socialCounts?.followers ?? 0;
  const followingCount = socialCounts?.following ?? 0;
  
  // Profile type
  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);
  const friendsCount = isPersonal ? (socialCounts?.friends ?? 0) : 0;

  // Computed values
  const displayName = profile?.display_name || 'User';
  const username = profile?.username || 'user';
  const homeClub = profile?.home_club || '';
  const totalTop100Played = isPersonal ? (top100Overview?.total_rated ?? top100Overview?.total_played ?? 0) : 0;
  const roundsLogged = top100Overview?.total_rated ?? 0;

  // Hero image
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
  const heroSrc = heroUrl ? `${heroUrl}${heroUrl.includes('?') ? '&' : '?'}v=${ver}` : '';

  // Navigation handlers
  const handleBack = () => navigate(-1);
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ url: window.location.href, title: displayName });
    }
  };
  const handleSettings = () => navigate('/settings');
  const handleFollowers = () => navigate(`/profile/${username}/followers`);
  const handleFollowing = () => navigate(`/profile/${username}/followers?tab=following`);
  const handleFriends = () => navigate(`/profile/${username}/friends`);
  const handleViewAllAchievements = () => navigate(`/profile/${username}?tab=achievements`);

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeSection) {
      case 'activity':
        return (
          <PostsTabContent
            actorType="personal"
            actorId={profile?.id || ''}
            actorName={displayName}
            isOwnProfile={isOwnProfile}
          />
        );
      case 'courses':
        return <ProfileCoursesTab userId={profile?.id || ''} isOwnProfile={isOwnProfile} displayName={profile?.display_name ?? profile?.username} />;
      case 'top100':
        return isOwnProfile ? (
          <Top100MyProgressPanel userId={profile?.id} />
        ) : (
          <Top100PublicJourneyPanel profileUserId={profile?.id || ''} profileName={profile?.display_name} />
        );
      case 'achievements':
        return (
          <AchievementsPane 
            userId={profile?.id}
            userDisplayName={displayName}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            isCurrentUser={isOwnProfile}
          />
        );
      case 'stats':
        return <HandicapSection userId={profile?.id || ''} profile={profile} isOwnProfile={isOwnProfile} />;
      default:
        return null;
    }
  };

  // Get unlocked achievements for preview
  const unlockedAchievements = useMemo(() => {
    if (!achievements) return [];
    return achievements.filter(a => a.isUnlocked).slice(0, 4);
  }, [achievements]);

  // Try to find a milestone threshold from an achievement name/code
  const getBadgeThreshold = (achievement: { code: string; name: string }): number | null => {
    const thresholds = [5, 10, 20, 50, 100, 200, 300, 400];
    for (const t of thresholds) {
      if (achievement.code?.includes(String(t)) || achievement.name?.includes(String(t))) {
        return t;
      }
    }
    return null;
  };

  return (
    <div className="profile-linkedin">
      {/* HERO IMAGE */}
      <div className="pf-hero">
        {heroSrc ? (
          <img src={heroSrc} alt={displayName} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
        )}
        
        {/* Gap 3: Cover edit button for own profile */}
        {isOwnProfile && (
          <button
            onClick={() => navigate('/edit-profile')}
            className="absolute bottom-3 right-4 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 active:scale-95 transition-transform"
            aria-label="Edit cover photo"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        )}
        
        {/* Nav buttons overlay */}
        <div className="pf-nav-buttons">
          <button className="pf-nav-btn" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="pf-nav-right">
            <button className="pf-nav-btn" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </button>
            {isOwnProfile && (
              <button className="pf-nav-btn" onClick={handleSettings}>
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AVATAR (Gap 4: camera badge for own profile) */}
      <div className="pf-avatar-wrapper">
        <div className="relative">
          <div className="pf-avatar">
            <ProfileAvatarRing
              photoUrl={profile?.profile_photo_url}
              displayName={displayName}
              totalTop100Played={totalTop100Played}
              isPersonal={isPersonal}
              isOwnProfile={isOwnProfile}
              size="lg"
              animateOnFirstView={true}
            />
          </div>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/edit-profile')}
              className="absolute -bottom-1 -right-1 z-30 w-7 h-7 rounded-full bg-[hsl(var(--accent-amber))] border-2 border-[#F4F5F7] flex items-center justify-center shadow-md active:scale-95 transition-transform"
              aria-label="Edit profile photo"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* IDENTITY STACK */}
      <div className="pf-identity">
        <div className="flex items-center justify-center gap-2">
          <h1 className="pf-name">{displayName}</h1>
          {isPersonal && profile?.is_verified_golfer && (
            <VerifiedBadge size="lg" placement="inline" />
          )}
        </div>
        
        <div className="pf-headline">
          <span>Golfer</span>
          {homeClub && (
            <>
              <span>·</span>
              <span>{homeClub}</span>
            </>
          )}
          {profile?.eg_handicap_index != null && (
            <span className="pf-hcp-pill">HCP {profile.eg_handicap_index.toFixed(1)}</span>
          )}
        </div>
      </div>

      {/* Gap 11: Edit profile CTA for own profile */}
      {isOwnProfile && (
        <div className="flex justify-center pt-4 px-5">
          <button
            onClick={() => navigate('/edit-profile')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[rgba(15,15,15,0.12)] text-muted-foreground bg-white hover:bg-[#f8f9fa] active:scale-[0.97] transition-all min-h-[44px]"
          >
            <Pencil className="w-4 h-4" />
            Edit profile
          </button>
        </div>
      )}

      {/* ACTION BAR - Only for other users */}
      {!isOwnProfile && user?.id && profile?.id && (
        <div className="pf-actions">
          <ProfileSocialButtons
            currentUserId={user.id}
            profileUserId={profile.id}
            isMobile={true}
          />
        </div>
      )}

      {/* STATS BAR (Gap 6: fixed layout) */}
      <div className="pf-stats-bar">
        <button className="pf-stat-item" onClick={handleFollowers}>
          <span className="pf-stat-value">{followersCount}</span>
          <span className="pf-stat-label">Followers</span>
        </button>
        <button className="pf-stat-item" onClick={handleFollowing}>
          <span className="pf-stat-value">{followingCount}</span>
          <span className="pf-stat-label">Following</span>
        </button>
        {isPersonal && (
          <button className="pf-stat-item" onClick={handleFriends}>
            <span className="pf-stat-value">{friendsCount}</span>
            <span className="pf-stat-label">Friends</span>
          </button>
        )}
      </div>

      {/* CONTENT SECTIONS */}
      <div className="pf-sections">
        {/* About Section */}
        {profile?.bio && (
          <div className="pf-section">
            <div className="pf-section-header">
              <h2 className="pf-section-title">About</h2>
            </div>
            <p className={cn("pf-about-text", bioExpanded && "expanded")}>
              {profile.bio}
            </p>
            {profile.bio.length > 150 && (
              <button 
                className="pf-see-more" 
                onClick={() => setBioExpanded(!bioExpanded)}
              >
                {bioExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}

        {/* Golf Snapshot */}
        {isPersonal && (
          <div className="pf-section">
            <div className="pf-section-header">
              <h2 className="pf-section-title">Golf Snapshot</h2>
            </div>
            <div className="pf-snapshot-grid">
              {profile?.eg_handicap_index != null && (
                <div className="pf-snapshot-item">
                  <span className="pf-snapshot-label">Handicap</span>
                  <span className="pf-snapshot-value">{profile.eg_handicap_index.toFixed(1)}</span>
                </div>
              )}
              {homeClub && (
                <div className="pf-snapshot-item">
                  <span className="pf-snapshot-label">Home Club</span>
                  <span className="pf-snapshot-value">{homeClub.length > 15 ? homeClub.slice(0, 15) + '...' : homeClub}</span>
                </div>
              )}
              <div className="pf-snapshot-item">
                <span className="pf-snapshot-label">Top 100 Played</span>
                <span className="pf-snapshot-value">{totalTop100Played}</span>
              </div>
              <div className="pf-snapshot-item">
                <span className="pf-snapshot-label">Rounds Logged</span>
                <span className="pf-snapshot-value">{roundsLogged}</span>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Preview (Gap 8: real badge images) */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <div className="pf-section">
            <div className="pf-section-header">
              <h2 className="pf-section-title">Achievements</h2>
              <button className="pf-section-link" onClick={handleViewAllAchievements}>
                View all <ChevronRight className="inline w-4 h-4" />
              </button>
            </div>
            {/* Gap 12: right-edge fade wrapper */}
            <div className="relative">
              <div className="pf-achievements-scroll">
                {unlockedAchievements.map((achievement, index) => {
                  const threshold = getBadgeThreshold(achievement);
                  const badgeImage = threshold ? MILESTONE_BADGE_IMAGES[threshold] : null;
                  return (
                    <div key={achievement.achievementId || index} className="pf-achievement-card">
                      {badgeImage ? (
                        <img src={badgeImage} alt={achievement.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <div className="pf-achievement-icon">
                          <Trophy className="w-5 h-5" />
                        </div>
                      )}
                      <div className="pf-achievement-name">{achievement.name || '10 Club'}</div>
                      <div className="pf-achievement-sub">{achievement.category || 'Milestone'}</div>
                    </div>
                  );
                })}
              </div>
              <div className="pf-scroll-fade-right" />
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <div className="pf-section">
          <div 
            className="pf-tabs-container"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn("pf-tab", activeSection === tab.id && "active")}
                onClick={() => setActiveSection(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pf-section" style={{ padding: 0 }}>
          {renderTabContent()}
        </div>
      </div>

      <ProfileModalRouter />
    </div>
  );
};

export default LinkedInProfileLayout;
