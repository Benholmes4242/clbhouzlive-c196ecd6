import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { splitName } from '@/utils/name';
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
  
  // Refs for dynamic gap calculation
  const nameBlockRef = useRef<HTMLDivElement | null>(null);
  const metaRowRef = useRef<HTMLDivElement | null>(null);
  const miniCardRef = useRef<HTMLDivElement | null>(null);
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

  // Hook to compute even gap between handle and mini card
  function useEvenGapToMiniCard(
    nameBlockEl: HTMLElement | null,
    metaRowEl: HTMLElement | null,
    miniCardEl: HTMLElement | null
  ) {
    useLayoutEffect(() => {
      if (!nameBlockEl || !metaRowEl || !miniCardEl) return;

      const compute = () => {
        const nameH = nameBlockEl.getBoundingClientRect().height || 0;
        const metaH = metaRowEl.getBoundingClientRect().height || 0;
        const cardH = miniCardEl.getBoundingClientRect().height || 0;

        // target: center meta row in the band from handle bottom → mini card bottom
        let raw = (cardH - nameH - metaH) / 2;

        // clamp (px)
        const gap = Math.max(16, Math.min(raw, 64));

        metaRowEl.style.setProperty('--club-gap', `${Math.round(gap)}px`);
      };

      // initial + on layout changes
      compute();

      // listeners
      const ro = new ResizeObserver(compute);
      ro.observe(nameBlockEl);
      ro.observe(metaRowEl);
      ro.observe(miniCardEl);

      const onResize = () => compute();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);

      // re-run after fonts load (avoids a tiny shift)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(compute).catch(() => {});
      }

      return () => {
        ro.disconnect();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
      };
    }, [nameBlockEl, metaRowEl, miniCardEl]);
  }

  // Wire the hook
  useEvenGapToMiniCard(nameBlockRef.current, metaRowRef.current, miniCardRef.current);

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

  // Stats handling
  const handleStatClick = useCallback((statType: string) => {
    // Prevent scroll behavior when switching tabs via stats
    const currentScrollPosition = window.scrollY;
    
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
    
    // Restore scroll position to prevent jumping
    setTimeout(() => {
      if (window.scrollY !== currentScrollPosition) {
        window.scrollTo(0, currentScrollPosition);
      }
    }, 0);
  }, [onSectionChange]);

  // Derived values - memoized to prevent unnecessary re-calculations
  const displayName = useMemo(() => profile?.display_name || 'User', [profile?.display_name]);
  const username = useMemo(() => profile?.username || 'user', [profile?.username]);
  const homeClub = useMemo(() => profile?.home_club || 'Home Club', [profile?.home_club]);
  
  // Function to wrap text with max 2 words per line
  const wrapHomeClubText = (text: string) => {
    const words = text.split(' ');
    const lines = [];
    for (let i = 0; i < words.length; i += 2) {
      lines.push(words.slice(i, i + 2).join(' '));
    }
    return lines;
  };
  
  const homeClubLines = wrapHomeClubText(homeClub);
  const handicap = profile?.eg_handicap_index?.toString() || '--';
  const postsCount = posts.length; // Use actual posts count
  
  // Animation hook for badges
  const badgesAnimation = useStaggeredInView(5, { threshold: 0.1, staggerDelay: 100 });

  
  // Removed scroll event listeners


  // Achievement ring calculation
  const getAchievementRing = (coursesPlayed: number): AchievementRing => {
    if (coursesPlayed >= 300) {
      return { level: 5, title: "🌈 Club Collector", ringClass: "ring-gradient", color: "gradient", courses: 300 };
    } else if (coursesPlayed >= 200) {
      return { level: 4, title: "🟢 Clubhouse Elite", ringClass: "ring-green", color: "#32CD32", courses: 200 };
    } else if (coursesPlayed >= 100) {
      return { level: 3, title: "💙 Century Club", ringClass: "ring-blue", color: "#1E90FF", courses: 100 };
    } else if (coursesPlayed >= 50) {
      return { level: 2, title: "🥈 The 50 Club", ringClass: "ring-silver", color: "#C0C0C0", courses: 50 };
    } else if (coursesPlayed >= 20) {
      return { level: 1, title: "🟡 The 20 Club", ringClass: "ring-gold", color: "#FFD700", courses: 20 };
    } else {
      return { level: 0, title: "", ringClass: "ring-none", color: "transparent", courses: 0 };
    }
  };

  const achievementRing = getAchievementRing(userProgressData.coursesPlayed);

  const handleVideoUpload = async (file: File) => {
    try {
      const result = await uploadVideo(file);
      
      if (!result.success) {
        toast.error(result.error || "Failed to upload video");
        return;
      }

      // Update profile with video URLs
      const { error } = await supabase
        .from('user_profiles')
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
      console.error('Error updating profile video:', error);
      toast.error("Failed to save video to profile");
    }
  };

  const handleVideoRemove = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          profile_video_url: null,
          profile_video_thumbnail_url: null,
          has_profile_video: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success("Profile video removed successfully!");

      onProfileUpdate();
    } catch (error) {
      console.error('Error removing profile video:', error);
      toast.error("Failed to remove video from profile");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const result = await uploadImage(file);
      
      if (!result.success) {
        toast.error(result.error || "Failed to upload photo");
        return;
      }

      // Update profile with photo URL
      const { error } = await supabase
        .from('user_profiles')
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
                    objectPosition: getMobileCropPosition(profile),
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

            {/* GLASS PANEL — consistent overlap & padding */}
            <section
              ref={profileCardRef}
              className="relative z-20 mx-0 sm:mx-0 md:mx-0 lg:mx-4 rounded-none lg:rounded-2xl border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              style={{
                marginTop: 'calc(var(--panel-overlap) * -1)',
                padding: 'var(--panel-pad-y) var(--panel-pad-x)'
              }}
            >
               <div className="flex flex-col items-center relative">
                   {/* Overhanging mini profile card */}
                    <div
                      className="absolute overflow-hidden rounded-xl border border-white/40 shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
                     style={{
                       top: 'calc(var(--mini-h) * -0.24)',   // 24% overhang
                       right: '8px',                         // anchor 8px from right
                       width: 'var(--mini-w)',
                       height: 'var(--mini-h)'
                     }}
                    onClick={() => openImmersive?.(0)}
                    role="button"
                    aria-label="Open immersive profile"
                  >
                    {profile?.profile_photo_url ? (
                      <img
                        src={profile.profile_photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: (() => {
                            const cx = (profile?.mini_card_crop_x ?? 0) + (profile?.mini_card_crop_width ?? 100) / 2;
                            const cy = (profile?.mini_card_crop_y ?? 0) + (profile?.mini_card_crop_height ?? 100) / 2;
                            return `${cx}% ${cy}%`;
                          })()
                        }}
                        loading="lazy"
                      />
                    ) : null}
                  </div>


                  {/* MOBILE: glass content layout with grid */}
                  <div
                    className="
                      grid
                      grid-cols-[1fr,8px,var(--mini-w)]
                      auto-rows-auto
                      gap-y-4
                    "
                    style={{ marginTop: 'calc(var(--mini-h) * 0.15)' }}
                  >
                    {/* NAME + HANDLE (left column, centered) */}
                    <div className="col-[1] row-[1] flex flex-col items-center text-center">
                      {(() => {
                        const { first, last } = splitName(displayName);
                        return (
                          <>
                            <span className="block text-[clamp(28px,6vw,32px)] font-bold leading-[1.1]">
                              {first}
                            </span>
                            <span className="block text-[clamp(28px,6vw,32px)] font-bold leading-[1.1] mt-2">
                              {last}
                            </span>
                            <span className="mt-2 text-base font-medium text-neutral-600">
                              @{username}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {/* TITLES ROW (golf club & handicap on the SAME line) */}
                    <div className="col-[1] row-[2] flex justify-center mt-4">
                      <div className="text-sm font-semibold text-center">Golf Club</div>
                    </div>
                    <div className="col-[3] row-[2] flex justify-center mt-4">
                      <div className="text-sm font-semibold text-center">Handicap</div>
                    </div>

                    {/* VALUES ROW */}
                    <div className="col-[1] row-[3] flex justify-center mt-2">
                      <div
                        className="
                          text-base
                          leading-[1.4]
                          font-normal
                          text-center
                          max-w-[22ch]
                          break-words
                        "
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {homeClub}
                      </div>
                    </div>

                    <div className="col-[3] row-[3] flex justify-center mt-2">
                      <div className="text-base leading-none font-normal text-center">
                        {handicap ?? '—'}
                      </div>
                    </div>

                    {/* BIO — sits directly UNDER the values row */}
                    <div className="col-[1_/_span_3] row-[4] mt-4">
                      {profile?.bio && (
                        <p 
                          className="m-0 text-base font-normal text-center leading-[1.4] text-neutral-800"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {profile.bio}
                        </p>
                      )}
                      {profile?.website && (
                        <div className="text-center mt-2">
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
                  <div className="w-full grid grid-cols-4 gap-3 text-center mt-6">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-gray-900">{postsCount}</span>
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Posts</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300 pl-3">
                      <span className="text-xl font-bold text-gray-900">2,500</span>
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total XP</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300 pl-3">
                      <span className="text-xl font-bold text-gray-900">{followingCount}</span>
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Following</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300 pl-3">
                      <span className="text-xl font-bold text-gray-900">{followersCount}</span>
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Followers</span>
                    </div>
                  </div>

                  {/* Tab Navigation - pinned to bottom */}
                  <div className="w-full border-t border-gray-300 mt-6 pt-4">
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

               </div>
            </section>
             
             {/* Spacer below for 16px gap before tab content */}
             <div className="h-4" />
           </section>
        </div>
      ) : (
        /* Desktop layout - updated to match mobile design pattern */
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
              className="relative z-20 mx-0 sm:mx-0 md:mx-0 lg:mx-4 rounded-none lg:rounded-2xl border border-white/35 bg-white/10 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              style={{
                marginTop: 'calc(var(--panel-overlap) * -1)',
                padding: 'var(--panel-pad-y) var(--panel-pad-x)'
              }}
            >
               <div className="flex flex-col items-center relative">
                  {/* Overhanging mini profile card */}
                   <div
                     className="absolute rounded-lg overflow-hidden border border-white/40 bg-white/20 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,0.25)] z-10"
                     style={{
                       width: 'var(--mini-w)',
                       height: 'var(--mini-h)',
                       right: '8px',
                       top: 'calc(var(--mini-h) * -0.24)'
                     }}
                    onClick={() => openImmersive?.(0)}
                    role="button"
                    aria-label="Open immersive profile"
                  >
                    {profile?.profile_photo_url ? (
                      <img
                        src={profile.profile_photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: (() => {
                            const cx = (profile?.mini_card_crop_x ?? 0) + (profile?.mini_card_crop_width ?? 100) / 2;
                            const cy = (profile?.mini_card_crop_y ?? 0) + (profile?.mini_card_crop_height ?? 100) / 2;
                            return `${cx}% ${cy}%`;
                          })()
                        }}
                        loading="lazy"
                      />
                    ) : null}
                  </div>


                   {/* Name + handle block, perfectly centered between glass edge and mini card for all devices */}
                   <div
                     className="text-center"
                     style={{
                       width: 'calc(100% - var(--mini-w) - 8px)',
                       marginLeft: '0',
                       marginRight: 'calc(var(--mini-w) + 8px)'
                     }}
                   >
                     <h1 className="font-semibold leading-tight"
                         style={{ fontSize: 'var(--fs-display)' }}>
                       {displayName}
                     </h1>
                     <div className="opacity-70" style={{ fontSize: 'var(--fs-handle)' }}>
                       @{username}
                     </div>
                   </div>

                   {/* Golf Club and Handicap centered with fixed gap (desktop/tablet only) */}
                   <div className="mt-3 flex justify-center items-start gap-6" 
                        style={{
                          width: 'calc(100% - var(--mini-w) - 8px)',
                          marginRight: 'calc(var(--mini-w) + 8px)'
                        }}>
                     {/* Golf Club */}
                     <div className="text-center">
                       <div className="font-semibold" style={{ fontSize: 'var(--fs-label)' }}>Golf Club</div>
                       <div className="text-base text-gray-700">{homeClub}</div>
                     </div>

                     {/* Handicap */}
                     <div className="text-center">
                       <div className="font-semibold" style={{ fontSize: 'var(--fs-label)' }}>Handicap</div>
                       <div className="text-base text-gray-700">{handicap}</div>
                     </div>
                   </div>

                   {/* Bio section - centered with user name */}
                   <div className="mt-6"
                        style={{
                          width: 'calc(100% - var(--mini-w) - 8px)',
                          marginRight: 'calc(var(--mini-w) + 8px)'
                        }}>
                     <div className="text-center">
                       {profile?.bio && (
                         <p className="text-base text-gray-700 mb-3 line-clamp-3 leading-relaxed">
                           {profile.bio}
                         </p>
                       )}
                       {profile?.website && (
                         <div className="text-center">
                           <a 
                             href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-base text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                           >
                             {profile.website.replace(/^https?:\/\//, '')}
                           </a>
                         </div>
                       )}
                     </div>
                   </div>

                  {/* Slim Stats Row */}
                  <div className="w-full grid grid-cols-4 gap-3 text-center mt-5">
                    <div className="flex flex-col">
                      <span className="text-xl font-semibold text-gray-900">{postsCount}</span>
                      <span className="text-sm text-gray-600 uppercase tracking-wide">Posts</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300 pl-3">
                      <span className="text-xl font-semibold text-gray-900">2,500</span>
                      <span className="text-sm text-gray-600 uppercase tracking-wide">Total XP</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300 pl-3">
                      <span className="text-xl font-semibold text-gray-900">{followingCount}</span>
                      <span className="text-sm text-gray-600 uppercase tracking-wide">Following</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-300 pl-3">
                      <span className="text-xl font-semibold text-gray-900">{followersCount}</span>
                      <span className="text-sm text-gray-600 uppercase tracking-wide">Followers</span>
                    </div>
                  </div>

                  {/* Tab Navigation - pinned to bottom */}
                  <div className="w-full border-t border-gray-300 mt-5 pt-5">
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
                            relative py-3 px-3 text-base font-medium transition-colors duration-200
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

              </div>
            </section>
             
             {/* Spacer below to avoid clipping the panel - 16px gap */}
             <div className="h-4" />
           </section>
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


      {/* Legacy ProfileTabs for content rendering */}
      <div style={{ display: 'none' }}>
        <ProfileTabs
          activeTab={activeSection}
          onTabChange={handleTabChange}
          userId={profile?.id || ''}
          userDisplayName={profile?.display_name}
          userHandicap={profile?.eg_handicap_index}
          userProfilePhotoUrl={profile?.profile_photo_url}
          isCurrentUser={isOwnProfile}
          transitionState={transitionState}
        >
        {{
          activity: (
            <div></div> // Content will be rendered separately below
          ),
          courses: (
            <div></div> // Content will be rendered separately below
          ),
          achievements: (
            <AchievementsPane
              userId={profile?.id}
              userDisplayName={profile?.display_name}
              userHandicap={profile?.eg_handicap_index}
              userProfilePhotoUrl={profile?.profile_photo_url}
              isCurrentUser={isOwnProfile}
            />
          ),
          stats: (
            <div></div> // Content will be rendered separately below
          )
        }}
        </ProfileTabs>
      </div>

      {/* Hero Section - Achievements or Courses Journey */}
      <div className="relative">
        {/* During transition, both sections are visible with absolute positioning */}
        {transitionState === 'transitioning' ? (
          <>
            {/* Outgoing section */}
            <div className={`absolute inset-0 w-full ${getHeroTransitionClass(true)}`}>
              {transitionDirection === 'right' ? (
                /* Moving away from current section */
                activeSection === 'activity' ? (
                  <div></div> // Achievements moved to dedicated tab
                ) : activeSection === 'courses' ? (
                  <CoursesJourney 
                    userId={profile?.id}
                    userDisplayName={profile?.display_name || 'User'}
                    isOwnProfile={isOwnProfile}
                  />
                ) : (
                  <div></div> // stats section has no hero content
                )
              ) : (
                /* Moving to current section from right */
                activeSection === 'courses' ? (
                  <CoursesJourney 
                    userId={profile?.id}
                    userDisplayName={profile?.display_name || 'User'}
                    isOwnProfile={isOwnProfile}
                  />
                ) : activeSection === 'stats' ? (
                  <div></div> // stats section has no hero content
                ) : (
                  <div></div> // Achievements moved to dedicated tab
                )
              )}
            </div>
            
            {/* Incoming section */}
            <div className={`relative w-full ${getHeroTransitionClass(false)}`}>
              {transitionDirection === 'right' ? (
                /* Moving to next section */
                activeSection === 'courses' ? (
                  <CoursesJourney 
                    userId={profile?.id}
                    userDisplayName={profile?.display_name || 'User'}
                    isOwnProfile={isOwnProfile}
                  />
                ) : activeSection === 'stats' ? (
                  <div></div> // stats section has no hero content
                ) : (
                  <div></div> // Achievements moved to dedicated tab
                )
              ) : (
                /* Moving to previous section */
                activeSection === 'activity' ? (
                  <div></div> // Achievements moved to dedicated tab
                ) : activeSection === 'courses' ? (
                  <CoursesJourney 
                    userId={profile?.id}
                    userDisplayName={profile?.display_name || 'User'}
                    isOwnProfile={isOwnProfile}
                  />
                ) : (
                  <div></div> // stats section has no hero content
                )
              )}
            </div>
          </>
        ) : (
          /* Normal state - only show active section */
          <>
            {activeSection === 'courses' ? (
              <CoursesJourney 
                userId={profile?.id}
                userDisplayName={profile?.display_name || 'User'}
                isOwnProfile={isOwnProfile}
              />
            ) : activeSection === 'stats' ? (
              // No hero section for handicap tab - achievements are removed
              <div></div>
            ) : (
              <div></div> // Achievements moved to dedicated tab
            )}
          </>
        )}
      </div>

      {/* Content sections with slide transitions */}
      <div className="relative overflow-hidden">
        {/* During transition, both sections are visible with absolute positioning */}
        {transitionState === 'transitioning' ? (
          <>
            {/* Outgoing content */}
            <div className={`absolute inset-0 w-full ${getContentTransitionClass(true)}`}>
              <div role="tabpanel" aria-hidden="true">
                {getPreviousContent()}
              </div>
            </div>
            
            {/* Incoming content */}
            <div className={`relative w-full ${getContentTransitionClass(false)}`}>
              <div role="tabpanel" id={`tabpanel-${activeSection}`} aria-hidden="false">
                {getCurrentContent()}
              </div>
            </div>
          </>
        ) : (
          /* Normal state - only show active section */
          <div className={`
            ${activeSection === 'activity' ? 'px-0 md:px-0 pt-0 pb-8' : 'px-0 md:px-4'}
            ${activeSection === 'courses' ? 'pt-0 pb-8' : ''}
            ${activeSection === 'achievements' || activeSection === 'stats' ? 'pt-0 py-8' : ''}
            ${isMobile && activeSection === 'activity' ? 'pb-4' : ''}
            ${isMobile && activeSection !== 'activity' && activeSection !== 'courses' ? 'py-4' : ''}
          `}>
            <div className={`
              ${activeSection === 'activity' ? 'w-full' : 'md:max-w-[1150px] md:mx-auto'}
            `}>
              <div role="tabpanel" id={`tabpanel-${activeSection}`} aria-labelledby={`tab-${activeSection}`}>
                {getCurrentContent()}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Remove FullscreenMediaModal - handled by individual components */}

      {/* Rest of content sections would continue here... */}
      
      {/* Hidden trigger for header to access edit profile functionality */}
      <button 
        data-edit-profile-trigger 
        className="hidden" 
        onClick={() => setEditDialogOpen(true)}
        aria-hidden="true"
      />
      
      {/* New comprehensive Edit Profile Modal */}
      <ProfileEditDialog
        profile={profile}
        userId={user?.id || ''}
        onProfileUpdate={() => {
          onProfileUpdate();
          setEditDialogOpen(false);
        }}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Compare Progress Modal - Placeholder for now */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setIsCompareModalOpen(false)}>
          <div className="bg-white p-4 rounded-lg">
            <h3>Compare Progress Modal</h3>
            <button onClick={() => setIsCompareModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Immersive Profile Modal */}
      <ImmersiveProfileModal
        isOpen={isImmersiveOpen}
        onClose={closeImmersive}
        onMorphToHeader={handleMorphTransition}
        mediaItems={mediaItems.map(item => ({
          ...item,
          media_type: item.media_type as 'video' | 'image'
        }))}
        userId={profile?.id || ''}
        initialIndex={currentMediaIndex}
        onCurrentIndexChange={setCurrentMediaIndex}
        uploadMode={isOwnProfile}
        onUploadComplete={() => refetchMedia()}
      />


      {/* ProfileModalRouter - Available to all profile visitors for course viewing */}
      <ProfileModalRouter />
    </SwipeToReturnZone>
  );
};

export default HeroProfileHeader;
