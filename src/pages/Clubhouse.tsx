import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { NewSeasonBanner } from '@/components/feed/NewSeasonBanner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

import { cn } from '@/lib/utils';
import { Compass } from 'lucide-react';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logRouteClubhouse, logLoadingPostsShow, logLoadingPostsHide } from '@/utils/bootTimeline';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useClubhouseSkeletonTiming } from '@/hooks/useClubhouseSkeletonTiming';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { ClubhouseSkeleton } from '@/components/skeletons/ClubhouseSkeleton';
import { ClubhouseTabProvider, useClubhouseTab, type ClubhouseTab } from '@/contexts/ClubhouseTabContext';
import { clubhouseDebug } from '@/debug/clubhouseDebug';
import MobileVideoDebugPanel from '@/components/debug/MobileVideoDebugPanel';

const ClubhouseContent = () => {
  // ============================================================================
  // ALL HOOKS MUST BE DECLARED FIRST - before any early returns
  // ============================================================================
  
  // Rehydration state - show skeleton when app is rehydrating after background
  const { isRehydrating } = useRehydrationSafe();
  
  // Log route entry for boot timeline + debug
  useEffect(() => {
    logRouteClubhouse();
    clubhouseDebug.pageMount();
    
    return () => {
      clubhouseDebug.pageUnmount();
    };
  }, []);
  
  // Set header variant for clubhouse (glass-dark)
  useHeaderVariant('glass-dark');
  
  // Transparent status bar for immersive video bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);
  
  // Use useLayoutEffect for route class to prevent flash
  useLayoutEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => {
      document.body.classList.remove('route-clubhouse');
    };
  }, []);
  
  const location = useLocation();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  
  // Tab state from context
  const tabContext = useClubhouseTab();
  const activeTab = tabContext?.activeTab ?? 'foryou';
  const setActiveTab = tabContext?.setActiveTab ?? (() => {});
  const isBusinessActor = tabContext?.isBusinessActor ?? false;
  const prevTabRef = useRef(activeTab);
  
  // Skeleton timing for smooth loading experience
  const { 
    skeletonVisible, 
    skeletonMode, 
    signalFirstFrameReady 
  } = useClubhouseSkeletonTiming(false); // No posts yet — integration comes later
  
  // Reset scroll position when tab changes
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      clubhouseDebug.tabChange(prevTabRef.current, activeTab);
      if (feedContainerRef.current) {
        feedContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  // Navigation handlers
  const { handleTabClick } = useNavigationHandlers();
  
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

  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [localSelectedTags, setLocalSelectedTags] = useState<any[]>([]);
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // Season Recap Modal
  const { data: seasonRecap } = useSeasonRecap(user?.id);
  const [showRecapModal, setShowRecapModal] = React.useState(false);

  React.useEffect(() => {
    if (seasonRecap) {
      setShowRecapModal(true);
    }
  }, [seasonRecap]);

  // ============================================================================
  // EARLY RETURNS - Safe now that ALL hooks are declared above
  // ============================================================================
  
  // Show skeleton during rehydration
  if (isRehydrating) {
    return <ClubhouseSkeleton />;
  }

  // ============================================================================
  // EVENT HANDLERS (not hooks, can be after early returns)
  // ============================================================================

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  return (
    <PageRoot 
      ref={clubhouseRootRef} 
      className="clubhouse-root" 
      style={{ 
        "--bg-page": "#0F0F0F", 
        position: 'relative', 
        isolation: 'isolate', 
        zIndex: 0
      } as React.CSSProperties}
    >
      {/* Skeleton Shimmer - Overlays content until first frame is ready */}
      <ClubhouseSkeletonShimmer 
        isVisible={skeletonVisible} 
        isStatic={skeletonMode === 'static'} 
      />

      {/* Floating top bar: Tab Toggle + Search + Profile Pill */}
      <ClubhouseTopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isBusinessActor={isBusinessActor}
        user={user}
      />

      {/* Main Content - Feed area (blank until integration brief) */}
      <div className="clubhouse-scroll relative" ref={feedContainerRef}>
        
        {/* New Season Banner */}
        {user && (
          <div className="px-4 pt-20">
            <NewSeasonBanner />
          </div>
        )}

        {/* TODO: Integrate new media player feed here */}
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-lg font-semibold text-white">Feed loading...</p>
          <p className="text-sm text-white/50 mt-2">
            New media engine coming soon
          </p>
        </div>
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

      {/* Season Recap Modal */}
      {seasonRecap && user && (
        <SeasonRecapModal
          isOpen={showRecapModal}
          onClose={() => setShowRecapModal(false)}
          seasonName={seasonRecap.seasonName}
          finalRank={seasonRecap.finalRank}
          finalXP={seasonRecap.finalXP}
          rewardTier={seasonRecap.rewardTier}
          seasonId={seasonRecap.seasonId}
          userId={user.id}
        />
      )}

      {/* Mobile Video Debug Panel - Only visible when MOBILE_VIDEO_DEBUG is true */}
      <MobileVideoDebugPanel />
    </PageRoot>
  );
};

// Wrap with tab provider
const Clubhouse = () => (
  <ClubhouseTabProvider>
    <ClubhouseContent />
  </ClubhouseTabProvider>
);

export default Clubhouse;