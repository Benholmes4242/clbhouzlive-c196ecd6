import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, UserMinus, Copy, Share, Users, UserCheck, MoreVertical } from 'lucide-react';
import { TbMovie } from 'react-icons/tb';
import { Camera, MapPin, BarChart3 } from 'lucide-react';
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
  mobile_crop_x?: number;
  mobile_crop_y?: number;
  mobile_crop_width?: number;
  mobile_crop_height?: number;
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

interface AchievementRing {
  level: number;
  title: string;
  ringClass: string;
  color: string;
  courses: number;
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

  // Stats state
  const [ratedCoursesCount, setRatedCoursesCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);

  // Display data
  const displayName = profile?.display_name || 'User';
  const username = profile?.username || 'username';
  const homeClub = profile?.home_club || 'Golf Club';
  const handicap = profile?.eg_handicap_index?.toFixed(1) || 'N/A';

  // Auto-open immersive mode for other users when they have media (default entry)
  useEffect(() => {
    if (shouldAutoOpen && !immersiveLoading && hasImmersiveMedia) {
      // Delay slightly to ensure smooth page load
      const timer = setTimeout(() => {
        openImmersive(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoOpen, immersiveLoading, openImmersive, hasImmersiveMedia]);

  // Fetch stats data
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
      try {
        // Fetch followers count
        const { count: followersCount, error: followersError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        if (!followersError) {
          setFollowersCount(followersCount || 0);
        }

        // Fetch following count
        const { count: followingCount, error: followingError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);

        if (!followingError) {
          setFollowingCount(followingCount || 0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [profile?.id]);

  return (
    <SwipeToReturnZone onSwipeDown={reopenImmersive}>
      {/* Mobile-Only Full Bleed Profile Layout */}
      {isMobile ? (
        <>
          {/* HERO (full-bleed) */}
          <div className="relative w-full" style={{ height: 'var(--hero-h)' }}>
            {/* Keep it simple & self-contained: header image or fallback to profile image */}
            {profile?.header_photo_url || profile?.profile_photo_url ? (
              <img
                src={(() => {
                  const hero = profile?.header_photo_url || profile?.profile_photo_url || '';
                  const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
                  return hero ? `${hero}${hero.includes('?') ? '&' : '?'}v=${ver}` : '';
                })()}
                alt={profile?.display_name || 'Profile hero'}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: (() => {
                    const cx = (profile?.mobile_crop_x ?? profile?.desktop_crop_x ?? 0) +
                               (profile?.mobile_crop_width ?? profile?.desktop_crop_width ?? 100) / 2;
                    const cy = (profile?.mobile_crop_y ?? profile?.desktop_crop_y ?? 0) +
                               (profile?.mobile_crop_height ?? profile?.desktop_crop_height ?? 100) / 2;
                    return `${cx}% ${cy}%`;
                  })()
                }}
                loading="eager"
              />
            ) : null}
          </div>

          {/* GLASS PANEL — unchanged size/shape, consistent overlap & padding */}
          <section
            className="relative mx-0 sm:mx-4 bg-white/35 backdrop-blur-xl border border-white/35 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            style={{
              marginTop: 'calc(var(--panel-overlap) * -1)',
              padding: 'var(--panel-pad-y) var(--panel-pad-x)'
            }}
          >
            {/* Mini profile card — 24% overhang, 8px from right, white border restored */}
            <div
              className="absolute"
              style={{
                top: 'calc(var(--mini-h) * -0.24)',
                right: '8px',
                width: 'var(--mini-w)',
                height: 'var(--mini-h)'
              }}
            >
              <button
                type="button"
                onClick={() => openImmersive?.(0)}
                aria-label="Open immersive profile"
                className="block h-full w-full rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.25)] border border-white/80 bg-white/10 backdrop-blur-sm"
                style={{ borderRadius: 'var(--mini-radius)' }}
              >
                {profile?.profile_photo_url ? (
                  <img
                    src={(() => {
                      const src = profile.profile_photo_url;
                      const ver = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
                      return `${src}${src.includes('?') ? '&' : '?'}v=${ver}`;
                    })()}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: (() => {
                        const cx = (profile?.mini_card_crop_x ?? 0) +
                                   (profile?.mini_card_crop_width ?? 100) / 2;
                        const cy = (profile?.mini_card_crop_y ?? 0) +
                                   (profile?.mini_card_crop_height ?? 100) / 2;
                        return `${cx}% ${cy}%`;
                      })()
                    }}
                    loading="lazy"
                  />
                ) : null}
              </button>
            </div>

            {/* Content grid reserves the right column width for the mini card */}
            <div
              className="grid items-start gap-y-3"
              style={{ gridTemplateColumns: '1fr var(--mini-w)', columnGap: 'clamp(12px,4vw,24px)' }}
            >
              {/* LEFT column: name/handle + club/handicap */}
              <div className="pr-2">
                {/* Name (two-line wrap), then handle underneath */}
                <h1
                  className="font-semibold leading-tight text-[length:var(--fs-display)]"
                  style={{ lineClamp: 2, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}
                >
                  {displayName}
                </h1>
                <div className="opacity-80 text-[length:var(--fs-handle)]">@{username}</div>

                {/* Golf Club (left) & Handicap (under mini card center) */}
                <div className="mt-3 grid items-start" style={{ gridTemplateColumns: '1fr 1fr', columnGap: '24px' }}>
                  {/* Golf Club */}
                  <div className="text-left">
                    <div className="font-semibold text-[length:var(--fs-label)]">Golf Club</div>
                    <div className="text-[length:var(--fs-value)] leading-snug">
                      {homeClub}
                    </div>
                  </div>

                  {/* Handicap — centered vertically under the mini card */}
                  <div className="text-center" style={{ justifySelf: 'end', width: 'var(--mini-w)' }}>
                    <div className="font-semibold text-[length:var(--fs-label)]">Handicap</div>
                    <div className="text-[length:var(--fs-value)] leading-snug">{handicap}</div>
                  </div>
                </div>
              </div>

              {/* RIGHT column is intentionally empty (space reserved for mini card) */}
              <div />
            </div>

            {/* Bio section below the content column */}
            <div className="w-full mt-6">
              <div className="text-center">
                {profile?.bio && (
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                {profile?.website && (
                  <div className="text-center">
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Slim Stats Row */}
            <div className="w-full grid grid-cols-4 gap-3 text-center mt-4">
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-900">{postsCount}</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Posts</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-3">
                <span className="text-lg font-semibold text-gray-900">2,500</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Total XP</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-3">
                <span className="text-lg font-semibold text-gray-900">{followingCount}</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Following</span>
              </div>
              <div className="flex flex-col border-l border-gray-300 pl-3">
                <span className="text-lg font-semibold text-gray-900">{followersCount}</span>
                <span className="text-xs text-gray-600 uppercase tracking-wide">Followers</span>
              </div>
            </div>

            {/* Tab Navigation - pinned to bottom */}
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
          
          {/* Spacer below for 16px gap before tab content */}
          <div className="h-4" />
        </>
      ) : (
        <div>Desktop layout placeholder</div>
      )}

      {/* Content sections based on active tab */}
      <div className="w-full">
        {activeSection === 'activity' && (
          <ActivityFeed
            userId={profile?.id || ''}
            isOwnProfile={isOwnProfile}
            profileDisplayName={profile?.display_name}
            userHandicap={profile?.eg_handicap_index}
            userProfilePhotoUrl={profile?.profile_photo_url}
            onAchievementsClick={() => onSectionChange?.('achievements')}
          />
        )}
        {activeSection === 'courses' && (
          <CoursesJourney 
            userId={profile?.id}
            userDisplayName={profile?.display_name || 'User'}
            isOwnProfile={isOwnProfile}
          />
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
        {activeSection === 'stats' && (
          <HandicapSection 
            userId={profile?.id || ''}
            profile={profile}
          />
        )}
      </div>

      {/* Profile Edit Dialog */}
      {isOwnProfile && (
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={profile?.id || ''}
          profile={profile}
          onProfileUpdate={onProfileUpdate}
        />
      )}

      {/* Immersive Profile Modal */}
      <ImmersiveProfileModal
        isOpen={isImmersiveOpen}
        onClose={closeImmersive}
        userId={profile?.id || ''}
        mediaItems={mediaItems}
        initialIndex={currentMediaIndex}
        onCurrentIndexChange={setCurrentMediaIndex}
        uploadMode={isOwnProfile}
        onUploadComplete={() => refetchMedia()}
      />

      {/* Media Manager Modal */}
      <MediaManagerModal
        isOpen={mediaManagerOpen}
        onClose={() => setMediaManagerOpen(false)}
        userId={profile?.id || ''}
      />

      {/* ProfileModalRouter - Available to all profile visitors for course viewing */}
      <ProfileModalRouter />
    </SwipeToReturnZone>
  );
};

export default HeroProfileHeader;
