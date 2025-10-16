import React, { useState, useEffect } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import NavigationBar from '@/components/bottom-navigation/NavigationBar';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useChromeState } from '@/hooks/useChromeState';

import { useInfiniteFollowedPosts } from '@/hooks/useInfiniteFollowedPosts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';

const Clubhouse = () => {
  // Set header variant for clubhouse (glass-dark)
  useHeaderVariant('glass-dark');
  
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  } = useInfiniteFollowedPosts();

  // Navigation handlers
  const { activeTab, handleTabClick } = useNavigationHandlers();
  
  // Composer state management
  const {
    isComposerOpen,
    mediaItems,
    setMediaItems,
    selectedFile,
    caption,
    setCaption,
    isSubmitting,
    showToast,
    toastMessage,
    selectedCourse,
    setSelectedCourse,
    openComposer,
    openComposerWithFiles,
    closeComposer,
    showConfirmationToast,
    hideToast
  } = useSnapModal();


  const [headerActiveTab, setHeaderActiveTab] = useState('Following');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [localSelectedTags, setLocalSelectedTags] = useState<any[]>([]);
  const isMobile = useIsMobile();
  
  // Chrome auto-hide state
  const chromeControls = useChromeState({
    isModalOpen: isComposerOpen,
    disabled: false // Set to true via env var for emergency rollback
  });

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
      // Open composer directly with empty state
      console.log('[DEBUG] Clubhouse: Opening composer directly');
      openComposerWithFiles([]);
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
      
      <ClubhouseHeaderNew 
        activeTab={headerActiveTab} 
        onTabChange={setHeaderActiveTab}
        chromeState={chromeControls.chromeState}
      />

      {/* Main Content - Fullscreen Vertical Feed */}
      <div className="clubhouse-scroll">
        <ClubhouseVerticalFeed
          posts={posts}
          onLike={handleLike}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onCurrentPostChange={handleCurrentPostChange}
          onScroll={chromeControls.handleScroll}
          onTap={chromeControls.handleTap}
          onTouchStart={chromeControls.handleTouchStart}
          onTouchMove={chromeControls.handleTouchMove}
          onTouchEnd={chromeControls.handleTouchEnd}
        />
      </div>
      
      
      {/* Post Submission Handler */}
      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={handleCloseComposer}
        onShowToast={showConfirmationToast}
        isSubmitting={isSubmitting}
        setIsSubmitting={() => {}}
        onMediaChange={setMediaItems}
      />

      <SnapToast
        message={toastMessage}
        isVisible={showToast}
        onHide={hideToast}
      />
    </div>
  );
};

export default Clubhouse;