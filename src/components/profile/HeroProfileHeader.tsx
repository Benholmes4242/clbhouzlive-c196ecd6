import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, UserMinus, Copy, Share, Users, UserCheck, MoreVertical, Camera, MapPin, BarChart3 } from 'lucide-react';
import SocialActivity from './SocialActivity';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import { TbMovie } from 'react-icons/tb';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import ProfileTabs from './ProfileTabs';
import ActivityFeed from './ActivityFeed';
import UniversalProfileTabs from './UniversalProfileTabs';
import { getMobileCropPosition } from '@/utils/mobileCropUtils';
import { useTabSlideTransition, TransitionDirection } from '@/hooks/useTabSlideTransition';
import { useIsMobile } from '@/hooks/use-mobile';

import CoursesJourney from './CoursesJourney';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useStaggeredInView } from '@/hooks/useInViewAnimation';
import { useScrollPerformance } from '@/hooks/usePerformanceOptimizations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfileEditDialog from "./ProfileEditDialog";

import { useActivityPosts } from './hooks/useActivityPosts';
import { ActivityPost } from './types/ActivityTypes';
import ActivityHeader from './components/ActivityHeader';
import ActivityPostCard from './components/ActivityPostCard';
import LatestHighlights from '@/components/courses/highlights/LatestHighlights';
import CoursesControls from './CoursesControls';
import HandicapSection from './HandicapSection';
import ProfileSectionCarousel from './ProfileSectionCarousel';
import { createDynamicBackgroundStyle } from '@/utils/backgroundGenerator';

import ProfileBadgeStrip from './ProfileBadgeStrip';
import ProfileProgressSection from './ProfileProgressSection';
import CompareProgressModal from './CompareProgressModal';
import { Swords } from 'lucide-react';
import CinematicProfileHeader from './CinematicProfileHeader';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useR2Upload } from '@/hooks/useR2Upload';
import PinnedAchievements from './PinnedAchievements';
import ProfileStatsBar from './ProfileStatsBar';
import AchievementsPane from './AchievementsPane';
import ImmersiveProfileModal from './immersive/ImmersiveProfileModal';
import MediaManagerModal from './immersive/MediaManagerModal';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import GlassmorphicProfileCard from './GlassmorphicProfileCard';
import SwipeToReturnZone from './SwipeToReturnZone';

import ResponsiveStatsDisplay from './ResponsiveStatsDisplay';
import ProfileModalRouter from './ProfileModalRouter';

import ResponsiveImmersiveHeader from './ResponsiveImmersiveHeader';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
}

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
  user_type?: string;
  is_public?: boolean;
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
  console.log('HeroProfileHeader render with profile:', profile?.id);
  const { user } = useSupabaseSession();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { uploadVideo, uploading: videoUploading } = useCloudflareStream();
  const { uploadImage, uploading: photoUploading } = useR2Upload();
  const isMobile = useIsMobile();

  // Analytics tracking
  const { trackScrollDepth } = useProfileAnalytics(profile?.id);

  // Immersive profile functionality
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
    previewImmersive,
    refetch: refetchMedia,
    setCurrentMediaIndex
  } = useImmersiveProfile(profile?.id || '', isOwnProfile);

  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  
  // Use intersection observer to detect when profile card is out of view
  const { ref: profileCardRef, isInView: isProfileCardInView } = useIntersectionObserver({
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5], // Multiple thresholds for smoother transition
    rootMargin: '-20px 0px 0px 0px' // Smaller buffer for earlier transition start
  });

  const { transitionState, transitionDirection, startTransition } = useTabSlideTransition({
    duration: 300
  });

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'courses', label: 'Courses' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'stats', label: 'Handicap' }
  ];

  const handleTabChange = useCallback((newTab: string) => {
    if (newTab === activeSection || transitionState !== 'idle') return;
    
    // Prevent any scroll behavior when switching tabs - more robust approach
    const currentScrollPosition = window.scrollY;
    const preventScroll = (e: Event) => e.preventDefault();
    
    // Temporarily disable scrolling during tab transition
    window.addEventListener('scroll', preventScroll, { passive: false });
    document.body.style.overscrollBehavior = 'none';
    
    // Determine transition direction based on tab order
    const currentIndex = tabs.findIndex(tab => tab.id === activeSection);
    const newIndex = tabs.findIndex(tab => tab.id === newTab);
    const direction: TransitionDirection = newIndex > currentIndex ? 'right' : 'left';
    
    // Start transition and immediately change the tab
    startTransition(direction, () => {
      onSectionChange?.(newTab);
      
      // Re-enable scrolling and restore position after a short delay
      setTimeout(() => {
        window.removeEventListener('scroll', preventScroll);
        document.body.style.overscrollBehavior = '';
        
        // Force scroll position restoration if it changed
        if (Math.abs(window.scrollY - currentScrollPosition) > 5) {
          window.scrollTo({
            top: currentScrollPosition,
            behavior: 'instant'
          });
        }
      }, 50);
    });
  }, [activeSection, transitionState, startTransition, onSectionChange, tabs]);

  // Get transition classes for hero section (achievements/courses journey)
  const getHeroTransitionClass = (isOutgoing: boolean = false) => {
    if (transitionState === 'idle') return '';
    
    if (isOutgoing) {
      // Element sliding out
      return transitionDirection === 'right' 
        ? 'animate-slide-out-left' 
        : 'animate-slide-out-right';
    } else {
      // Element sliding in
      return transitionDirection === 'right'
        ? (isMobile ? 'animate-slide-in-from-right-bounce' : 'animate-slide-in-from-right')
        : (isMobile ? 'animate-slide-in-from-left-bounce' : 'animate-slide-in-from-left');
    }
  };

  // Get transition classes for content sections
  const getContentTransitionClass = (isOutgoing: boolean = false) => {
    if (transitionState === 'idle') return '';
    
    const baseClasses = activeSection === 'activity' ? 'px-0 md:px-0 pt-0 pb-8' : 'px-4 md:px-0';
    const sectionClasses = `
      ${activeSection === 'courses' ? 'pt-0 pb-8' : ''}
      ${activeSection === 'achievements' || activeSection === 'stats' ? 'pt-0 py-8' : ''}
      ${isMobile && activeSection === 'activity' ? 'pb-4' : ''}
      ${isMobile && activeSection !== 'activity' && activeSection !== 'courses' ? 'py-4' : ''}
    `;
    
    if (isOutgoing) {
      // Element sliding out
      return `${baseClasses} ${sectionClasses} ${transitionDirection === 'right' 
        ? 'animate-slide-out-left' 
        : 'animate-slide-out-right'}`;
    } else {
      // Element sliding in
      return `${baseClasses} ${sectionClasses} ${transitionDirection === 'right'
        ? (isMobile ? 'animate-slide-in-from-right-bounce' : 'animate-slide-in-from-right')
        : (isMobile ? 'animate-slide-in-from-left-bounce' : 'animate-slide-in-from-left')}`;
    }
  };

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
            <div></div> // CoursesJourney is already shown in the main content area
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

  // Get previous content for transitions (used during slide animations)
  const getPreviousContent = () => {
    // During transition, we need to show the content that was active before the transition started
    // This function will return the content that should slide out
    return getCurrentContent(); // For now, use current content logic - this could be enhanced
  };
  
  // Stats state
  const [ratedCoursesCount, setRatedCoursesCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [userProgressData, setUserProgressData] = useState({
    coursesPlayed: 0,
    britainIrelandCompleted: 0,
    europeCompleted: 0,
    usaCompleted: 0,
    worldwideCompleted: 0
  });
  
  // Fetch user achievements for current user
  const { achievements } = useUserAchievements();
  
  // Activity posts logic
  const { posts, loading: postsLoading, fetchUserPosts } = useActivityPosts(profile?.id);
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);

  // Common data from profile
  const displayName = profile?.display_name || 'Unknown User';
  const username = profile?.username || 'unknown';
  const homeClub = profile?.home_club || 'No Club Set';
  const handicap = profile?.eg_handicap_index?.toFixed(1) || 'N/A';
  const bio = profile?.bio || '';
  const website = profile?.website || '';
  const postsCount = posts?.length || 0;

  return (
    <SwipeToReturnZone onSwipeDown={reopenImmersive}>
      {/* Mobile-Only Full Bleed Profile Layout */}
      {isMobile ? (
        <div className="relative -mt-16 bg-white">
          <section className="relative w-full overflow-visible">
            {/* HERO (full-bleed) */}
            <div className="relative w-full" style={{ height: 'var(--hero-h)' }}>
              {/* Loading state */}
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              
              {(profile?.header_photo_url || profile?.profile_photo_url) ? (
                <img
                  src={(() => {
                    const heroSrc = profile?.header_photo_url || profile?.profile_photo_url || '';
                    const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
                    return heroSrc ? `${heroSrc}${heroSrc.includes('?') ? '&' : '?'}v=${ver}` : '';
                  })()}
                  alt={profile?.display_name || 'Profile'}
                  className="h-full w-full object-cover"
                  style={{ 
                    objectPosition: '50% 50%'
                  }}
                  loading="eager"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.previousElementSibling?.remove();
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">
                  <Camera className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Profile Photo</p>
                  <p className="text-sm text-center px-4">
                    {isOwnProfile ? 'Upload a photo in Edit Profile' : 'User hasn\'t uploaded a photo yet'}
                  </p>
                </div>
              )}

              {/* Bottom Fade Gradient - behind panel */}
              <div className="absolute bottom-0 left-0 w-full h-16 md:h-20
                              bg-gradient-to-t from-white via-white/60 to-transparent
                              pointer-events-none z-[5]" />
            </div>

            {/* GLASS PANEL — consistent overlap & padding */}
            <section
              className="relative mx-4 rounded-2xl border border-white/35 bg-white/35 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              style={{ marginTop: 'calc(var(--panel-overlap) * -1)', padding: 'var(--panel-pad-y) var(--panel-pad-x)' }}
            >
              {/* Header row: kebab • name/handle • mini card */}
              <div
                className="grid items-center"
                style={{ gridTemplateColumns: 'max-content 1fr var(--mini-w)' }}
              >
                {/* Left: kebab/menu */}
                <div className="justify-self-start">
                  {isOwnProfile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full transition-colors duration-300 hover:bg-black/10 text-gray-700 hover:text-gray-900">
                          <MoreVertical size={24} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          Edit Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Center: name + handle */}
                <div className="text-center">
                  <h1 className="font-semibold leading-tight text-[length:var(--fs-display)]">
                    {displayName}
                  </h1>
                  <div className="opacity-70 text-[length:var(--fs-handle)]">@{username}</div>
                </div>

                {/* Right: mini profile card */}
                <div
                  className="justify-self-end rounded-lg border border-white/40 bg-white/20 backdrop-blur-sm shadow-sm overflow-hidden cursor-pointer hover:bg-white/30 transition-all duration-200"
                  style={{
                    width: 'var(--mini-w)',
                    height: 'var(--mini-h)',
                    borderRadius: 'var(--mini-radius)',
                  }}
                  onClick={() => openImmersive(0)}
                  role="button"
                  tabIndex={0}
                  aria-label="Open immersive profile preview"
                  title="Open immersive profile preview"
                >
                  {profile?.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  {/* Movie icon in top right */}
                  <div className="absolute top-1 right-1 bg-black/40 rounded-full p-1">
                    <TbMovie className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Club + Handicap row */}
              <div
                className="mt-3 grid items-start"
                style={{ gridTemplateColumns: '1fr 1fr', columnGap: 'clamp(12px, 4vw, 28px)' }}
              >
                <div className="text-center sm:text-left">
                  <div className="opacity-60 text-[length:var(--fs-label)]">Golf Club</div>
                  <div className="text-[length:var(--fs-value)]">{homeClub}</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="opacity-60 text-[length:var(--fs-label)]">Handicap</div>
                  <div className="text-[length:var(--fs-value)]">{handicap}</div>
                </div>
              </div>

              {/* Bio + Website */}
              <div
                className="mt-3 md:max-w-none"
                style={{ maxWidth: 'min(100%, calc(100% - var(--mini-w) - var(--panel-pad-x)))' }}
              >
                {bio && (
                  <p className="text-[length:var(--fs-bio)] text-center mb-2">{bio}</p>
                )}
                {website && (
                  <p className="text-center">
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[length:var(--fs-bio)] underline"
                    >
                      {website}
                    </a>
                  </p>
                )}
              </div>

              {/* Slim stats grid */}
              <div className="w-full grid grid-cols-4 gap-4 text-center mt-4">
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-900">{postsCount}</span>
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Posts</span>
                </div>
                <div className="flex flex-col border-l border-gray-300 pl-4">
                  <span className="text-lg font-semibold text-gray-900">2,500</span>
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Total XP</span>
                </div>
                <div className="flex flex-col border-l border-gray-300 pl-4">
                  <span className="text-lg font-semibold text-gray-900">{followingCount}</span>
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Following</span>
                </div>
                <div className="flex flex-col border-l border-gray-300 pl-4">
                  <span className="text-lg font-semibold text-gray-900">{followersCount}</span>
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Followers</span>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="w-full border-t border-gray-300 mt-4 pt-4">
                <div className="flex" role="tablist" aria-label="Profile sections">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      role="tab"
                      aria-selected={activeSection === tab.id}
                      aria-controls={`tabpanel-${tab.id}`}
                      tabIndex={activeSection === tab.id ? 0 : -1}
                      className={`
                        relative py-3 px-2 text-sm font-medium transition-colors duration-200
                        ${activeSection === tab.id 
                          ? 'text-gray-900 focus:outline-none' 
                          : 'text-gray-600 hover:text-gray-800 focus:outline-none'
                        }
                        flex-1 text-center
                      `}
                    >
                      {tab.label}
                      {/* Brand orange underline animation */}
                      <div 
                        className={`
                          absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500
                          transition-all duration-300 ease-out
                          ${activeSection === tab.id 
                            ? 'scale-x-100 opacity-100' 
                            : 'scale-x-0 opacity-0'
                          }
                          origin-center
                        `}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </section>
          
          {/* Tabs rail spacing */}
          <div style={{ marginTop: 'var(--tabs-gap-top)' }}>
            {/* Tab content will be rendered here by parent component */}
          </div>
        </div>
      ) : (
        /* Desktop layout - same responsive upgrade pattern */
        <div className="relative -mt-16 bg-white">
          <section className="relative w-full overflow-visible">
            {/* HERO (full-bleed) */}
            <div className="relative w-full" style={{ height: 'var(--hero-h)' }}>
              {/* Loading state */}
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              
              {(profile?.header_photo_url || profile?.profile_photo_url) ? (
                <img
                  src={(() => {
                    const heroSrc = profile?.header_photo_url || profile?.profile_photo_url || '';
                    const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
                    return heroSrc ? `${heroSrc}${heroSrc.includes('?') ? '&' : '?'}v=${ver}` : '';
                  })()}
                  alt={profile?.display_name || 'Profile'}
                  className="h-full w-full object-cover"
                  style={{ 
                    objectPosition: (() => {
                      const crop = {
                        x: profile?.desktop_crop_x || 0,
                        y: profile?.desktop_crop_y || 0,
                        width: profile?.desktop_crop_width || 100,
                        height: profile?.desktop_crop_height || 100
                      };
                      const cx = crop.x + crop.width / 2;
                      const cy = crop.y + crop.height / 2;
                      return `${cx}% ${cy}%`;
                    })(),
                    objectFit: 'cover'
                  }}
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">
                  <Camera className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Profile Photo</p>
                  <p className="text-sm text-center px-4">
                    {isOwnProfile ? 'Upload a photo in Edit Profile' : 'User hasn\'t uploaded a photo yet'}
                  </p>
                </div>
              )}

              {/* Bottom Fade Gradient - behind panel */}
              <div className="absolute bottom-0 left-0 w-full h-16 md:h-20
                              bg-gradient-to-t from-white via-white/60 to-transparent
                              pointer-events-none z-[5]" />
            </div>

            {/* GLASS PANEL — consistent overlap & padding */}
            <section
              className="relative mx-4 rounded-2xl border border-white/35 bg-white/35 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              style={{ marginTop: 'calc(var(--panel-overlap) * -1)', padding: 'var(--panel-pad-y) var(--panel-pad-x)' }}
            >
              {/* Header row: kebab • name/handle • mini card */}
              <div
                className="grid items-center"
                style={{ gridTemplateColumns: 'max-content 1fr var(--mini-w)' }}
              >
                {/* Left: kebab/menu */}
                <div className="justify-self-start">
                  {isOwnProfile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full transition-colors duration-300 hover:bg-black/10 text-gray-700 hover:text-gray-900">
                          <MoreVertical size={24} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          Edit Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Center: name + handle */}
                <div className="text-center">
                  <h1 className="font-semibold leading-tight text-[length:var(--fs-display)]">
                    {displayName}
                  </h1>
                  <div className="opacity-70 text-[length:var(--fs-handle)]">@{username}</div>
                </div>

                {/* Right: mini profile card */}
                <div
                  className="justify-self-end rounded-lg border border-white/40 bg-white/20 backdrop-blur-sm shadow-sm overflow-hidden cursor-pointer hover:bg-white/30 transition-all duration-200"
                  style={{
                    width: 'var(--mini-w)',
                    height: 'var(--mini-h)',
                    borderRadius: 'var(--mini-radius)',
                  }}
                  onClick={() => openImmersive(0)}
                  role="button"
                  tabIndex={0}
                  aria-label="Open immersive profile preview"
                  title="Open immersive profile preview"
                >
                  {profile?.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </div>

              {/* Club + Handicap row */}
              <div
                className="mt-3 grid items-start"
                style={{ gridTemplateColumns: '1fr 1fr', columnGap: 'clamp(12px, 4vw, 28px)' }}
              >
                <div className="text-center sm:text-left">
                  <div className="opacity-60 text-[length:var(--fs-label)]">Golf Club</div>
                  <div className="text-[length:var(--fs-value)]">{homeClub}</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="opacity-60 text-[length:var(--fs-label)]">Handicap</div>
                  <div className="text-[length:var(--fs-value)]">{handicap}</div>
                </div>
              </div>

              {/* Bio + Website */}
              <div
                className="mt-3 md:max-w-none"
                style={{ maxWidth: 'min(100%, calc(100% - var(--mini-w) - var(--panel-pad-x)))' }}
              >
                {bio && (
                  <p className="text-[length:var(--fs-bio)] text-center mb-2">{bio}</p>
                )}
                {website && (
                  <p className="text-center">
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[length:var(--fs-bio)] underline"
                    >
                      {website}
                    </a>
                  </p>
                )}
              </div>

              {/* Desktop Tab Navigation */}
              <div className="w-full border-t border-gray-300 mt-4 pt-4">
                <div className="flex" role="tablist" aria-label="Profile sections">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      role="tab"
                      aria-selected={activeSection === tab.id}
                      aria-controls={`tabpanel-${tab.id}`}
                      tabIndex={activeSection === tab.id ? 0 : -1}
                      className={`
                        relative py-3 px-2 text-sm font-medium transition-colors duration-200
                        ${activeSection === tab.id 
                          ? 'text-gray-900 focus:outline-none' 
                          : 'text-gray-600 hover:text-gray-800 focus:outline-none'
                        }
                        flex-1 text-center
                      `}
                    >
                      {tab.label}
                      {/* Brand orange underline animation */}
                      <div 
                        className={`
                          absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500
                          transition-all duration-300 ease-out
                          ${activeSection === tab.id 
                            ? 'scale-x-100 opacity-100' 
                            : 'scale-x-0 opacity-0'
                          }
                          origin-center
                        `}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </section>
          
          {/* Tab Content */}
          <div style={{ marginTop: 'var(--tabs-gap-top)' }}>
            {activeSection === 'activity' && (
              <SocialActivity
                userId={profile?.id || ''}
                isOwnProfile={isOwnProfile}
                activityVisible={true}
                profileDisplayName={profile?.display_name}
                userType="individual"
              />
            )}
            {activeSection === 'stats' && (
              <HandicapSection userId={profile?.id || ''} profile={profile} />
            )}
            {activeSection === 'courses' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-white">Top 100 courses</h2>
                </div>
                <UserCoursesContent 
                  username={profile?.username} 
                  isOwnProfile={isOwnProfile}
                  displayName={profile?.display_name}
                />
              </>
            )}
            {activeSection === 'achievements' && (
              <AchievementsPane 
                userId={profile?.id}
                userDisplayName={profile?.display_name || 'User'}
                userHandicap={profile?.eg_handicap_index}
                userProfilePhotoUrl={profile?.profile_photo_url}
                isCurrentUser={isOwnProfile}
              />
            )}
          </div>
        </div>
      )}

      {/* Profile Edit Dialog */}
      <ProfileEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        userId={user?.id}
        onProfileUpdate={onProfileUpdate}
      />

      {/* Immersive Profile Modal */}
      {isImmersiveOpen && (
        <ImmersiveProfileModal
          isOpen={isImmersiveOpen}
          onClose={closeImmersive}
          userId={profile?.id ?? ''}
          mediaItems={mediaItems}
        />
      )}

      {/* Media Manager Modal */}
      {mediaManagerOpen && (
        <MediaManagerModal
          isOpen={mediaManagerOpen}
          onClose={() => setMediaManagerOpen(false)}
          userId={profile?.id ?? ''}
          mediaItems={mediaItems}
          onMediaUpdate={refetchMedia}
        />
      )}

      {/* ProfileModalRouter - Available to all profile visitors for course viewing */}
      <ProfileModalRouter />
    </SwipeToReturnZone>
  );
};

export default HeroProfileHeader;