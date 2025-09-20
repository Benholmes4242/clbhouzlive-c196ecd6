import React, { useState, useEffect } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import SnapModal from '@/components/snap/SnapModal';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useMediaHandlers } from '@/components/bottom-navigation/useMediaHandlers';
import { useInfiniteFollowedPosts } from '@/hooks/useInfiniteFollowedPosts';
import { useIsMobile } from '@/hooks/use-mobile';

const Clubhouse = () => {
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  } = useInfiniteFollowedPosts();

  // Navigation handlers
  const { activeTab, handleTabClick } = useNavigationHandlers();
  
  // Snap modal for camera functionality
  const {
    isSnapModalOpen,
    isComposerOpen,
    mediaItems,
    selectedFile,
    caption,
    setCaption,
    isSubmitting,
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openSnapModal,
    closeSnapModal,
    openComposer,
    openComposerWithFiles,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();

  // Media handlers for camera, image, and video
  const { handleCameraClick, handleImageClick, handleVideoClick } = useMediaHandlers(closeSnapModal, openComposer);

  const [headerActiveTab, setHeaderActiveTab] = useState('Following');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [localSelectedTags, setLocalSelectedTags] = useState<any[]>([]);
  const isMobile = useIsMobile();

  const handleLike = (contentId: string) => {
    // Handle like functionality
    console.log('Liked post:', contentId);
  };

  // Handle post change
  const handleCurrentPostChange = (index: number) => {
    setCurrentPostIndex(index);
  };

  // Handle tab clicks including camera action
  const handleTabClickWithCamera = (tab: { id: string; path: string | null; isAction?: boolean }) => {
    console.log('[DEBUG] Clubhouse: handleTabClickWithCamera called with:', tab);
    
    if (tab.isAction && tab.id === 'post') {
      // Handle camera action
      console.log('[DEBUG] Clubhouse: Opening snap modal for camera');
      openSnapModal();
    } else {
      // Handle regular navigation
      console.log('[DEBUG] Clubhouse: Handling regular navigation');
      handleTabClick(tab);
    }
  };

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  // Debug logging for Clubhouse page
  useEffect(() => {
    console.log("[DEBUG] Clubhouse page mounted, headerActiveTab:", headerActiveTab);
  }, [headerActiveTab]);

  // Mark body for Clubhouse-specific CSS overrides
  useEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => document.body.classList.remove('route-clubhouse');
  }, []);

  if (isLoading) {
    return <ClubhouzLoading />;
  }

  return (
    <div className="h-screen bg-transparent overflow-hidden relative clubhouse-root" style={{
      minHeight: '100dvh',
    }}>
      {/* Intersection sentinel for header fade-away */}
      <div id="clubhouse-sentinel" className="h-1 w-px absolute top-0 left-0" />
      
      <ClubhouseHeaderNew activeTab={headerActiveTab} onTabChange={setHeaderActiveTab} />

      {/* Main Content - Fullscreen Vertical Feed */}
      <div className="clubhouse-scroll">
        <ClubhouseVerticalFeed
          posts={posts}
          onLike={handleLike}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onCurrentPostChange={handleCurrentPostChange}
        />
      </div>
      
      {/* Navigation is now handled globally */}
      
      {/* Snap Modal and Post Submission Components */}
      <SnapModal
        isOpen={isSnapModalOpen}
        onClose={closeSnapModal}
        onCameraClick={() => handleCameraClick({})}
        onImageClick={() => handleImageClick({})}
        onVideoClick={() => handleVideoClick({})}
        openComposerWithFiles={openComposerWithFiles}
      />

      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={handleCloseComposer}
        isSubmitting={isSubmitting}
        setIsSubmitting={() => {}}
      />
    </div>
  );
};

export default Clubhouse;