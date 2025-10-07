import React, { useState, useEffect } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import NavigationBar from '@/components/bottom-navigation/NavigationBar';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
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
    selectedFile,
    selectedCourse,
    setSelectedCourse,
    openComposerWithFiles,
    closeComposer,
    isSubmitting,
    setIsSubmitting,
    showToast,
    toastMessage,
    hideToast
  } = useSnapModal();

  const [headerActiveTab, setHeaderActiveTab] = useState('Following');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const isMobile = useIsMobile();

  const handleLike = (contentId: string) => {
    // Handle like functionality
    console.log('Liked post:', contentId);
  };

  // Handle post change
  const handleCurrentPostChange = (index: number) => {
    setCurrentPostIndex(index);
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
      
      
      {/* Post Submission Component */}
      <PostSubmissionHandler
        isComposerOpen={isComposerOpen}
        mediaItems={mediaItems}
        selectedFile={selectedFile}
        selectedCourse={selectedCourse}
        onCourseSelect={setSelectedCourse}
        onClose={closeComposer}
        onShowToast={() => {}}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        onAddFiles={openComposerWithFiles}
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