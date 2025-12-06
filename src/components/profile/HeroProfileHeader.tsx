import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useTabSlideTransition, TransitionDirection } from '@/hooks/useTabSlideTransition';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPosts } from './hooks/useActivityPosts';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { toast } from 'sonner';

// Modular header components
import {
  ProfileActionsRow,
  // V2 Components - Profile 2.0 redesign
  ProfileAvatarSquare,
  ProfileUserInfoBlock,
  MiniAchievementStrip,
  HeroTop100Card,
  ProfileStatsRowV2,
  ProfileTabsNavV2,
} from './header';

// Tab content components - V2 for Profile 2.0
import ActivityFeedV2 from './ActivityFeedV2';
import ProfileCoursesTabV2 from './ProfileCoursesTabV2';
import ProfileTop100TabV2 from './ProfileTop100TabV2';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100PublicJourneyPanel from '@/components/top100/Top100PublicJourneyPanel';
import AchievementsPane from './AchievementsPane';
import HandicapSection from './HandicapSection';

// Other profile components
import ProfileEditDialog from "./ProfileEditDialog";
import ImmersiveProfileModal from './immersive/ImmersiveProfileModal';
import SwipeToReturnZone from './SwipeToReturnZone';
import ProfileModalRouter from './ProfileModalRouter';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  header_photo_url?: string;
  updated_at?: string;
  mini_card_crop_x?: number;
  mini_card_crop_y?: number;
  mini_card_crop_width?: number;
  mini_card_crop_height?: number;
  desktop_crop_x?: number;
  desktop_crop_y?: number;
  desktop_crop_width?: number;
  desktop_crop_height?: number;
  profile_video_url?: string;
  profile_video_thumbnail_url?: string;
  has_profile_video?: boolean;
  background_image_url?: string;
  cover_photo_url?: string;
  bio?: string;
  website?: string;
  eg_handicap_index?: number;
  eg_app_connected?: boolean;
  user_type?: string | null;
  is_public?: boolean;
  location?: string;
}

interface HeroProfileHeaderProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onProfileUpdate: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const HeroProfileHeader = ({ 
  profile, 
  isOwnProfile,
  onProfileUpdate,
  activeSection = 'activity',
  onSectionChange
}: HeroProfileHeaderProps) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Profile type detection
  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal, isBusiness } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  // State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  
  // Hooks
  const { uploadVideo, uploading: videoUploading } = useCloudflareStream();
  const { uploadImage, uploading: photoUploading } = useR2Upload();
  const { trackScrollDepth } = useProfileAnalytics(profile?.id);
  const { data: top100Overview } = useTop100Overview(profile?.id);
  const { posts, loading: postsLoading } = useActivityPosts(profile?.id);
  
  // Immersive profile
  const {
    isImmersiveOpen,
    currentMediaIndex,
    hasImmersiveMedia,
    mediaItems,
    loading: immersiveLoading,
    shouldAutoOpen,
    openImmersive,
    closeImmersive,
    reopenImmersive,
    refetch: refetchMedia,
    setCurrentMediaIndex
  } = useImmersiveProfile(profile?.id || '', isOwnProfile);

  // Intersection observer for sticky header
  const { ref: profileCardRef, isInView: isProfileCardInView } = useIntersectionObserver({
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    rootMargin: '-20px 0px 0px 0px'
  });

  // Tab transitions
  const { transitionState, transitionDirection, startTransition } = useTabSlideTransition({
    duration: 300
  });

  // Memoized values
  const displayName = useMemo(() => profile?.display_name || 'User', [profile?.display_name]);
  const username = useMemo(() => profile?.username || 'user', [profile?.username]);
  const homeClub = useMemo(() => profile?.home_club || 'Home Club', [profile?.home_club]);
  const postsCount = posts.length;
  const totalTop100Played = isPersonal ? (top100Overview?.total_rated ?? top100Overview?.total_played ?? 0) : 0;

  // Navigation handlers
  const handleOpenFollowers = useCallback(() => {
    if (!username) return;
    navigate(`/profile/${username}/followers`);
  }, [username, navigate]);

  const handleOpenFollowing = useCallback(() => {
    if (!username) return;
    navigate(`/profile/${username}/following`);
  }, [username, navigate]);

  const handleOpenFriends = useCallback(() => {
    if (!username) return;
    navigate(`/profile/${username}/friends`);
  }, [username, navigate]);

  // Tab change handler
  const handleTabChange = useCallback((newTab: string) => {
    if (newTab === activeSection || transitionState !== 'idle') return;
    
    const currentScrollPosition = window.scrollY;
    const preventScroll = (e: Event) => e.preventDefault();
    
    window.addEventListener('scroll', preventScroll, { passive: false });
    document.body.style.overscrollBehavior = 'none';
    
    const currentIndex = tabs.findIndex(tab => tab.id === activeSection);
    const newIndex = tabs.findIndex(tab => tab.id === newTab);
    const direction: TransitionDirection = newIndex > currentIndex ? 'right' : 'left';
    
    startTransition(direction, () => {
      onSectionChange?.(newTab);
      
      setTimeout(() => {
        window.removeEventListener('scroll', preventScroll);
        document.body.style.overscrollBehavior = '';
        
        if (Math.abs(window.scrollY - currentScrollPosition) > 5) {
          window.scrollTo({ top: currentScrollPosition, behavior: 'instant' });
        }
      }, 50);
    });
  }, [activeSection, transitionState, startTransition, onSectionChange, tabs]);

  // Immersive mode handler
  const handleMorphTransition = () => {
    closeImmersive();
    if (activeSection !== 'activity') {
      setTimeout(() => {
        window.scrollTo({ top: isMobile ? 200 : 300, behavior: 'smooth' });
      }, 300);
    }
  };

  // Auto-open immersive mode for other users
  useEffect(() => {
    if (shouldAutoOpen && !immersiveLoading && hasImmersiveMedia) {
      const timer = setTimeout(() => openImmersive(0), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoOpen, immersiveLoading, openImmersive, hasImmersiveMedia]);

  // Fetch social stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
      try {
        // Fetch followers count
        const { count: followers } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);
        setFollowersCount(followers || 0);

        // Fetch following count
        const { count: following } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);
        setFollowingCount(following || 0);

        // Fetch friends count - only for personal profiles
        if (isPersonal) {
          const { count: friends } = await supabase
            .from('user_friends')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);
          setFriendsCount(friends || 0);
        } else {
          setFriendsCount(0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [profile?.id, isPersonal]);

  // Scroll depth tracking
  useEffect(() => {
    if (!isMobile || !profile?.id) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const headerHeight = window.innerHeight * 0.55;
      trackScrollDepth(scrollTop, headerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, profile?.id, trackScrollDepth]);

  // Get current content based on active section
  const getCurrentContent = () => {
    const containerClasses = activeSection === 'activity' ? 'w-full' : 'md:max-w-[1150px] md:mx-auto';
    
    const content = (() => {
      switch (activeSection) {
        case 'activity':
          return (
            <ActivityFeedV2
              userId={profile?.id || ''}
              isOwnProfile={isOwnProfile}
              profileDisplayName={profile?.display_name}
              userHandicap={profile?.eg_handicap_index}
              userProfilePhotoUrl={profile?.profile_photo_url}
              onAchievementsClick={() => onSectionChange?.('achievements')}
            />
          );
        case 'courses':
          return (
            <ProfileCoursesTabV2 
              userId={profile?.id || ''}
              isOwnProfile={isOwnProfile}
            />
          );
        case 'top100':
          return (
            <ProfileTop100TabV2
              userId={profile?.id || ''}
              isOwnProfile={isOwnProfile}
              displayName={profile?.display_name}
            />
          );
        case 'achievements':
          return (
            <AchievementsPane 
              userId={profile?.id}
              userDisplayName={profile?.display_name || 'User'}
              userHandicap={profile?.eg_handicap_index}
              userProfilePhotoUrl={profile?.profile_photo_url}
              isCurrentUser={isOwnProfile}
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
    })();

    return <div className={containerClasses}>{content}</div>;
  };

  // Get transition classes
  const getContentTransitionClass = (isOutgoing: boolean = false) => {
    if (transitionState === 'idle') return '';
    
    const baseClasses = activeSection === 'activity' ? 'px-0 md:px-0 pt-0 pb-8' : 'px-4 md:px-0';
    const sectionClasses = `
      ${activeSection === 'courses' ? 'pt-0 pb-8' : ''}
      ${activeSection === 'top100' ? 'pt-0 pb-8' : ''}
      ${activeSection === 'achievements' || activeSection === 'stats' ? 'pt-0 py-8' : ''}
      ${isMobile && activeSection === 'activity' ? 'pb-4' : ''}
      ${isMobile && activeSection !== 'activity' && activeSection !== 'courses' && activeSection !== 'top100' ? 'py-4' : ''}
    `;
    
    if (isOutgoing) {
      return `${baseClasses} ${sectionClasses} ${transitionDirection === 'right' 
        ? 'animate-slide-out-left' 
        : 'animate-slide-out-right'}`;
    } else {
      return `${baseClasses} ${sectionClasses} ${transitionDirection === 'right'
        ? (isMobile ? 'animate-slide-in-from-right-bounce' : 'animate-slide-in-from-right')
        : (isMobile ? 'animate-slide-in-from-left-bounce' : 'animate-slide-in-from-left')}`;
    }
  };

  // Hero image URL
  const heroUrl = profile?.header_photo_url || profile?.profile_photo_url || '';
  const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
  const heroSrc = heroUrl ? `${heroUrl}${heroUrl.includes('?') ? '&' : '?'}v=${ver}` : '';

  // Mock achievements for the strip - will be replaced with real data
  const mockAchievements = useMemo(() => {
    const achievements: Array<{ id: string; type: 'single-hcp' | 'hole-in-one' | 'pb-round' | '20-club' | '50-club' | '100-club' | '200-club' | '300-club' | 'founders'; label: string }> = [];
    
    if (profile?.eg_handicap_index !== undefined && profile.eg_handicap_index < 10) {
      achievements.push({ id: 'single-hcp', type: 'single-hcp', label: 'Single HCP' });
    }
    if (totalTop100Played >= 20) {
      achievements.push({ id: '20-club', type: '20-club', label: '20 Club' });
    }
    if (totalTop100Played >= 50) {
      achievements.push({ id: '50-club', type: '50-club', label: '50 Club' });
    }
    if (totalTop100Played >= 100) {
      achievements.push({ id: '100-club', type: '100-club', label: '100 Club' });
    }
    
    return achievements;
  }, [profile?.eg_handicap_index, totalTop100Played]);

  return (
    <SwipeToReturnZone onSwipeDown={reopenImmersive}>
      {/* Profile 2.0 Layout */}
      <section className="relative w-full -mt-16">
        
        {/* HEADER IMAGE - 220-260px height per spec */}
        <div className="relative w-full h-[240px] overflow-hidden">
          {heroSrc ? (
            <img 
              src={heroSrc}
              className="w-full h-full object-cover object-top"
              alt={displayName}
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          )}
          
          {/* Dark overlay - rgba(0,0,0,0.25) per spec */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          />
        </div>

        {/* META BLOCK - avatar overlaps header by ~40px */}
        <div
          ref={profileCardRef}
          className="relative mx-auto max-w-[540px] px-4"
        >
          {/* AVATAR – Centered, overlaps header by ~40px (positioned -55px from top of meta block which starts at end of 240px header) */}
          <div className="absolute left-1/2 -top-[55px] -translate-x-1/2 z-20">
            <ProfileAvatarSquare
              photoUrl={profile?.profile_photo_url}
              displayName={displayName}
              size={110}
              onClick={() => openImmersive?.(0)}
            />
          </div>

          {/* Spacer for avatar overlap */}
          <div className="h-[70px]" />

          {/* User Info Block (name, handle, club tiles, bio) */}
          <ProfileUserInfoBlock
            displayName={displayName}
            username={username}
            bio={profile?.bio}
            homeClub={isPersonal ? homeClub : undefined}
            handicap={isPersonal ? profile?.eg_handicap_index : undefined}
            websiteUrl={profile?.website}
            location={profile?.location}
            isPersonal={isPersonal}
            isOwnProfile={isOwnProfile}
            onCustomiseClick={isOwnProfile ? () => setEditDialogOpen(true) : undefined}
          />

          {/* Social Actions - Only for other users' profiles */}
          {!isOwnProfile && user?.id && profile?.id && (
            <ProfileActionsRow
              currentUserId={user.id}
              profileUserId={profile.id}
              isPersonal={isPersonal}
              isMobile={isMobile}
              websiteUrl={profile?.website}
            />
          )}

          {/* Mini Achievement Strip */}
          {isPersonal && mockAchievements.length > 0 && (
            <MiniAchievementStrip
              achievements={mockAchievements}
              onAchievementClick={() => onSectionChange?.('achievements')}
            />
          )}
        </div>

        {/* Hero Top 100 Card - Full width with margin */}
        <HeroTop100Card
          totalPlayed={totalTop100Played}
          isPersonal={isPersonal}
        />

        {/* Stats Row with expandable drawer */}
        <div className="mx-auto max-w-[540px] px-4">
          <ProfileStatsRowV2
            postsCount={postsCount}
            followersCount={followersCount}
            followingCount={followingCount}
            friendsCount={friendsCount}
            isPersonal={isPersonal}
            onFollowersClick={handleOpenFollowers}
            onFollowingClick={handleOpenFollowing}
            onFriendsClick={handleOpenFriends}
          />

          {/* Tab Navigation with icons */}
          <ProfileTabsNavV2
            userType={profile?.user_type}
            activeSection={activeSection}
            onTabChange={handleTabChange}
            disabled={transitionState !== 'idle'}
          />
        </div>
      </section>

      {/* Content sections with slide transitions */}
      <div className="relative overflow-hidden">
        {transitionState === 'transitioning' ? (
          <>
            <div className={`absolute inset-0 w-full ${getContentTransitionClass(true)}`}>
              <div role="tabpanel" aria-hidden="true">
                {getCurrentContent()}
              </div>
            </div>
            <div className={`relative w-full ${getContentTransitionClass(false)}`}>
              <div role="tabpanel" id={`tabpanel-${activeSection}`} aria-hidden="false">
                {getCurrentContent()}
              </div>
            </div>
          </>
        ) : (
          <div className={`
            ${activeSection === 'activity' ? 'px-0 md:px-0 pt-0 pb-8' : 'px-0 md:px-4'}
            ${activeSection === 'courses' ? 'pt-0 pb-8' : ''}
            ${activeSection === 'top100' ? 'pt-0 pb-8' : ''}
            ${activeSection === 'achievements' || activeSection === 'stats' ? 'pt-0 py-8' : ''}
            ${isMobile && activeSection === 'activity' ? 'pb-4' : ''}
            ${isMobile && activeSection !== 'activity' && activeSection !== 'courses' && activeSection !== 'top100' ? 'py-4' : ''}
          `}>
            <div className={activeSection === 'activity' ? 'w-full' : 'md:max-w-[1150px] md:mx-auto'}>
              <div role="tabpanel" id={`tabpanel-${activeSection}`}>
                {getCurrentContent()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Edit Dialog */}
      <ProfileEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userId={profile?.id || ''}
        profile={profile}
        onProfileUpdate={onProfileUpdate}
      />

      {/* Immersive Profile Modal */}
      {hasImmersiveMedia && (
        <ImmersiveProfileModal
          isOpen={isImmersiveOpen}
          onClose={closeImmersive}
          userId={profile?.id || ''}
          mediaItems={mediaItems}
          initialIndex={currentMediaIndex}
        />
      )}

      {/* Profile Modal Router */}
      <ProfileModalRouter />
    </SwipeToReturnZone>
  );
};

export default HeroProfileHeader;
