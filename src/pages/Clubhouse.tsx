import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CompactHeader from '@/components/header/CompactHeader';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { PageRoot } from '@/components/layout/PageRoot';
import { useInfiniteClubhouseShorts } from '@/hooks/useInfiniteFollowedPosts';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToast } from '@/hooks/use-toast';
import { NewSeasonBanner } from '@/components/feed/NewSeasonBanner';
import { SeasonRecapModal } from '@/components/achievements/SeasonRecapModal';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';
import { useCinemaDimContext } from '@/contexts/CinemaDimContext';
import { cn } from '@/lib/utils';

const Clubhouse = () => {
  // Set header variant for clubhouse (glass-dark)
  useHeaderVariant('glass-dark');
  
  // Cinema Dim: register this page as Clubhouse
  const { setIsClubhousePage, cinemaDim } = useCinemaDimContext();
  
  useEffect(() => {
    setIsClubhousePage(true);
    return () => setIsClubhousePage(false);
  }, [setIsClubhousePage]);
  
  const location = useLocation();
  const clubhouseRootRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Clubhouse: explore feed with short videos only (<120s)
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  } = useInfiniteClubhouseShorts();

  // Navigation handlers
  const { handleTabClick } = useNavigationHandlers();
  
  // Track active video for progress HUD
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  
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
  
  // Track overlay states
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState(false);
  
  // ⚠️ HEADER/FOOTER AUTO-HIDE DISABLED
  // Chrome is always visible on Clubhouse - no hide logic, no timers, no animations
  // Glass creator capsule + right-hand action rail are out of scope

  // Check which posts the user has liked
  const { data: likedPosts } = useQuery({
    queryKey: ['post-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const postIds = posts.map(post => post.id);
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      if (error) {
        console.error('Error fetching liked posts:', error);
        return [];
      }
      
      return data.map(like => like.post_id);
    },
    enabled: !!user?.id && posts.length > 0
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (action === 'like') {
        const { data, error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['post-likes', user?.id], (oldData: string[] | undefined) => {
        if (!oldData) return variables.action === 'like' ? [variables.postId] : [];
        
        if (variables.action === 'like') {
          return [...oldData, variables.postId];
        } else {
          return oldData.filter(id => id !== variables.postId);
        }
      });
    },
    onError: (error) => {
      console.error('Like/unlike error:', error);
      toast({
        title: "Error",
        description: "We couldn't update your like. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleLike = (postId: string) => {
    if (!user?.id) return;
    if (likeMutation.isPending) return; // Prevent duplicate submissions
    
    const isLiked = likedPosts?.includes(postId);
    likeMutation.mutate({
      postId,
      action: isLiked ? 'unlike' : 'like'
    });
  };

  // Handle post change
  const handleCurrentPostChange = (index: number) => {
    setCurrentPostIndex(index);
  };

  const handleCloseComposer = () => {
    closeComposer();
    setLocalSelectedTags([]);
  };

  // Mark body for Clubhouse-specific CSS overrides
  useEffect(() => {
    document.body.classList.add('route-clubhouse');
    return () => document.body.classList.remove('route-clubhouse');
  }, []);

  // No loading state needed - Suspense at route level handles it
  // if (isLoading && posts.length === 0) return null;

  return (
    <PageRoot 
      ref={clubhouseRootRef} 
      className={cn("clubhouse-root", cinemaDim && "cinema-dim")} 
      style={{ "--bg-page": "#0F0F0F", position: 'relative', isolation: 'isolate', zIndex: 0 } as React.CSSProperties}
    >
      {/* Intersection sentinel for header fade-away */}
      <div id="clubhouse-sentinel" className="h-1 w-px absolute top-0 left-0" />
      
      <CompactHeader />

      {/* Main Content - Fullscreen Vertical Feed */}
      <div className="clubhouse-scroll">
        {/* New Season Banner */}
        {user && (
          <div className="px-4 pt-20">
            <NewSeasonBanner />
          </div>
        )}

        {posts.length > 0 ? (
          <ClubhouseVerticalFeed
            posts={posts}
            onLike={handleLike}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onCurrentPostChange={handleCurrentPostChange}
            onActiveVideoRefChange={(ref) => {
              activeVideoRef.current = ref;
            }}
            onCommentsOpenChange={setIsCommentsDrawerOpen}
            onPostDetailsOpen={() => console.log('Post details opened')}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-muted-foreground">Loading posts...</div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-screen text-muted-foreground">
            No posts available
          </div>
        )}
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

      {/* Comments handled inside ClubhouseVerticalFeed with cinematic CommentsPage */}

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
    </PageRoot>
  );
};

export default Clubhouse;