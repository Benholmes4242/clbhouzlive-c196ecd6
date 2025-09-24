import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, UserMinus, Copy, Share, Users, UserCheck, MoreVertical } from 'lucide-react';
import { Camera, MapPin, BarChart3, ExternalLink } from 'lucide-react';
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

  // CSS variable for consistent overlap across devices
  useEffect(() => {
    document.documentElement.style.setProperty('--panel-overlap', 'clamp(16px, 3vh, 28px)');
  }, []);

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
  const [postsCount, setPostsCount] = useState(0);
  const [totalXP, setTotalXP] = useState(2500); // Mock data for now
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

        // Fetch posts count - using course_ratings as proxy for now
        const { count: postsCount, error: postsError } = await supabase
          .from('course_ratings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
        } else {
          setPostsCount(postsCount || 0);
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
  };

  // Simple form state management
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    website: profile?.website || '',
    home_club: profile?.home_club || '',
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Add save logic here
    setSaving(false);
  };

  // Profile form submission
  const handleProfileFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSave();
      setEditDialogOpen(false);
      onProfileUpdate();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleStatClick = (statType: string) => {
    // Handle stat clicks if needed
    console.log('Stat clicked:', statType);
  };

  // Calculate values for display
  const displayName = profile?.display_name || 'User Name';
  const username = profile?.username || 'username';
  const homeClub = profile?.home_club || 'Home Club';
  const handicap = profile?.eg_handicap_index?.toFixed(1) || '4';
  const bio = profile?.bio || '';
  const website = profile?.website || '';

  // Extract domain from website URL
  const getWebsiteDomain = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Mock "followed by" data - in production this would come from the backend
  const followedByUsers = ['Alice Johnson', 'Bob Smith']; // Mock data
  const followedByText = followedByUsers.length > 0 
    ? `Followed by ${followedByUsers.slice(0, 2).join(', ')}${followedByUsers.length > 2 ? ' and others' : ''}`
    : '';

  if (!profile) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <SwipeToReturnZone onSwipeDown={handleMorphTransition}>
      <div className="relative w-full">
        {/* Hero Cover Photo */}
        <section 
          className="relative w-full overflow-hidden"
          style={{ 
            height: isMobile ? '55vh' : '56vh',
            paddingBottom: 'var(--panel-overlap)'
          }}
        >
          <div className="absolute inset-0">
            {/* Loading state */}
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile?.display_name || 'Profile'}
                className="h-full w-full object-cover"
                style={{ 
                  objectPosition: 'center center',
                  objectFit: 'cover'
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
        </section>

        {/* Extended Glass Panel */}
        <div 
          ref={profileCardRef}
          className="relative -mt-[var(--panel-overlap)] mx-auto z-10"
          style={{ 
            width: isMobile ? '90%' : '100%',
            maxWidth: isMobile ? 'none' : '600px'
          }}
        >
          <div className="
            border border-white/35
            bg-white/35 backdrop-blur-xl
            shadow-[0_10px_30px_rgba(0,0,0,0.15)]
            rounded-lg overflow-hidden
          ">
            <div className="px-6 py-8 md:px-8 md:py-10 relative">
              {/* Three dots menu - positioned absolutely on right */}
              {isOwnProfile && (
                <div className="absolute top-6 right-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full transition-colors duration-300 hover:bg-black/10 text-gray-700 hover:text-gray-900">
                        <MoreVertical size={20} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                      <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMediaManagerOpen(true)}>
                        Media Manager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => previewImmersive()}>
                        Immersive Preview
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Mini Profile Card - top-right */}
              <div className="absolute top-6 right-16 md:right-20">
                <div 
                  className="rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm shadow-sm overflow-hidden"
                  style={{
                    width: isMobile ? '84px' : '112px',
                    height: isMobile ? '112px' : '149px', // 3:4 aspect ratio
                  }}
                >
                  {profile?.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={`${displayName}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-lg md:text-xl">
                        {displayName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Block */}
              <div className="text-center space-y-2 mb-10">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {displayName}
                </h1>
                <p className="text-base md:text-lg text-gray-700">
                  @{username}
                </p>
                
                {/* Club + Handicap side by side */}
                <div className="flex items-center justify-center gap-8 md:gap-12 mt-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-700">{homeClub}</div>
                    <div className="text-xs text-gray-500">Golf Club</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-700">Handicap</div>
                    <div className="text-2xl font-semibold text-gray-900">{handicap}</div>
                  </div>
                </div>
              </div>

              {/* Bio Block */}
              {(bio || website || followedByText) && (
                <div className="space-y-3 mb-6">
                  {bio && (
                    <p className="text-sm text-gray-700 text-center line-clamp-2">
                      {bio}
                    </p>
                  )}
                  
                  {website && (
                    <div className="text-center">
                      <button
                        onClick={() => window.open(website.startsWith('http') ? website : `https://${website}`, '_blank')}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded transition-colors"
                      >
                        <span>{getWebsiteDomain(website)}</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                  
                  {followedByText && (
                    <p className="text-xs text-gray-600 text-center">
                      {followedByText}
                    </p>
                  )}
                </div>
              )}

              {/* Slim Stats Row */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{postsCount}</div>
                  <div className="text-xs text-gray-600">Posts</div>
                </div>
                <div className="border-l border-gray-300/50 pl-4">
                  <div className="text-lg font-semibold text-gray-900">{totalXP.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Total XP</div>
                </div>
                <div className="border-l border-gray-300/50 pl-4">
                  <div className="text-lg font-semibold text-gray-900">{followingCount}</div>
                  <div className="text-xs text-gray-600">Following</div>
                </div>
                <div className="border-l border-gray-300/50 pl-4">
                  <div className="text-lg font-semibold text-gray-900">{followersCount}</div>
                  <div className="text-xs text-gray-600">Followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer after panel */}
        <div style={{ height: 'var(--panel-overlap)' }} />

        {/* Tab Navigation with Orange Underline */}
        <div className="relative z-40 bg-white border-b border-gray-200 mt-4">
          <div className="relative" role="tablist" aria-label="Profile sections">
            <div className={`flex ${isMobile ? 'px-4' : 'px-8 max-w-4xl mx-auto'}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={activeSection === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={activeSection === tab.id ? 0 : -1}
                  className={`
                    relative py-4 px-4 text-base font-medium transition-colors duration-200
                    ${activeSection === tab.id 
                      ? 'text-gray-900' 
                      : 'text-gray-600 hover:text-gray-800'
                    }
                    flex-1 text-center focus:outline-none
                  `}
                >
                  {tab.label}
                  {/* Orange underline for active tab */}
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
        </div>

        {/* Content Area */}
        <div className="relative min-h-screen bg-white">
          {/* Hero-level content for certain sections */}
          {(activeSection === 'achievements' || activeSection === 'courses') && (
            <div 
              className={`
                relative z-20 min-h-[40vh] flex items-center justify-center
                ${getHeroTransitionClass()}
                ${isMobile ? 'px-4 py-8' : 'px-8 py-12'}
              `}
            >
              {activeSection === 'achievements' && (
                <div className="text-center py-8">
                  <h2 className="text-xl font-semibold">Achievements</h2>
                  <p className="text-gray-600 mt-2">Achievement data will be displayed here</p>
                </div>
              )}
              {activeSection === 'courses' && (
                <CoursesJourney userId={profile.id} />
              )}
            </div>
          )}

          {/* Main content section */}
          <div 
            className={`
              relative z-10
              ${getContentTransitionClass()}
            `}
            role="tabpanel"
            id={`tabpanel-${activeSection}`}
            aria-labelledby={`tab-${activeSection}`}
          >
            {getCurrentContent()}
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileFormSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Immersive Profile Modal */}
      {/* Immersive modal placeholder */}

      {/* Media Manager Modal */}
      <MediaManagerModal
        isOpen={mediaManagerOpen}
        onClose={() => setMediaManagerOpen(false)}
        userId={profile?.id || ''}
        mediaItems={mediaItems.filter(item => item.media_type === 'video')}
        onMediaUpdate={refetchMedia}
      />

      {/* ProfileModalRouter - Available to all profile visitors for course viewing */}
      <ProfileModalRouter />
    </SwipeToReturnZone>
  );
};

export default HeroProfileHeader;