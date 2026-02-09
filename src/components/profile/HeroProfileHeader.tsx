import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTabSlideTransition, TransitionDirection, PROFILE_TAB_TRANSITION_MS } from '@/hooks/useTabSlideTransition';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useR2Upload } from '@/hooks/useR2Upload';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { useActivityPostsV2 } from './activity/v2';
import { getProfileType, getProfileTabs } from '@/hooks/useProfileType';
import { toast } from 'sonner';
import { trackBusinessEvent } from '@/analytics/businessAnalytics';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useRealtimeSocialCounts } from '@/hooks/useRealtimeSocialCounts';
import { logProfile, createLifecycleLogger, logQueryState, logTabNavigation, profileTiming, logInteraction } from './debug';

// Modular header components
import {
  ProfileHeroShell,
  ProfileHeaderCard,
  ProfileStatsRow,
  ProfileActionsRow,
  ProfileTabsNav,
  ProfileTop100Chip
} from './header';
import ProfileAvatarRing from './header/ProfileAvatarRing';

// Tab content components
import ActivityFeed from './ActivityFeed';
import { ProfileCoursesTab } from './ProfileCoursesTab';
import Top100MyProgressPanel from '@/components/courses/Top100MyProgressPanel';
import Top100PublicJourneyPanel from '@/components/top100/Top100PublicJourneyPanel';
import AchievementsPane from './AchievementsPane';
import HandicapSection from './HandicapSection';

// Other profile components
import ProfileAchievementsRail from './ProfileAchievementsRail';
import ImmersiveProfileModal from './immersive/ImmersiveProfileModal';
import SwipeToReturnZone from './SwipeToReturnZone';
import ProfileModalRouter from './ProfileModalRouter';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  college_normalized?: string | null;
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
  websites?: string[] | null;
  eg_handicap_index?: number;
  eg_app_connected?: boolean;
  user_type?: string | null;
  is_public?: boolean;
  location?: string;
  // Business profile fields
  business_name?: string | null;
  business_category?: string | null;
  business_website?: string | null;
  business_location?: string | null;
  business_contact_email?: string | null;
  business_contact_phone?: string | null;
  business_bio?: string | null;
  is_verified_business?: boolean | null;
  is_verified_golfer?: boolean | null;
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
  
  // Debug: Lifecycle tracking
  const lifecycle = useRef(createLifecycleLogger('HeroProfileHeader'));
  
  // Debug: Mount/unmount tracking
  useEffect(() => {
    profileTiming.start('HeroProfileHeader:render');
    lifecycle.current.onMount({
      profileId: profile?.id,
      isOwnProfile,
      activeSection,
      isMobile,
    });
    return () => {
      lifecycle.current.onUnmount();
    };
  }, []);
  
  // Profile type detection
  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal, isBusiness } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  // Social counts from single source of truth (React Query)
  const { data: socialCounts, isLoading: socialLoading, isFetching: socialFetching } = useSocialCounts(profile?.id);
  const followersCount = socialCounts?.followers ?? 0;
  const followingCount = socialCounts?.following ?? 0;
  const friendsCount = isPersonal ? (socialCounts?.friends ?? 0) : 0;
  
  // Debug: Log social counts
  useEffect(() => {
    logQueryState('useSocialCounts', {
      isLoading: socialLoading,
      isFetching: socialFetching,
      isSuccess: !!socialCounts,
    });
    if (socialCounts) {
      logProfile('data', 'HeroProfileHeader', '📊 Social counts loaded', {
        followers: followersCount,
        following: followingCount,
        friends: friendsCount,
      });
    }
  }, [socialCounts, socialLoading, socialFetching, followersCount, followingCount, friendsCount]);
  
  // Enable real-time updates for social counts
  useRealtimeSocialCounts({
    viewerUserId: user?.id ?? null,
    profileUserId: profile?.id ?? null,
  });
  
  // Hooks
  const { uploadVideo, uploading: videoUploading } = useCloudflareStream();
  const { uploadImage, uploading: photoUploading } = useR2Upload();
  const { trackScrollDepth } = useProfileAnalytics(profile?.id);
  const { data: top100Overview, isLoading: top100Loading } = useTop100Overview(profile?.id);
  const { items: posts, isLoading: postsLoading } = useActivityPostsV2(profile?.id);
  
  // Debug: Log posts loading
  useEffect(() => {
    logQueryState('useActivityPostsV2', {
      isLoading: postsLoading,
      isSuccess: posts.length > 0,
    });
    if (!postsLoading && posts.length > 0) {
      logProfile('data', 'HeroProfileHeader', '📝 Posts loaded', {
        count: posts.length,
        firstPostId: posts[0]?.id,
      });
      profileTiming.end('HeroProfileHeader:render');
    }
  }, [posts, postsLoading]);
  
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
  
  // Debug: Log immersive media
  useEffect(() => {
    if (!immersiveLoading) {
      logProfile('media', 'HeroProfileHeader', '🎥 Immersive media state', {
        hasMedia: hasImmersiveMedia,
        mediaCount: mediaItems.length,
        shouldAutoOpen,
      });
    }
  }, [immersiveLoading, hasImmersiveMedia, mediaItems.length, shouldAutoOpen]);

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

  // Ref to store scroll position captured at click time
  const previousScrollYRef = useRef<number>(0);

  // Tab change handler - accepts scroll snapshot captured at pointer down
  const handleTabChange = useCallback((newTab: string, scrollSnapshot?: number) => {
    if (newTab === activeSection || transitionState !== 'idle') return;
    
    // Debug: Log tab navigation
    logTabNavigation(activeSection, newTab, {
      scrollSnapshot,
      currentScrollY: window.scrollY,
      transitionState,
    });
    profileTiming.start(`TabTransition:${activeSection}→${newTab}`);
    logInteraction('tab_change', newTab, { from: activeSection });
    
    // Use snapshot from click time, fallback to current scroll if not provided
    const targetScrollY = scrollSnapshot ?? window.scrollY;
    previousScrollYRef.current = targetScrollY;
    
    const preventScroll = (e: Event) => e.preventDefault();
    
    window.addEventListener('scroll', preventScroll, { passive: false });
    document.body.style.overscrollBehavior = 'none';
    
    const currentIndex = tabs.findIndex(tab => tab.id === activeSection);
    const newIndex = tabs.findIndex(tab => tab.id === newTab);
    const direction: TransitionDirection = newIndex > currentIndex ? 'right' : 'left';
    
    startTransition(direction, () => {
      onSectionChange?.(newTab);
      
      // Debug: Log transition completion
      setTimeout(() => {
        profileTiming.end(`TabTransition:${activeSection}→${newTab}`);
        logProfile('navigation', 'HeroProfileHeader', `✅ Tab transition complete: ${newTab}`);
      }, PROFILE_TAB_TRANSITION_MS);
      
      // Wait for animation AND initial content render to complete before restoring scroll
      // Use longer delay to account for first-mount data loading in tabs
      setTimeout(() => {
        window.removeEventListener('scroll', preventScroll);
        document.body.style.overscrollBehavior = '';
        
        // Always restore to the scroll position captured at click time
        window.scrollTo({ top: previousScrollYRef.current, behavior: 'instant' });
      }, PROFILE_TAB_TRANSITION_MS + 150);
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

  // Social counts are now fetched via useSocialCounts hook with real-time updates via useRealtimeSocialCounts

  // Track business profile views
  useEffect(() => {
    if (!profile?.id) return;
    
    const isOwn = user?.id === profile.id;
    
    if (isBusiness && !isOwn) {
      trackBusinessEvent(profile.id, 'profile_view');
    }
  }, [profile?.id, isBusiness, user?.id]);

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
    // All tabs use standard container now - Activity breaks out via negative margins internally
    
    const content = (() => {
      switch (activeSection) {
        case 'activity':
          return (
            <ActivityFeed
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
            <ProfileCoursesTab 
              userId={profile?.id || ''}
              isOwnProfile={isOwnProfile}
              displayName={profile?.display_name ?? profile?.username}
            />
          );
        case 'top100':
          return isOwnProfile ? (
            <Top100MyProgressPanel userId={profile?.id} />
          ) : (
            <Top100PublicJourneyPanel 
              profileUserId={profile?.id || ''}
              profileName={profile?.display_name}
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
              isOwnProfile={isOwnProfile}
            />
          );
        default:
          return null;
      }
    })();

    return content;
  };

  // Get transition classes
  const getContentTransitionClass = (isOutgoing: boolean = false) => {
    if (transitionState === 'idle') return '';
    
    const baseClasses = 'pt-6 px-4 sm:px-6 lg:px-8 pb-6';
    const sectionClasses = '';
    
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

  return (
    <SwipeToReturnZone onSwipeDown={reopenImmersive}>
      {/* Premium Golf Profile Layout - Light Grey Theme */}
      <section className="profile-theme-light relative w-full min-h-screen">
        
        {/* HERO IMAGE with light gradient fade - starts below header */}
        <div className="profile-hero relative w-full h-[250px] overflow-hidden" style={{ marginTop: '55px' }}>
          {heroSrc ? (
            <img 
              src={heroSrc}
              className="w-full h-full object-cover"
              alt={displayName}
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
          )}
        </div>

        {/* META BLOCK - Light glass panel with avatar + text */}
        <div
          ref={profileCardRef}
          className="relative"
          style={{ marginTop: '-40px' }}
        >
          {/* Light glass panel */}
          <div
            className="profile-meta-card relative flex items-center gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5"
          >
              {/* AVATAR – Left column */}
              <div className="flex-shrink-0 z-20">
                <ProfileAvatarRing
                  photoUrl={profile?.profile_photo_url}
                  displayName={displayName}
                  totalTop100Played={totalTop100Played}
                  isPersonal={isPersonal}
                  isOwnProfile={isOwnProfile}
                  size="lg"
                  onClick={() => openImmersive?.(0)}
                  animateOnFirstView={true}
                />
              </div>

              {/* TEXT META (name, @handle, HCP, club) */}
              <ProfileHeaderCard
                displayName={displayName}
                username={username}
                homeClub={isPersonal ? homeClub : undefined}
                handicap={isPersonal ? profile?.eg_handicap_index : undefined}
                collegeNormalized={isPersonal ? profile?.college_normalized : undefined}
                websiteUrl={isBusiness ? profile?.business_website : profile?.website}
                location={profile?.location}
                userType={profile?.user_type}
                businessName={profile?.business_name}
                businessCategory={profile?.business_category}
                businessLocation={profile?.business_location}
                isVerifiedBusiness={profile?.is_verified_business}
                isVerifiedGolfer={profile?.is_verified_golfer}
                isPersonal={isPersonal}
                isOwnProfile={isOwnProfile}
                onCustomiseClick={isOwnProfile ? () => navigate('/edit-profile') : undefined}
            />
          </div>
        </div>

        {/* BIO - Full width below glass panel */}
        {profile?.bio && (
          <div className="mt-4 md:mt-5 px-6 md:px-8">
            <p className="profile-bio mx-auto max-w-3xl text-center text-sm md:text-[15px] leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Websites - Capsule buttons below bio (personal profiles) */}
        {isPersonal && profile?.websites && profile.websites.length > 0 && (
          <div className="mt-3 px-6 md:px-8 flex flex-wrap justify-center gap-2">
            {profile.websites.map((url, index) => {
              const displayUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
              const href = url.startsWith('http') ? url : `https://${url}`;
              return (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-website-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {displayUrl}
                </a>
              );
            })}
          </div>
        )}

        {/* Social Actions - Only for other users' profiles */}
        {!isOwnProfile && user?.id && profile?.id && (
          <div className="px-4 mt-3 md:mx-auto md:max-w-[600px]">
            <ProfileActionsRow
              currentUserId={user.id}
              profileUserId={profile.id}
              isPersonal={isPersonal}
              isMobile={isMobile}
              websiteUrl={profile?.website}
              businessWebsite={profile?.business_website}
            />
          </div>
        )}

        {/* Faint divider between header and achievements */}
        <div className="profile-divider mt-4 h-px w-full" />

        {/* Achievements Rail - outside constrained container for full width */}
        {isPersonal && profile?.id && username && (
          <ProfileAchievementsRail
            userId={profile.id}
            username={username}
            isOwnProfile={isOwnProfile}
            className="mt-4"
          />
        )}

        {/* Stats Row - outside constrained container */}
        <ProfileStatsRow
          postsCount={postsCount}
          followersCount={followersCount}
          followingCount={followingCount}
          friendsCount={friendsCount}
          isPersonal={isPersonal}
          isMobile={isMobile}
          onFollowersClick={handleOpenFollowers}
          onFollowingClick={handleOpenFollowing}
          onFriendsClick={handleOpenFriends}
        />

        {/* Tab Navigation - outside constrained container for full width */}
        <ProfileTabsNav
          userType={profile?.user_type}
          activeSection={activeSection}
          onTabChange={handleTabChange}
          isMobile={isMobile}
          disabled={transitionState !== 'idle'}
        />
      </section>

      {/* Content sections with slide transitions */}
      <div className="profile-content-area relative overflow-hidden">
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
          <div className="pt-6 px-4 sm:px-6 lg:px-8 pb-6">
            <div className="md:max-w-[1150px] md:mx-auto">
              <div role="tabpanel" id={`tabpanel-${activeSection}`}>
                {getCurrentContent()}
              </div>
            </div>
          </div>
        )}
      </div>

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
