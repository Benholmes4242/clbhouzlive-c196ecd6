/**
 * ProfilePageV2 - Dark Golf Passport Profile
 * Hero identity with tabbed content
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile.tsx';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useUserSeasonXP } from '@/hooks/useUserSeasonXP';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useActivityPosts } from '@/components/profile/hooks/useActivityPosts';
import { useIsMobile } from '@/hooks/use-mobile';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { supabase } from '@/integrations/supabase/client';
import { Settings, ArrowLeft, Share2 } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  HeroMedia,
  IdentityOverlay,
} from '@/components/profile-v2';

// Tab content components (reused from old profile)
import ActivityFeed from '@/components/profile/ActivityFeed';
import { ProfileCoursesTab } from '@/components/profile/ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import AchievementsPane from '@/components/profile/AchievementsPane';
import HandicapSection from '@/components/profile/HandicapSection';
import ProfileAchievementsRail from '@/components/profile/ProfileAchievementsRail';

// V1 Polish: Calm motion easing
const POLISH_TRANSITION = 'all 220ms cubic-bezier(0.4, 0.0, 0.2, 1)';

// Stats block with tap animation (lift + soft glow)
interface StatBlockProps {
  value: number;
  label: string;
  onClick?: () => void;
}

const StatBlock: React.FC<StatBlockProps> = ({ value, label, onClick }) => {
  const [isTapped, setIsTapped] = React.useState(false);
  
  const handleTap = () => {
    if (!onClick) return;
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 220);
    onClick();
  };
  
  const content = (
    <div 
      className="flex flex-col items-center py-2 px-3 rounded-sq-sm"
      style={{
        transition: POLISH_TRANSITION,
        transform: isTapped ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isTapped ? '0 6px 18px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <span 
        className="text-lg font-semibold tabular-nums" 
        style={{ color: 'var(--dgp-text-primary)' }}
      >
        {value}
      </span>
      <span 
        className="mt-0.5 text-[11px] uppercase tracking-[0.06em]" 
        style={{ color: 'var(--dgp-text-muted)' }}
      >
        {label}
      </span>
    </div>
  );
  
  if (onClick) {
    return (
      <button 
        type="button" 
        onClick={handleTap}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sq-sm"
        style={{ transition: POLISH_TRANSITION }}
      >
        {content}
      </button>
    );
  }
  
  return content;
};

const ProfilePageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: top100Overview } = useTop100Overview(user?.id);
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasonXP } = useUserSeasonXP(user?.id, currentSeason?.id);
  const { posts } = useActivityPosts(user?.id);
  const isMobile = useIsMobile();
  
  const [activeSection, setActiveSection] = useState('activity');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);

  // Profile type detection
  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

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

  const postsCount = posts.length;

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="dgp-page flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const displayName = profile?.display_name || 'Golfer';
  const username = profile?.username || 'user';
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const top100Count = top100Overview?.total_played ?? 0;

  // Get current content based on active section
  const getCurrentContent = () => {
    switch (activeSection) {
      case 'activity':
        return (
          <ActivityFeed
            userId={profile?.id || ''}
            isOwnProfile={true}
            profileDisplayName={profile?.display_name}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            onAchievementsClick={() => setActiveSection('achievements')}
          />
        );
      case 'courses':
        return (
          <ProfileCoursesTab 
            userId={profile?.id || ''}
            isOwnProfile={true}
          />
        );
      case 'top100':
        return (
          <Top100MyProgressPanel userId={profile?.id} />
        );
      case 'achievements':
        return (
          <AchievementsPane 
            userId={profile?.id}
            userDisplayName={profile?.display_name || 'User'}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            isCurrentUser={true}
          />
        );
      case 'stats':
        return (
          <HandicapSection 
            userId={profile?.id || ''}
            profile={profile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageRoot className="dgp-page">
      {/* Navigation buttons - glass style, floating */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="dgp-nav-button"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <button
            className="dgp-nav-button"
            aria-label="Share profile"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="dgp-nav-button"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <HeroMedia
          mediaType={profile?.has_profile_video ? 'video' : 'image'}
          url={heroUrl}
          posterUrl={profile?.profile_video_thumbnail_url}
          height="48vh"
        />
        
        <IdentityOverlay
          displayName={displayName}
          username={username}
          clubName={profile?.home_club ?? undefined}
          handicapIndex={profile?.eg_handicap_index ?? undefined}
          avatarUrl={profile?.profile_photo_url ?? undefined}
          top100Count={top100Count}
          isVerified={profile?.is_verified_golfer ?? false}
          onAvatarClick={() => {/* Open immersive view */}}
        />
      </div>

      {/* Content below hero - dark styled */}
      <div className="relative z-10 -mt-4">
        {/* Stats Row - +30-40% vertical padding, equal spacing, tap animation */}
        <section className="mt-4 flex items-center justify-center gap-10 px-4 py-6">
          <StatBlock value={postsCount} label="Posts" />
          
          {isPersonal && (
            <StatBlock 
              value={friendsCount} 
              label="Friends" 
              onClick={() => navigate(`/profile/${username}/friends`)}
            />
          )}
          
          <StatBlock 
            value={followingCount} 
            label="Following" 
            onClick={() => navigate(`/profile/${username}/following`)}
          />
          
          <StatBlock 
            value={followersCount} 
            label="Followers" 
            onClick={() => navigate(`/profile/${username}/followers`)}
          />
        </section>

        {/* Achievements Rail - overlaps slightly into hero area */}
        {isPersonal && profile?.id && username && (
          <ProfileAchievementsRail
            userId={profile.id}
            username={username}
            className="-mt-2"
          />
        )}

        {/* Tabs - taller for touch comfort, glass highlight + underline glow */}
        <section className="mt-8 px-4">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList 
              className="grid w-full rounded-sq-md border px-2 py-2"
              style={{ 
                gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
                background: 'var(--dgp-glass-surface)',
                borderColor: 'var(--dgp-glass-stroke)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                minHeight: '48px',
              }}
            >
              {tabs.map((tab) => {
                const isActive = activeSection === tab.id;
                return (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="relative rounded-sq-pill text-sm px-3 py-2 font-medium"
                    style={{
                      color: isActive ? 'var(--dgp-text-primary)' : 'var(--dgp-text-muted)',
                      background: isActive ? 'var(--dgp-glass-hover)' : 'transparent',
                      boxShadow: isActive ? '0 0 12px rgba(110, 146, 119, 0.25)' : 'none',
                      transition: 'all 220ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                    }}
                  >
                    {tab.label}
                    {/* Underline glow for active tab */}
                    {isActive && (
                      <span 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded-full"
                        style={{
                          background: 'var(--dgp-accent-green)',
                          opacity: 0.6,
                          boxShadow: '0 0 8px var(--dgp-accent-green)',
                        }}
                      />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </section>

        {/* Tab Content */}
        <div className="pt-6 px-4 pb-32">
          {getCurrentContent()}
        </div>
      </div>
    </PageRoot>
  );
};

export default ProfilePageV2;
