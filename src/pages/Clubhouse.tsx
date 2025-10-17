import React, { useState, useEffect, useMemo } from 'react';
import ClubhouzLoading from '@/components/ClubhouzLoading';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import NavigationBar from '@/components/bottom-navigation/NavigationBar';
import ClubhouseVerticalFeed from '@/components/clubhouse/ClubhouseVerticalFeed';
import PostSubmissionHandler from '@/components/bottom-navigation/PostSubmissionHandler';
import SnapToast from '@/components/snap/SnapToast';
import { useNavigationHandlers } from '@/components/bottom-navigation/useNavigationHandlers';
import { useSnapModal } from '@/hooks/useSnapModal';
import { useChromeState } from '@/hooks/useChromeState';
import { useChromeAnchors } from '@/hooks/useChromeAnchors';
import { EngagementRailOverlay } from '@/components/clubhouse/EngagementRailOverlay';
import ClubTagPillOverlay from '@/components/clubhouse/ClubTagPillOverlay';
import { useInfiniteFollowedPosts } from '@/hooks/useInfiniteFollowedPosts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHeaderVariant } from '@/hooks/useHeaderVisibility';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import CommentsModal from '@/components/posts/CommentsModal';

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
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const isMobile = useIsMobile();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  
  // Chrome auto-hide state
  const chromeControls = useChromeState({
    isModalOpen: isComposerOpen,
    disabled: false // Set to true via env var for emergency rollback
  });
  
  // Chrome anchors for dynamic re-positioning
  useChromeAnchors();

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
    }
  });

  const handleLike = (postId: string) => {
    if (!user?.id) return;
    
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

  const handleComment = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsModalOpen(true);
  };

  const handleShare = () => {
    console.log('Share clicked');
  };

  // Compute active post data for the overlay
  const activePost = useMemo(() => {
    const post = posts[currentPostIndex];
    if (!post) return null;

    const currentMedia = post.media?.[0] || { media_type: post.type };
    
    return {
      id: post.id,
      isLiked: likedPosts?.includes(post.id) ?? false,
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      isVideo: currentMedia.media_type === 'video',
      course: post.golfCourse || null,
    };
  }, [posts, currentPostIndex, likedPosts]);

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

      {/* Global Engagement Rail Overlay */}
      <EngagementRailOverlay
        activePost={activePost}
        onLike={() => activePost && handleLike(activePost.id)}
        onComment={() => activePost && handleComment(activePost.id)}
        onShare={handleShare}
      />

      {/* Club course tag pill overlay, follows header */}
      <ClubTagPillOverlay course={activePost?.course ?? null} />
      
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

      {/* Comments Modal */}
      {commentsModalOpen && selectedPostId && (
        <CommentsModal
          isOpen={commentsModalOpen}
          postId={selectedPostId}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedPostId('');
          }}
        />
      )}
    </div>
  );
};

export default Clubhouse;