import React, { useState, useEffect } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, UserMinus, Copy, Share, Users, UserCheck } from 'lucide-react';
import { Camera, MapPin, BarChart3 } from 'lucide-react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
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
import AdaptiveGlassHeader from './AdaptiveGlassHeader';
import ResponsiveStatsDisplay from './ResponsiveStatsDisplay';
import ResponsiveGlassCard from './ResponsiveGlassCard';
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

  const handleTabChange = (newTab: string) => {
    if (newTab === activeSection || transitionState !== 'idle') return;
    
    // Determine transition direction based on tab order
    const currentIndex = tabs.findIndex(tab => tab.id === activeSection);
    const newIndex = tabs.findIndex(tab => tab.id === newTab);
    const direction: TransitionDirection = newIndex > currentIndex ? 'right' : 'left';
    
    // Start transition and immediately change the tab
    startTransition(direction, () => {
      onSectionChange?.(newTab);
    });
  };

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
    // Smooth scroll to trigger sticky header
    setTimeout(() => {
      window.scrollTo({ top: isMobile ? 200 : 300, behavior: 'smooth' });
    }, 300);
  };

  // Stats handling
  const handleStatClick = (statType: string) => {
    switch (statType) {
      case 'handicap':
        onSectionChange?.('stats');
        break;
      case 'posts':
      case 'followers':
      case 'following':
        onSectionChange?.('activity');
        break;
      case 'achievements':
        onSectionChange?.('achievements');
        break;
      case 'coursesRated':
      case 'avgRating':
        onSectionChange?.('courses');
        break;
    }
  };

  // Derived values
  const displayName = profile?.display_name || 'User';
  const username = profile?.username || 'user';
  const homeClub = profile?.home_club || 'Home Club';
  const handicap = profile?.eg_handicap_index?.toString() || '--';
  const postsCount = posts.length; // Use actual posts count
  
  // Animation hook for badges
  const badgesAnimation = useStaggeredInView(5, { threshold: 0.1, staggerDelay: 100 });

  // Profile form hook - simplified for now
  const profileFormHook = useProfileForm(profile, onProfileUpdate);

  // Handle video upload
  const handleVideoUpload = async (file: File) => {
    try {
      const result = await uploadVideo(file);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_video_url: result.videoUrl,
          profile_video_thumbnail_url: result.thumbnailUrl,
          has_profile_video: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile video uploaded successfully!");
      onProfileUpdate();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error("Failed to upload video");
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (file: File) => {
    try {
      const result = await uploadImage(file, `profiles/${user?.id}/profile`);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: result.imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile photo uploaded successfully!");

      onProfileUpdate();
      
      console.log('Profile photo updated successfully:', result.imageUrl);
    } catch (error) {
      console.error('Error updating profile photo:', error);
      toast.error("Failed to save photo to profile");
    }
  };

  // Simple refs for animation (removed complex animation hooks)
  const activityRef = React.useRef<HTMLDivElement>(null);
  const top100Ref = React.useRef<HTMLDivElement>(null);
  const badgesRef = React.useRef<HTMLDivElement>(null);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Dynamic height based on active section
  const getBackgroundHeight = () => {
    switch (activeSection) {
      case 'activity': return '1000px';
      case 'top100': return '2200px'; // Fixed height for both mobile and desktop
      case 'handicap': return '2200px'; // Fixed height for both mobile and desktop
      default: return '1300px';
    }
  };

  return (
    <SwipeToReturnZone onSwipeDown={reopenImmersive}>
      {/* Adaptive Glass Header for both desktop and mobile */}
      <AdaptiveGlassHeader
        isVisible={showStickyHeader && !isImmersiveOpen}
        profile={profile}
        stats={{
          handicap: profile?.eg_handicap_index?.toFixed(1) || 'N/A',
          posts: postsCount,
          followers: followersCount,
          following: followingCount,
          ratedCoursesCount,
          averageRating
        }}
        onStatClick={handleStatClick}
      />

      {/* Mobile-Only Full Bleed Profile Layout */}
      {isMobile ? (
        <div className="relative -mt-16">
          {/* Header Image */}
          <div className="relative w-full overflow-hidden" style={{ 
            height: '46vh', 
            minHeight: '320px', 
            maxHeight: '520px' 
          }}>
            {/* Loading state */}
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile?.display_name || 'Profile'}
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ 
                  objectPosition: getMobileCropPosition(profile),
                  objectFit: 'cover'
                }}
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
          </div>
          
          {/* White Background Section with User Info */}
          <div 
            ref={profileCardRef}
            className="bg-white rounded-t-[20px] p-5"
          >
            {/* Name & Handle - Centered */}
            <div className="text-center mb-4">
              <h1 
                className="text-2xl leading-8 font-bold mb-1.5"
                style={{ color: 'hsl(var(--profile-text-primary))' }}
              >
                {displayName}
              </h1>
              <div 
                className="text-base leading-6 font-medium"
                style={{ color: 'hsl(var(--profile-text-secondary))' }}
              >
                @{username}
              </div>
            </div>
            
            {/* Home Club & Handicap Row */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 text-center">
                <div 
                  className="text-xs leading-4 font-semibold mb-1"
                  style={{ color: 'hsl(var(--profile-text-secondary))' }}
                >
                  Home Club
                </div>
                <div 
                  className="text-base leading-6 font-semibold"
                  style={{ color: 'hsl(var(--profile-text-primary))' }}
                >
                  {homeClub}
                </div>
              </div>
              <div className="flex-1 text-center">
                <div 
                  className="text-xs leading-4 font-semibold mb-1"
                  style={{ color: 'hsl(var(--profile-text-secondary))' }}
                >
                  Handicap
                </div>
                <div 
                  className="text-base leading-6 font-semibold"
                  style={{ color: 'hsl(var(--profile-text-primary))' }}
                >
                  {handicap}
                </div>
              </div>
            </div>
            
            {/* Profile Action Buttons */}
            {isOwnProfile && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="py-3 px-2 text-sm leading-4 font-semibold rounded-xl border border-solid transition-colors duration-200 text-center"
                  style={{
                    borderColor: 'hsl(var(--profile-border-button))',
                    color: 'hsl(var(--profile-text-primary))',
                    backgroundColor: 'hsl(var(--profile-card))'
                  }}
                >
                  Edit<br/>Profile
                </button>
                <button
                  onClick={() => setMediaManagerOpen(true)}
                  className="py-3 px-2 text-sm leading-4 font-semibold rounded-xl border border-solid transition-colors duration-200 text-center"
                  style={{
                    borderColor: 'hsl(var(--profile-border-button))',
                    color: 'hsl(var(--profile-text-primary))',
                    backgroundColor: 'hsl(var(--profile-card))'
                  }}
                >
                  Media<br/>Manager
                </button>
                <button
                  onClick={() => previewImmersive()}
                  className="py-3 px-2 text-sm leading-4 font-semibold rounded-xl border border-solid transition-colors duration-200 text-center"
                  style={{
                    borderColor: 'hsl(var(--profile-border-button))',
                    color: 'hsl(var(--profile-text-primary))',
                    backgroundColor: 'hsl(var(--profile-card))'
                  }}
                >
                  Immersive<br/>Preview
                </button>
              </div>
            )}
            
            {/* Stats Tiles - Mobile */}
            <div className="grid grid-cols-4 gap-2">
              {/* Posts */}
              <div 
                className="bg-white rounded-[14px] border border-solid p-2 text-center min-h-[60px] flex flex-col justify-center"
                style={{
                  borderColor: 'hsl(var(--profile-border-tile))',
                  boxShadow: 'var(--profile-shadow-tile)'
                }}
              >
                <div 
                  className="text-lg leading-5 font-bold"
                  style={{ color: 'hsl(var(--profile-text-primary))' }}
                >
                  {postsCount}
                </div>
                <div 
                  className="text-xs leading-4 font-medium"
                  style={{ color: 'hsl(var(--profile-text-secondary))' }}
                >
                  Posts
                </div>
              </div>
              
              {/* XP */}
              <div 
                className="bg-white rounded-[14px] border border-solid p-2 text-center min-h-[60px] flex flex-col justify-center"
                style={{
                  borderColor: 'hsl(var(--profile-border-tile))',
                  boxShadow: 'var(--profile-shadow-tile)'
                }}
              >
                <div 
                  className="text-lg leading-5 font-bold"
                  style={{ color: 'hsl(var(--profile-text-primary))' }}
                >
                  2,500
                </div>
                <div 
                  className="text-xs leading-4 font-medium"
                  style={{ color: 'hsl(var(--profile-text-secondary))' }}
                >
                  Total XP
                </div>
              </div>
              
              {/* Following */}
              <div 
                className="bg-white rounded-[14px] border border-solid p-2 text-center min-h-[60px] flex flex-col justify-center"
                style={{
                  borderColor: 'hsl(var(--profile-border-tile))',
                  boxShadow: 'var(--profile-shadow-tile)'
                }}
              >
                <div 
                  className="text-lg leading-5 font-bold"
                  style={{ color: 'hsl(var(--profile-text-primary))' }}
                >
                  {followingCount}
                </div>
                <div 
                  className="text-xs leading-4 font-medium"
                  style={{ color: 'hsl(var(--profile-text-secondary))' }}
                >
                  Following
                </div>
              </div>
              
              {/* Followers */}
              <div 
                className="bg-white rounded-[14px] border border-solid p-2 text-center min-h-[60px] flex flex-col justify-center"
                style={{
                  borderColor: 'hsl(var(--profile-border-tile))',
                  boxShadow: 'var(--profile-shadow-tile)'
                }}
              >
                <div 
                  className="text-lg leading-5 font-bold"
                  style={{ color: 'hsl(var(--profile-text-primary))' }}
                >
                  {followersCount}
                </div>
                <div 
                  className="text-xs leading-4 font-medium"
                  style={{ color: 'hsl(var(--profile-text-secondary))' }}
                >
                  Followers
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop layout */
        <div className="relative -mt-16">
          {/* Header Image */}
          <div 
            ref={profileCardRef}
            className="relative w-full overflow-hidden" 
            style={{ 
              height: '48vh', 
              minHeight: '320px', 
              maxHeight: '520px' 
            }}
          >
            {/* Loading state */}
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile?.display_name || 'Profile'}
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ 
                  objectPosition: 'center center',
                  objectFit: 'cover'
                }}
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
          </div>
          
          {/* White Background Section with User Info */}
          <div className="bg-white rounded-t-[20px]">
            {/* User Info Container */}
            <div className="mx-auto max-w-2xl p-6">
              {/* Name & Handle - Centered */}
              <div className="text-center mb-6">
                <h1 
                  className="text-3xl leading-10 font-bold mb-2"
                  style={{ color: 'hsl(var(--profile-text-primary))' }}
                >
                  {displayName}
                </h1>
                <div 
                  className="text-lg leading-7 font-medium"
                  style={{ color: 'hsl(var(--profile-text-secondary))' }}
                >
                  @{username}
                </div>
              </div>
              
              {/* Home Club & Handicap Row */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 text-center">
                  <div 
                    className="text-sm leading-5 font-semibold mb-2"
                    style={{ color: 'hsl(var(--profile-text-secondary))' }}
                  >
                    Home Club
                  </div>
                  <div 
                    className="text-lg leading-7 font-semibold"
                    style={{ color: 'hsl(var(--profile-text-primary))' }}
                  >
                    {homeClub}
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div 
                    className="text-sm leading-5 font-semibold mb-2"
                    style={{ color: 'hsl(var(--profile-text-secondary))' }}
                  >
                    Handicap
                  </div>
                  <div 
                    className="text-lg leading-7 font-semibold"
                    style={{ color: 'hsl(var(--profile-text-primary))' }}
                  >
                    {handicap}
                  </div>
                </div>
              </div>
              
              {/* Profile Action Buttons */}
              {isOwnProfile && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => setEditDialogOpen(true)}
                    className="py-4 px-3 text-base leading-5 font-semibold rounded-xl border border-solid transition-colors duration-200 text-center"
                    style={{
                      borderColor: 'hsl(var(--profile-border-button))',
                      color: 'hsl(var(--profile-text-primary))',
                      backgroundColor: 'hsl(var(--profile-card))'
                    }}
                  >
                    Edit<br/>Profile
                  </button>
                  <button
                    onClick={() => setMediaManagerOpen(true)}
                    className="py-4 px-3 text-base leading-5 font-semibold rounded-xl border border-solid transition-colors duration-200 text-center"
                    style={{
                      borderColor: 'hsl(var(--profile-border-button))',
                      color: 'hsl(var(--profile-text-primary))',
                      backgroundColor: 'hsl(var(--profile-card))'
                    }}
                  >
                    Media<br/>Manager
                  </button>
                  <button
                    onClick={() => previewImmersive()}
                    className="py-4 px-3 text-base leading-5 font-semibold rounded-xl border border-solid transition-colors duration-200 text-center"
                    style={{
                      borderColor: 'hsl(var(--profile-border-button))',
                      color: 'hsl(var(--profile-text-primary))',
                      backgroundColor: 'hsl(var(--profile-card))'
                    }}
                  >
                    Immersive<br/>Preview
                  </button>
                </div>
              )}
            </div>
          
            {/* Stats Tiles - Desktop */}
            <div className="max-w-4xl mx-auto px-6 pb-6">
              <div className="grid grid-cols-4 gap-4">
                {/* Posts */}
                <div 
                  className="bg-white rounded-[14px] border border-solid p-4 text-center min-h-[74px] flex flex-col justify-center"
                  style={{
                    borderColor: 'hsl(var(--profile-border-tile))',
                    boxShadow: 'var(--profile-shadow-tile)'
                  }}
                >
                  <div 
                    className="text-xl leading-6 font-bold"
                    style={{ color: 'hsl(var(--profile-text-primary))' }}
                  >
                    {postsCount}
                  </div>
                  <div 
                    className="text-sm leading-5 font-medium"
                    style={{ color: 'hsl(var(--profile-text-secondary))' }}
                  >
                    Posts
                  </div>
                </div>
                
                {/* XP */}
                <div 
                  className="bg-white rounded-[14px] border border-solid p-4 text-center min-h-[74px] flex flex-col justify-center"
                  style={{
                    borderColor: 'hsl(var(--profile-border-tile))',
                    boxShadow: 'var(--profile-shadow-tile)'
                  }}
                >
                  <div 
                    className="text-xl leading-6 font-bold"
                    style={{ color: 'hsl(var(--profile-text-primary))' }}
                  >
                    2,500
                  </div>
                  <div 
                    className="text-sm leading-5 font-medium"
                    style={{ color: 'hsl(var(--profile-text-secondary))' }}
                  >
                    Total XP
                  </div>
                </div>
                
                {/* Following */}
                <div 
                  className="bg-white rounded-[14px] border border-solid p-4 text-center min-h-[74px] flex flex-col justify-center"
                  style={{
                    borderColor: 'hsl(var(--profile-border-tile))',
                    boxShadow: 'var(--profile-shadow-tile)'
                  }}
                >
                  <div 
                    className="text-xl leading-6 font-bold"
                    style={{ color: 'hsl(var(--profile-text-primary))' }}
                  >
                    {followingCount}
                  </div>
                  <div 
                    className="text-sm leading-5 font-medium"
                    style={{ color: 'hsl(var(--profile-text-secondary))' }}
                  >
                    Following
                  </div>
                </div>
                
                {/* Followers */}
                <div 
                  className="bg-white rounded-[14px] border border-solid p-4 text-center min-h-[74px] flex flex-col justify-center"
                  style={{
                    borderColor: 'hsl(var(--profile-border-tile))',
                    boxShadow: 'var(--profile-shadow-tile)'
                  }}
                >
                  <div 
                    className="text-xl leading-6 font-bold"
                    style={{ color: 'hsl(var(--profile-text-primary))' }}
                  >
                    {followersCount}
                  </div>
                  <div 
                    className="text-sm leading-5 font-medium"
                    style={{ color: 'hsl(var(--profile-text-secondary))' }}
                  >
                    Followers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Display - Remove this section as stats are now integrated into the card layout */}
      <div style={{ display: 'none' }}>
        <ResponsiveStatsDisplay
          primaryStats={{
            handicap: profile?.eg_handicap_index?.toFixed(1) || 'N/A',
            posts: postsCount,
            followers: followersCount,
            following: followingCount
          }}
          onStatClick={handleStatClick}
        />
      </div>

      {/* Tab Navigation with Underline Animation - Brand accent styling */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-lg border-b" style={{ borderColor: 'hsl(var(--profile-border-card))' }}>
        <div className="relative">
          <div className={`flex ${isMobile ? 'px-0 mx-3' : 'px-8 max-w-4xl mx-auto'}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative py-4 px-4 text-base font-semibold transition-colors duration-200
                  ${activeSection === tab.id 
                    ? '' 
                    : 'hover:opacity-80'
                  }
                  flex-1 text-center
                `}
                style={{
                  color: activeSection === tab.id 
                    ? 'hsl(var(--profile-accent-primary))'  
                    : 'hsl(var(--profile-text-secondary))'
                }}
              >
                {tab.label}
                
                {/* Animated underline */}
                {activeSection === tab.id && (
                  <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ease-out"
                    style={{
                      backgroundColor: 'hsl(var(--profile-accent-primary))',
                      width: '60%'
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Section with Slide Transitions */}
      <div className="relative min-h-[80vh] overflow-hidden">
        {/* Content Area with Dynamic Class */}
        <div className={getContentTransitionClass()}>
          {/* Hero Section - only for achievements and courses */}
          {(activeSection === 'achievements' || activeSection === 'courses') && (
            <div className={`${isMobile ? 'py-6 px-4' : 'py-8 px-6'} ${getHeroTransitionClass()}`}>
              <div className="max-w-4xl mx-auto">
                {activeSection === 'achievements' && (
                  <PinnedAchievements 
                    achievements={achievements}
                    userDisplayName={profile?.display_name || 'User'}
                    userHandicap={profile?.eg_handicap_index}
                    userProfilePhotoUrl={profile?.profile_photo_url}
                    isCurrentUser={isOwnProfile}
                    onAchievementsPageClick={() => {}}
                  />
                )}
                {activeSection === 'courses' && (
                  <CoursesJourney 
                    userId={profile?.id || ''}
                    isOwnProfile={isOwnProfile}
                    userDisplayName={profile?.display_name}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <div id="main-content">
            {getCurrentContent()}
          </div>
        </div>

        {/* During transition, show the previous content sliding out */}
        {transitionState !== 'idle' && (
          <div className={getContentTransitionClass(true)} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            {/* Hero Section - only for achievements and courses */}
            {(activeSection === 'achievements' || activeSection === 'courses') && (
              <div className={`${isMobile ? 'py-6 px-4' : 'py-8 px-6'} ${getHeroTransitionClass(true)}`}>
                <div className="max-w-4xl mx-auto">
                  {activeSection === 'achievements' && (
                    <PinnedAchievements 
                      achievements={achievements}
                      userDisplayName={profile?.display_name || 'User'}
                      userHandicap={profile?.eg_handicap_index}
                      userProfilePhotoUrl={profile?.profile_photo_url}
                      isCurrentUser={isOwnProfile}
                      onAchievementsPageClick={() => {}}
                    />
                  )}
                  {activeSection === 'courses' && (
                    <CoursesJourney 
                      userId={profile?.id || ''}
                      isOwnProfile={isOwnProfile}
                      userDisplayName={profile?.display_name}
                    />
                  )}
                </div>
              </div>
            )}
            
            {/* Main Content */}
            <div id="main-content-previous">
              {getPreviousContent()}
            </div>
          </div>
        )}
      </div>

      {/* Profile Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(async (data) => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({
                  display_name: data.display_name,
                  username: data.username,
                  home_club: data.home_club,
                  bio: data.bio || null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

              if (error) throw error;

              toast.success("Profile updated successfully!");
              setEditDialogOpen(false);
              onProfileUpdate();
            } catch (error) {
              console.error('Error updating profile:', error);
              toast.error("Failed to update profile");
            }
          })}>
            <ProfileFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              uploadCroppedPhoto={uploadCroppedPhoto}
              handleVideoUpload={handleVideoUpload}
              handleProfilePhotoUpload={handleProfilePhotoUpload}
              profile={profile}
              photoUploading={photoUploading}
              videoUploading={videoUploading}
              getValues={getValues}
              reset={reset}
            />
            <div className="flex gap-3 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isValid}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Immersive Profile Modal */}
      <ImmersiveProfileModal
        isOpen={isImmersiveOpen}
        onClose={handleMorphTransition}
        mediaItems={mediaItems}
        currentIndex={currentMediaIndex}
        onIndexChange={setCurrentMediaIndex}
        profile={profile}
        isOwnProfile={isOwnProfile}
        stats={{
          handicap: profile?.eg_handicap_index?.toFixed(1) || 'N/A',
          posts: postsCount,
          followers: followersCount,
          following: followingCount,
          ratedCoursesCount,
          averageRating
        }}
        onStatClick={handleStatClick}
        onProfileUpdate={onProfileUpdate}
      />

      {/* Media Manager Modal */}
      <MediaManagerModal
        isOpen={mediaManagerOpen}
        onClose={() => setMediaManagerOpen(false)}
        userId={profile?.id || ''}
        mediaItems={mediaItems.map(item => ({
          ...item,
          media_type: item.media_type as 'image' | 'video'
        }))}
        onMediaUpdate={refetchMedia}
      />
    </SwipeToReturnZone>
  );
};

export default HeroProfileHeader;