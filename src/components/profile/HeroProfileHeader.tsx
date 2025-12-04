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

  return (
    <SwipeToReturnZone onSwipeDown={reopenImmersive}>
      {/* Premium Golf Profile Layout - No card, seamless gradient */}
      <section className="relative w-full -mt-16">
        
        {/* HERO IMAGE */}
        <div className="relative w-full h-[290px] overflow-hidden">
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
          
          {/* Top vignette for header readability */}
          <div 
            className="absolute top-0 left-0 right-0 h-12 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 100%)',
            }}
          />
          
          {/* Bottom fade into page - seamless blend */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
            style={{
              background: 'linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 25%, hsl(var(--background) / 0.4) 50%, hsl(var(--background) / 0.1) 75%, transparent 100%)',
            }}
          />
        </div>

        {/* META BLOCK - no card, transparent, sits on page background */}
        <div
          ref={profileCardRef}
          className="relative mx-auto max-w-[540px] px-5 pt-16 pb-8 bg-background"
        >
          {/* AVATAR – OVERLAPS HERO BY ~10% */}
          <div className="absolute left-1/2 -top-[85px] -translate-x-1/2 z-20">
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

          {/* TEXT META (name, @handle, club, bio, customise) */}
          <ProfileHeaderCard
            displayName={displayName}
            username={username}
            bio={profile?.bio}
            profilePhotoUrl={profile?.profile_photo_url}
            homeClub={isPersonal ? homeClub : undefined}
            handicap={isPersonal ? profile?.eg_handicap_index : undefined}
            websiteUrl={profile?.website}
            location={profile?.location}
            userType={profile?.user_type}
            totalTop100Played={totalTop100Played}
            isPersonal={isPersonal}
            isOwnProfile={isOwnProfile}
            isMobile={isMobile}
            onAvatarClick={() => openImmersive?.(0)}
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

          {/* Stats Row */}
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

          {/* Top 100 Chip with completion stamps - Personal profiles only */}
          <ProfileTop100Chip
            top100Overview={{
              ...top100Overview,
              lists: undefined
            }}
            isPersonal={isPersonal}
            isMobile={isMobile}
          />

          {/* Tab Navigation */}
          <ProfileTabsNav
            userType={profile?.user_type}
            activeSection={activeSection}
            onTabChange={handleTabChange}
            isMobile={isMobile}
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
