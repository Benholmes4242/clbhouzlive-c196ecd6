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
import { trackBusinessEvent } from '@/analytics/businessAnalytics';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

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
  
  // Profile type detection
  const profileTypeInfo = getProfileType(profile?.user_type);
  const { isPersonal, isBusiness } = profileTypeInfo;
  const tabs = getProfileTabs(profile?.user_type);

  // State
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
      {/* LinkedIn-style Golfer Profile Layout */}
      <section className="profile-theme-light relative w-full min-h-screen">
        
        {/* HERO IMAGE with light gradient fade */}
        <div className="profile-hero relative w-full" style={{ height: 'clamp(180px, 24vw, 220px)' }}>
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

        {/* CENTERED IDENTITY STACK - LinkedIn style */}
        <div
          ref={profileCardRef}
          className="relative flex flex-col items-center"
          style={{ marginTop: '-56px' }}
        >
          {/* Avatar - centered, overlapping hero */}
          <div 
            className="relative z-20"
            style={{ 
              boxShadow: '0 10px 30px rgba(15,15,15,0.18)',
              borderRadius: '22%',
            }}
          >
            <div 
              className="bg-[#F4F5F7] p-1"
              style={{ borderRadius: '22%' }}
            >
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
          </div>

          {/* Name - largest text */}
          <h1 className="mt-4 text-[26px] md:text-[30px] font-extrabold tracking-tight text-center" style={{ color: '#1F2428' }}>
            {displayName}
          </h1>

          {/* Headline: Golfer · Home Club + HCP pill */}
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2" style={{ color: 'rgba(31, 36, 40, 0.75)' }}>
            <span className="text-sm md:text-[15px]">
              Golfer {homeClub && <>· {homeClub}</>}
            </span>
            {isPersonal && profile?.eg_handicap_index != null && (
              <span 
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  background: 'rgba(15,15,15,0.06)',
                  border: '1px solid rgba(15,15,15,0.08)',
                  color: '#1F2428'
                }}
              >
                HCP {profile.eg_handicap_index.toFixed(1)}
              </span>
            )}
          </div>

          {/* Credibility row - verified, country, creator badges */}
          {(isPersonal && (profile?.is_verified_golfer)) && (
            <div className="mt-2 flex items-center gap-2">
              {profile?.is_verified_golfer && (
                <VerifiedBadge size="md" placement="inline" />
              )}
            </div>
          )}

          {/* Action Bar - Follow, Message, More */}
          {!isOwnProfile && user?.id && profile?.id && (
            <div className="mt-4 w-full px-4 max-w-[400px] mx-auto">
              <div className="flex items-center gap-2">
                <ProfileActionsRow
                  currentUserId={user.id}
                  profileUserId={profile.id}
                  isPersonal={isPersonal}
                  isMobile={isMobile}
                  websiteUrl={profile?.website}
                  businessWebsite={profile?.business_website}
                />
              </div>
            </div>
          )}

          {/* Edit button for own profile */}
          {isOwnProfile && (
            <button
              onClick={() => navigate('/edit-profile')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition"
              style={{
                background: 'rgba(15,15,15,0.06)',
                border: '1px solid rgba(15,15,15,0.08)',
                color: '#1F2428'
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit profile
            </button>
          )}
        </div>

        {/* Stats Row - horizontal strip with dividers */}
        <div className="mt-5 border-y" style={{ borderColor: 'rgba(15,15,15,0.08)' }}>
          <div className="flex items-stretch justify-center">
            {/* About / Posts */}
            <button 
              onClick={() => onSectionChange?.('activity')}
              className="flex-1 py-3 flex flex-col items-center gap-0.5 transition hover:bg-[rgba(0,0,0,0.02)]"
              style={{ 
                borderBottom: activeSection === 'activity' ? '2px solid #1F2428' : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >
              <span className="text-xs font-medium" style={{ color: '#5E666D' }}>About</span>
            </button>
            
            <div className="w-px self-stretch my-2" style={{ background: 'rgba(15,15,15,0.08)' }} />
            
            <button 
              onClick={handleOpenFollowers}
              className="flex-1 py-3 flex flex-col items-center gap-0.5 transition hover:bg-[rgba(0,0,0,0.02)]"
            >
              <span className="text-base font-semibold tabular-nums" style={{ color: '#1F2428' }}>{followersCount}</span>
              <span className="text-xs font-medium" style={{ color: '#5E666D' }}>Followers</span>
            </button>
            
            <div className="w-px self-stretch my-2" style={{ background: 'rgba(15,15,15,0.08)' }} />
            
            <button 
              onClick={handleOpenFollowing}
              className="flex-1 py-3 flex flex-col items-center gap-0.5 transition hover:bg-[rgba(0,0,0,0.02)]"
            >
              <span className="text-base font-semibold tabular-nums" style={{ color: '#1F2428' }}>{followingCount}</span>
              <span className="text-xs font-medium" style={{ color: '#5E666D' }}>Following</span>
            </button>
            
            {isPersonal && (
              <>
                <div className="w-px self-stretch my-2" style={{ background: 'rgba(15,15,15,0.08)' }} />
                <button 
                  onClick={handleOpenFriends}
                  className="flex-1 py-3 flex flex-col items-center gap-0.5 transition hover:bg-[rgba(0,0,0,0.02)]"
                >
                  <span className="text-xs font-medium" style={{ color: '#5E666D' }}>Friends</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* CONTENT SECTIONS - LinkedIn-style white cards */}
        <div className="px-4 py-3 space-y-3" style={{ background: '#F4F5F7' }}>
          
          {/* About Section */}
          {profile?.bio && (
            <div 
              className="p-4"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(15,15,15,0.08)',
                borderRadius: '14px',
                boxShadow: '0 6px 18px rgba(15,15,15,0.06)'
              }}
            >
              <h2 className="text-base font-semibold mb-2" style={{ color: '#1F2428' }}>About</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#5E666D' }}>
                {profile.bio}
              </p>
            </div>
          )}

          {/* Golf Snapshot Section */}
          <div 
            className="p-4"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(15,15,15,0.08)',
              borderRadius: '14px',
              boxShadow: '0 6px 18px rgba(15,15,15,0.06)'
            }}
          >
            <h2 className="text-base font-semibold mb-3" style={{ color: '#1F2428' }}>Golf Snapshot</h2>
            <div className="grid grid-cols-2 gap-px" style={{ background: 'rgba(15,15,15,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
              {profile?.eg_handicap_index != null && (
                <div className="p-3 bg-white flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#5E666D' }}>Handicap</span>
                  <span className="text-sm font-semibold" style={{ color: '#1F2428' }}>{profile.eg_handicap_index.toFixed(1)}</span>
                </div>
              )}
              {homeClub && (
                <div className="p-3 bg-white flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#5E666D' }}>Home Club</span>
                  <span className="text-sm font-semibold text-right" style={{ color: '#1F2428', maxWidth: '60%' }}>{homeClub}</span>
                </div>
              )}
              {postsCount > 0 && (
                <div className="p-3 bg-white flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#5E666D' }}>Posts</span>
                  <span className="text-sm font-semibold" style={{ color: '#1F2428' }}>{postsCount}</span>
                </div>
              )}
              {isPersonal && totalTop100Played > 0 && (
                <div className="p-3 bg-white flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#5E666D' }}>Top 100 Played</span>
                  <span className="text-sm font-semibold" style={{ color: '#1F2428' }}>{totalTop100Played}</span>
                </div>
              )}
            </div>
          </div>

          {/* Achievements Section */}
          {isPersonal && profile?.id && username && (
            <div 
              className="p-4"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(15,15,15,0.08)',
                borderRadius: '14px',
                boxShadow: '0 6px 18px rgba(15,15,15,0.06)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold" style={{ color: '#1F2428' }}>Achievements</h2>
                <button 
                  onClick={() => navigate(`/profile/${username}/achievements`)}
                  className="text-sm font-medium flex items-center gap-1"
                  style={{ color: '#F7931E' }}
                >
                  View all
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <ProfileAchievementsRail
                userId={profile.id}
                username={username}
                className=""
              />
            </div>
          )}
        </div>

        {/* Tab Navigation - white background with light styling */}
        <div 
          className="sticky top-0 z-30"
          style={{ 
            background: '#FFFFFF',
            borderBottom: '1px solid rgba(15,15,15,0.08)'
          }}
        >
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
