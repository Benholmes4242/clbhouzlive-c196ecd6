/**
 * LinkedInProfileLayout - New LinkedIn-style profile page layout
 * Hero + Avatar + Identity + CTAs + Stats + Sections
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Settings, Send, MoreHorizontal, Trophy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPostsV2 } from '../activity/v2';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import ProfileAvatarRing from '../header/ProfileAvatarRing';
import { ProfileSocialButtons } from '../actions/ProfileSocialButtons';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

// Tab content components
import ActivityFeed from '../ActivityFeed';
import { ProfileCoursesTab } from '../ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100PublicJourneyPanel from '@/components/top100/Top100PublicJourneyPanel';
import AchievementsPane from '../AchievementsPane';
import HandicapSection from '../HandicapSection';
import ProfileModalRouter from '../ProfileModalRouter';

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
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Data hooks
  const { data: top100Overview } = useTop100Overview(profile?.id);
  const { items: posts } = useActivityPostsV2(profile?.id);
  const { data: achievements } = useUserAchievements(profile?.id);
  
  // Profile type
  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  // Computed values
  const displayName = profile?.display_name || 'User';
  const username = profile?.username || 'user';
  const homeClub = profile?.home_club || '';
  const postsCount = posts.length;
  const totalTop100Played = isPersonal ? (top100Overview?.total_rated ?? top100Overview?.total_played ?? 0) : 0;
  const roundsLogged = top100Overview?.total_rated ?? 0;

  // Hero image
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
  const heroSrc = heroUrl ? `${heroUrl}${heroUrl.includes('?') ? '&' : '?'}v=${ver}` : '';

  // Fetch social stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
      try {
        const { count: followers } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);
        setFollowersCount(followers || 0);

        const { count: following } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);
        setFollowingCount(following || 0);

        if (isPersonal) {
          const { count: friends } = await supabase
            .from('user_friends')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);
          setFriendsCount(friends || 0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [profile?.id, isPersonal]);

  // Navigation handlers
  const handleBack = () => navigate(-1);
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ url: window.location.href, title: displayName });
    }
  };
  const handleSettings = () => navigate('/settings');
  const handleFollowers = () => navigate(`/profile/${username}/followers`);
  const handleFollowing = () => navigate(`/profile/${username}/following`);
  const handleFriends = () => navigate(`/profile/${username}/friends`);
  const handleViewAllAchievements = () => navigate(`/profile/${username}?tab=achievements`);

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeSection) {
      case 'activity':
        return (
          <ActivityFeed
            userId={profile?.id || ''}
            isOwnProfile={isOwnProfile}
            profileDisplayName={profile?.display_name}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            onAchievementsClick={() => setActiveSection('achievements')}
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

  return (
    <div className="profile-linkedin">
      {/* HERO IMAGE */}
      <div className="pf-hero">
        {heroSrc ? (
          <img src={heroSrc} alt={displayName} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
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

      {/* AVATAR */}
      <div className="pf-avatar-wrapper">
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

      {/* STATS BAR */}
      <div className="pf-stats-bar">
        <button className="pf-stat-item" onClick={() => setActiveSection('activity')}>
          <span className="pf-stat-label">About</span>
        </button>
        <div className="pf-stat-item">
          <span className="pf-stat-value">{postsCount}</span>
        </div>
        <button className="pf-stat-item" onClick={handleFollowers}>
          <span className="pf-stat-label">Followers</span>
          <span className="pf-stat-value">{followersCount}</span>
        </button>
        {isPersonal && (
          <button className="pf-stat-item" onClick={handleFriends}>
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

        {/* Achievements Preview */}
        {isPersonal && unlockedAchievements.length > 0 && (
          <div className="pf-section">
            <div className="pf-section-header">
              <h2 className="pf-section-title">Achievements</h2>
              <button className="pf-section-link" onClick={handleViewAllAchievements}>
                View all <ChevronRight className="inline w-4 h-4" />
              </button>
            </div>
            <div className="pf-achievements-scroll">
              {unlockedAchievements.map((achievement, index) => (
                <div key={achievement.achievementId || index} className="pf-achievement-card">
                  <div className="pf-achievement-icon">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="pf-achievement-name">{achievement.name || '10 Club'}</div>
                  <div className="pf-achievement-sub">{achievement.category || 'Milestone'}</div>
                  <div className="pf-achievement-status">Unlocked</div>
                </div>
              ))}
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
