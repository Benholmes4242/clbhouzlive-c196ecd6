import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, UserMinus, Copy, Share, Users, UserCheck, MoreVertical } from 'lucide-react';
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
import ProfileFormFields from "./ProfileFormFields";
import { useProfileForm } from "./hooks/useProfileForm";
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
  // Mobile and desktop crop fields
  mobile_crop_x?: number;
  mobile_crop_y?: number;
  mobile_crop_width?: number;
  mobile_crop_height?: number;
  desktop_crop_x?: number;
  desktop_crop_y?: number;
  desktop_crop_width?: number;
  desktop_crop_height?: number;
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
      ${activeSection === 'achievements' || activeSection === 'stats' ? 'py-8' : ''}
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
  
  // Fetch stats data including progress
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;
      
      try {
        // Fetch rated courses count and average rating
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('course_ratings')
          .select('rating')
          .eq('user_id', profile.id);
          
        if (ratingsError) {
          console.error('Error fetching ratings:', ratingsError);
          return;
        }
        
        if (ratingsData && ratingsData.length > 0) {
          setRatedCoursesCount(ratingsData.length);
          const avgRating = ratingsData.reduce((sum, r) => sum + Number(r.rating), 0) / ratingsData.length;
          setAverageRating(Math.round(avgRating * 10) / 10); // Round to 1 decimal place
        } else {
          setRatedCoursesCount(0);
          setAverageRating(0);
        }

        // Fetch followers count
        const { count: followersCount, error: followersError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        if (followersError) {
          console.error('Error fetching followers:', followersError);
        } else {
          setFollowersCount(followersCount || 0);
        }

        // Fetch following count
        const { count: followingCount, error: followingError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);

        if (followingError) {
          console.error('Error fetching following:', followingError);
        } else {
          setFollowingCount(followingCount || 0);
        }

        // Fetch progress data for course counts
        const { data: top100Data } = await supabase
          .from('user_top100_courses')
          .select(`
            course_id,
            golf_courses (
              country,
              continent,
              global_rank,
              regional_rank,
              usa_rank
            )
          `)
          .eq('user_id', profile.id)
          .eq('played', true);

        const { data: ratedCoursesData } = await supabase
          .from('course_ratings')
          .select(`
            course_id,
            golf_courses (
              country,
              continent,
              global_rank,
              regional_rank,
              usa_rank
            )
          `)
          .eq('user_id', profile.id);

        // Combine and deduplicate courses
        const allCourses = [...(top100Data || []), ...(ratedCoursesData || [])];
        const uniqueCourses = allCourses.filter((course, index, self) => 
          index === self.findIndex(c => c.course_id === course.course_id)
        );

        let britainIrelandCompleted = 0;
        let europeCompleted = 0;
        let usaCompleted = 0;
        let worldwideCompleted = 0;

        uniqueCourses.forEach((courseData) => {
          const course = courseData.golf_courses;
          if (!course) return;

          const isTop100 = course.global_rank || course.regional_rank || course.usa_rank;
          if (isTop100) {
            worldwideCompleted++;

            if (course.country === 'Britain & Ireland') {
              britainIrelandCompleted++;
            }
            
            if (course.country === 'USA') {
              usaCompleted++;
            }
          }

          if (course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100) {
            europeCompleted++;
          }
        });

        setUserProgressData({
          coursesPlayed: worldwideCompleted,
          britainIrelandCompleted,
          europeCompleted,
          usaCompleted,
          worldwideCompleted
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [profile?.id]);
  
  // Update sticky header visibility based on profile card intersection with smooth transition
  useEffect(() => {
    // Add a small delay to create smoother transition
    const timer = setTimeout(() => {
      setShowStickyHeader(!isProfileCardInView);
    }, isProfileCardInView ? 150 : 0); // Delay when card comes back into view for smoother transition

    return () => clearTimeout(timer);
  }, [isProfileCardInView]);

  // Scroll depth tracking for mobile header
  useEffect(() => {
    if (!isMobile || !profile?.id) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const headerHeight = window.innerHeight * 0.55; // 55vh header height
      trackScrollDepth(scrollTop, headerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, profile?.id, trackScrollDepth]);

  const handleMorphTransition = () => {
    closeImmersive();
    // Only scroll if not on activity tab to prevent interference with tab transitions
    if (activeSection !== 'activity') {
      setTimeout(() => {
        window.scrollTo({ top: isMobile ? 200 : 300, behavior: 'smooth' });
      }, 300);
    }
  };

  // Share functionality
  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${profile?.display_name || 'User'}'s Golf Profile`,
      text: `Check out ${profile?.display_name || 'this user'}'s golf journey`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard');
      } catch (clipboardError) {
        toast.error('Unable to share or copy link');
      }
    }
  }, [profile?.display_name]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard');
    } catch (error) {
      toast.error('Unable to copy link');
    }
  }, []);

  if (!profile) {
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        ['--panel-overlap' as any]: 'clamp(16px, 3vh, 28px)'
      }}
    >
      <SwipeToReturnZone onSwipeDown={reopenImmersive}>
        {/* Hero Section */}
        <div 
          className="relative w-full h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] overflow-hidden"
          style={{
            paddingBottom: 'var(--panel-overlap)'
          }}
        >
          {/* Render the responsive immersive header for media-rich backgrounds */}
          <ResponsiveImmersiveHeader 
            mediaItems={mediaItems?.map(item => ({
              id: item.id,
              media_type: item.media_type as string,
              media_url: item.media_url,
              thumbnail_url: item.poster_url || undefined
            })) || []}
            isCollapsed={false}
          />
          
          {/* Empty Responsive Background when no media available */}
          {(!mediaItems || mediaItems.length === 0) && (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--secondary) / 0.2) 100%)`
              }}
            />
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
          
          {/* Header Controls - Show only when appropriate */}
          {!showStickyHeader && (
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
              {/* Left side controls - including immersive button */}
              <div className="flex items-center gap-2">
                {hasImmersiveMedia && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewImmersive()}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Right side controls */}
              <div className="flex items-center gap-2">
                {/* Share Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Share className="h-4 w-4" />
                </Button>
                
                {/* Options Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleShare}>
                      <Share className="mr-2 h-4 w-4" />
                      Share Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    {isOwnProfile && (
                      <>
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMediaManagerOpen(true)}>
                          Manage Media
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
          
          {/* Enhanced Glass Profile Panel positioned absolutely within hero */}
          <div 
            ref={profileCardRef}
            className="absolute left-1/2 transform -translate-x-1/2 w-[calc(100%-2rem)] md:w-[85%] lg:w-[75%] xl:w-[65%] max-w-4xl z-20"
            style={{
              bottom: 'calc(var(--panel-overlap) * -1)'
            }}
          >
            {/* Enhanced Glass Panel with new content */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Panel content with proper spacing */}
              <div className="p-6 md:p-8 relative">
                {/* Mini Profile Card - Top Right */}
                <div className="absolute top-6 right-6 md:top-8 md:right-8">
                  <div 
                    className="bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-lg"
                    style={{ aspectRatio: '3/4', width: '84px', minWidth: '84px' }}
                  >
                    {profile?.profile_photo_url ? (
                      <img
                        src={profile.profile_photo_url}
                        alt={profile.display_name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center">
                        <div className="text-white/70 text-xs font-medium">
                          {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Header Block */}
                <div className="text-center mb-4 mr-24">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {profile?.display_name || 'Unknown User'}
                  </h1>
                  <p className="text-white/80 text-sm md:text-base">
                    @{profile?.username || 'username'}
                  </p>
                  
                  {/* Home Club and Handicap Row */}
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <div className="text-left">
                      <div className="text-white/60 text-xs uppercase tracking-wide">Home Club</div>
                      <div className="text-white font-medium">
                        {profile?.home_club || 'Not specified'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-xs uppercase tracking-wide">Handicap</div>
                      <div className="text-white font-medium">
                        {profile?.eg_handicap_index ? `${profile.eg_handicap_index}` : 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Block */}
                {(profile?.bio || profile?.website) && (
                  <div className="mb-4 text-center">
                    {profile?.bio && (
                      <p className="text-white/90 text-sm md:text-base mb-2 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                    {profile?.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white text-sm underline decoration-white/40 hover:decoration-white transition-colors"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}

                {/* Followed by Section - Placeholder */}
                <div className="mb-4 text-center">
                  <p className="text-white/70 text-sm">
                    Followed by Alice, Bob and 12 others
                  </p>
                </div>

                {/* Slim Stats Row */}
                <div className="flex justify-center items-center gap-6 text-center text-sm">
                  <div>
                    <div className="text-white font-semibold">{posts.length}</div>
                    <div className="text-white/60 text-xs">Posts</div>
                  </div>
                  <div className="w-px h-6 bg-white/20"></div>
                  <div>
                    <div className="text-white font-semibold">{Math.round(averageRating * 100)}</div>
                    <div className="text-white/60 text-xs">Total XP</div>
                  </div>
                  <div className="w-px h-6 bg-white/20"></div>
                  <div>
                    <div className="text-white font-semibold">{followingCount}</div>
                    <div className="text-white/60 text-xs">Following</div>
                  </div>
                  <div className="w-px h-6 bg-white/20"></div>
                  <div>
                    <div className="text-white font-semibold">{followersCount}</div>
                    <div className="text-white/60 text-xs">Followers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to maintain spacing rhythm */}
        <div 
          aria-hidden
          style={{ height: 'calc(var(--panel-overlap) + 16px)' }}
        />

        {/* Sticky Header - Appears when scrolling */}
        {showStickyHeader && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
            <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                  {profile?.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={profile.display_name || 'Profile'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {profile?.display_name || 'Unknown User'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    @{profile?.username || 'username'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleShare}>
                      <Share className="mr-2 h-4 w-4" />
                      Share Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    {isOwnProfile && (
                      <>
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMediaManagerOpen(true)}>
                          Manage Media
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Tabs - positioned below glass panel */}
        <div className="w-full bg-background border-b border-border/40 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 text-sm font-medium transition-colors relative ${
                    activeSection === tab.id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeSection === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area based on active section */}
        <div className="max-w-4xl mx-auto px-4">
          {transitionState === 'transitioning' ? (
            <div className="relative overflow-hidden">
              {/* Outgoing content */}
              <div className={getContentTransitionClass(true)}>
                {getPreviousContent()}
              </div>
              {/* Incoming content */}
              <div className={`absolute inset-0 ${getContentTransitionClass(false)}`}>
                {getCurrentContent()}
              </div>
            </div>
          ) : (
            <div className={getContentTransitionClass()}>
              {getCurrentContent()}
            </div>
          )}
        </div>

        {/* Section-specific content in hero area */}
        {(activeSection === 'courses' || activeSection === 'achievements') && (
          <div className="w-full">
            {activeSection === 'courses' && (
              <div className={`w-full ${getHeroTransitionClass()}`}>
                <CoursesJourney userId={profile?.id || ''} />
              </div>
            )}
            {activeSection === 'achievements' && (
              <div className={`${getHeroTransitionClass()}`}>
                <div className="px-4 md:px-8 py-8">
                  <div className="max-w-6xl mx-auto">
                    <PinnedAchievements 
                      userId={profile?.id}
                      isOwnProfile={isOwnProfile}
                      displayName={profile?.display_name || 'User'}
                      userHandicap={profile?.eg_handicap_index}
                      userProfilePhotoUrl={profile?.profile_photo_url}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SwipeToReturnZone>

      {/* Modals and overlays */}
      <ImmersiveProfileModal
        isOpen={isImmersiveOpen}
        onClose={closeImmersive}
        userId={profile?.id || ''}
        mediaItems={mediaItems?.filter(item => item.media_type === 'video').map(item => ({
          id: item.id,
          media_type: 'video' as const,
          media_url: item.media_url,
          thumbnail_url: item.poster_url || undefined,
          duration: item.duration || 0,
          display_order: item.display_order || 0,
          file_name: item.file_name || undefined,
          created_at: item.created_at
        })) || []}
        initialIndex={currentMediaIndex}
        onCurrentIndexChange={setCurrentMediaIndex}
      />

      {editDialogOpen && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <p className="text-muted-foreground">Profile editing functionality will be implemented here.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {mediaManagerOpen && (
        <MediaManagerModal
          isOpen={mediaManagerOpen}
          onClose={() => setMediaManagerOpen(false)}
          userId={profile?.id || ''}
          mediaItems={mediaItems?.map(item => ({
            id: item.id,
            media_type: item.media_type as 'image' | 'video',
            media_url: item.media_url,
            thumbnail_url: item.poster_url || undefined,
            duration: item.duration || 0,
            display_order: item.display_order || 0,
            file_name: item.file_name || undefined
          })) || []}
          onMediaUpdate={refetchMedia}
        />
      )}
    </div>
  );
};

export default HeroProfileHeader;