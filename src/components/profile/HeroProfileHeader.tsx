import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useTabSlideTransition, TransitionDirection, PROFILE_TAB_TRANSITION_MS } from '@/hooks/useTabSlideTransition';
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
import ProfileEditDialog from "./ProfileEditDialog";
import ProfileAchievementsRail from './ProfileAchievementsRail';
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
  // Business profile fields
  business_name?: string | null;
  business_category?: string | null;
  business_website?: string | null;
  business_location?: string | null;
  business_contact_email?: string | null;
  business_contact_phone?: string | null;
  business_bio?: string | null;
  is_verified_business?: boolean | null;
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

  // Ref to store scroll position captured at click time
  const previousScrollYRef = useRef<number>(0);

  // Tab change handler - accepts scroll snapshot captured at pointer down
  const handleTabChange = useCallback((newTab: string, scrollSnapshot?: number) => {
    if (newTab === activeSection || transitionState !== 'idle') return;
    
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
      {/* Premium Golf Profile Layout - No card, seamless gradient */}
      <section className="relative w-full -mt-16">
        
        {/* HERO IMAGE */}
        <div className="relative w-full h-[250px] overflow-hidden">
          {heroSrc ? (
            <img 
              src={heroSrc}
              className="w-full h-full object-cover"
              alt={displayName}
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          )}
          
          {/* Global vignette - subtle top + bottom darkening */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-70"
            style={{
              background: 'radial-gradient(circle at top, rgba(0,0,0,0.22), transparent 55%), radial-gradient(circle at bottom, rgba(0,0,0,0.18), transparent 55%)',
            }}
          />
          
        </div>

        {/* META BLOCK - Glass panel with avatar + text */}
        <div
          ref={profileCardRef}
          className="relative"
          style={{ marginTop: '-40px' }}
        >
          {/* Glass panel - full bleed */}
          <div
            className="relative flex items-center gap-4 md:gap-6 rounded-3xl bg-muted/0 backdrop-blur-xl px-4 md:px-6 py-4 md:py-5"
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
                websiteUrl={isBusiness ? profile?.business_website : profile?.website}
                location={profile?.location}
                userType={profile?.user_type}
                businessName={profile?.business_name}
                businessCategory={profile?.business_category}
                businessLocation={profile?.business_location}
                isVerifiedBusiness={profile?.is_verified_business}
                isPersonal={isPersonal}
                isOwnProfile={isOwnProfile}
                onCustomiseClick={isOwnProfile ? () => setEditDialogOpen(true) : undefined}
            />
          </div>
        </div>

        {/* BIO - Full width below glass panel */}
        {profile?.bio && (
          <div className="mt-4 md:mt-5 px-6 md:px-8">
            <p className="mx-auto max-w-3xl text-center text-sm md:text-[15px] leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
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
        <div 
          className="mt-4 h-px w-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.05) 20%, hsl(var(--foreground) / 0.05) 80%, transparent 100%)',
          }}
        />

        {/* Achievements Rail - outside constrained container for full width */}
        {isPersonal && profile?.id && username && (
          <ProfileAchievementsRail
            userId={profile.id}
            username={username}
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
          <div className="pt-6 px-4 sm:px-6 lg:px-8 pb-6">
            <div className="md:max-w-[1150px] md:mx-auto">
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
