import React, { useState, useEffect } from 'react';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useStaggeredInView } from '@/hooks/useInViewAnimation';
import { useScrollPerformance } from '@/hooks/usePerformanceOptimizations';
import { useTabSlideTransition, TransitionDirection } from '@/hooks/useTabSlideTransition';
import { useIsMobile } from '@/hooks/use-mobile';
import { useActivityPosts } from '../hooks/useActivityPosts';
import { ActivityPost } from '../types/ActivityTypes';
import { usePostViewer } from '@/hooks/usePostViewer';
import { useImmersiveProfile } from '@/hooks/useImmersiveProfile';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';

import SwipeToReturnZone from '../SwipeToReturnZone';
import ProfileVisualHeader from './ProfileVisualHeader';
import ProfileStatsSection from './ProfileStatsSection';
import ProfileTabNavigation from './ProfileTabNavigation';
import ProfileContentRenderer from './ProfileContentRenderer';
import ProfileModals from './ProfileModals';
import ProfileTabs from '../ProfileTabs';
import { useProfileHandlers } from './hooks/useProfileHandlers';

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

interface ProfileHeaderContainerProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onProfileUpdate: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const ProfileHeaderContainer = ({ 
  profile, 
  isOwnProfile,
  onProfileUpdate,
  activeSection = 'activity',
  onSectionChange
}: ProfileHeaderContainerProps) => {
  const { user } = useSupabaseSession();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // Analytics tracking
  const { trackScrollDepth } = useProfileAnalytics(profile?.id);

  // Profile handlers
  const {
    handleVideoUpload,
    handleVideoRemove,
    handlePhotoUpload,
    handleMorphTransition,
    videoUploading,
    photoUploading
  } = useProfileHandlers(user, onProfileUpdate);

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
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    rootMargin: '-20px 0px'
  });

  // Tab transition functionality
  const {
    transitionState,
    transitionDirection,
    startTransition,
    isTransitioning
  } = useTabSlideTransition();

  const [postsCount, setPostsCount] = useState(0);

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
  const { isOpen, currentPost, allUserPosts: viewerPosts, openPostViewer, closePostViewer } = usePostViewer({ source: 'profile' });
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);

  // Auto-open immersive mode for other users when they have media
  useEffect(() => {
    if (!isOwnProfile && hasImmersiveMedia && shouldAutoOpen && !isImmersiveOpen) {
      const timer = setTimeout(() => {
        openImmersive();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasImmersiveMedia, shouldAutoOpen, isOwnProfile, isImmersiveOpen, openImmersive]);

  // Update sticky header visibility based on profile card visibility
  useEffect(() => {
    setShowStickyHeader(!isProfileCardInView);
  }, [isProfileCardInView]);

  // Fetch posts count
  useEffect(() => {
    const fetchPostsCount = async () => {
      if (!profile?.id) return;

      try {
        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id);

        if (error) {
          console.error('Error fetching posts count:', error);
          return;
        }

        setPostsCount(count || 0);
      } catch (error) {
        console.error('Error fetching posts count:', error);
      }
    };

    fetchPostsCount();
  }, [profile?.id]);

  // Fetch user progress and stats
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!profile?.id) return;

      try {
        const [followersResponse, followingResponse] = await Promise.all([
          supabase.from('user_follows').select('id', { count: 'exact' }).eq('following_id', profile.id),
          supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', profile.id)
        ]);

        // Mock progress data for now since RPC might not be available
        setUserProgressData({
          coursesPlayed: 0,
          britainIrelandCompleted: 0,
          europeCompleted: 0,
          usaCompleted: 0,
          worldwideCompleted: 0
        });

        setFollowersCount(followersResponse.count || 0);
        setFollowingCount(followingResponse.count || 0);
      } catch (error) {
        console.error('Error fetching user progress:', error);
      }
    };

    fetchUserProgress();
  }, [profile?.id]);

  const handleTabChange = (tabId: string) => {
    startTransition('right', () => {
      onSectionChange?.(tabId);
    });
  };

  const handleStatClick = (statType: string) => {
    console.log('Stat clicked:', statType);
    if (statType === 'compare') {
      setIsCompareModalOpen(true);
    }
  };

  return (
    <SwipeToReturnZone onSwipeDown={() => {}}>
      {/* Visual Header Section */}
      <ProfileVisualHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        profileCardRef={profileCardRef}
        hasImmersiveMedia={hasImmersiveMedia}
        onPreviewImmersive={previewImmersive}
        onEditProfile={() => setEditDialogOpen(true)}
        onMediaManager={() => setMediaManagerOpen(true)}
      />

      {/* Stats Display */}
      <ProfileStatsSection
        profile={profile}
        postsCount={postsCount}
        followersCount={followersCount}
        followingCount={followingCount}
        onStatClick={handleStatClick}
      />

      {/* Tab Navigation */}
      <ProfileTabNavigation
        activeSection={activeSection}
        onTabChange={handleTabChange}
      />

      {/* Legacy ProfileTabs for content rendering (hidden) */}
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
          activity: <div></div>,
          courses: <div></div>,
          achievements: <div></div>,
          stats: <div></div>
        }}
        </ProfileTabs>
      </div>

      {/* Content Renderer */}
      <ProfileContentRenderer
        activeSection={activeSection}
        profile={profile}
        isOwnProfile={isOwnProfile}
        onSectionChange={onSectionChange}
        transitionState={transitionState}
        transitionDirection={transitionDirection}
      />
      
      {/* All Modals */}
      <ProfileModals
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        profile={profile}
        user={user}
        onProfileUpdate={onProfileUpdate}
        isPostViewerOpen={isOpen}
        currentPost={currentPost}
        allUserPosts={viewerPosts}
        closePostViewer={closePostViewer}
        isCompareModalOpen={isCompareModalOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
        isImmersiveOpen={isImmersiveOpen}
        closeImmersive={closeImmersive}
        handleMorphTransition={handleMorphTransition}
        mediaItems={mediaItems}
        currentMediaIndex={currentMediaIndex}
        setCurrentMediaIndex={setCurrentMediaIndex}
        refetchMedia={refetchMedia}
        mediaManagerOpen={mediaManagerOpen}
        setMediaManagerOpen={setMediaManagerOpen}
      />
    </SwipeToReturnZone>
  );
};

export default ProfileHeaderContainer;