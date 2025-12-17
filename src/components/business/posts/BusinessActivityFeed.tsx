/**
 * BusinessActivityFeed - Premium activity feed with Activity/Tagged sub-tabs
 * Phase 1-6 implementation for business profile posts
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { useBusinessTaggedPosts, useHideTaggedPost } from '@/hooks/useBusinessTaggedPosts';
import { useRealtimeBusinessPosts } from '@/hooks/useRealtimeBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { useActiveActor } from '@/context/ActiveActorContext';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { useGridAutoplay } from '@/hooks/useGridAutoplay';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Plus, Users, RefreshCw } from 'lucide-react';
import BusinessPostCard from './BusinessPostCard';
import TaggedPostCard from './TaggedPostCard';
import { toast } from 'sonner';

interface BusinessActivityFeedProps {
  businessId: string;
  businessName?: string;
  businessLogo?: string | null;
  followerCount?: number;
  membership: BusinessMembership | null;
}

type FeedTab = 'activity' | 'tagged';
type FilterType = 'all' | 'videos' | 'images';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Posts' },
  { key: 'videos', label: 'Videos' },
  { key: 'images', label: 'Images' },
];

export function BusinessActivityFeed({
  businessId,
  businessName,
  businessLogo,
  followerCount = 0,
  membership,
}: BusinessActivityFeedProps) {
  const { data: posts, isLoading: postsLoading, error: postsError } = useBusinessPosts(businessId);
  const { data: taggedPosts, isLoading: taggedLoading, error: taggedError, refetch: refetchTagged } = useBusinessTaggedPosts(businessId);
  useRealtimeBusinessPosts(businessId);
  const { setActiveActor, availableActors } = useActiveActor();
  const { submitPost } = useOptimisticPostSubmission();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { hidePost } = useHideTaggedPost(businessId);

  const [feedTab, setFeedTab] = useState<FeedTab>('activity');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMedia, setComposerMedia] = useState<ComposerMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerVideo, playingIds } = useGridAutoplay({
    maxPlaying: 2,
    visibilityThreshold: 0.6,
    preloadMargin: 300,
  });

  const canManage = membership?.canManage ?? false;

  // Sort posts: pinned first, then by date
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    const now = new Date();
    return [...posts].sort((a, b) => {
      // Check if pinned and not expired
      const aIsPinned = a.is_pinned && (!a.pinned_until || new Date(a.pinned_until) > now);
      const bIsPinned = b.is_pinned && (!b.pinned_until || new Date(b.pinned_until) > now);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [posts]);

  // Filter posts based on media type
  const filteredPosts = useMemo(() => {
    const source = feedTab === 'activity' ? sortedPosts : (taggedPosts || []);
    return source.filter((post) => {
      if (activeFilter === 'all') return true;
      const hasVideo = post.post_media?.some((m) => m.media_type === 'video');
      const hasImage = post.post_media?.some((m) => m.media_type === 'image');
      if (activeFilter === 'videos') return hasVideo;
      if (activeFilter === 'images') return hasImage;
      return true;
    });
  }, [feedTab, sortedPosts, taggedPosts, activeFilter]);

  const handleCreatePost = useCallback(() => {
    const businessActor = availableActors.find(
      (a) => a.type === 'business' && a.id === businessId
    );
    if (businessActor) {
      setActiveActor(businessActor);
    }
    setIsComposerOpen(true);
  }, [businessId, availableActors, setActiveActor]);

  const handleComposerSubmit = useCallback(
    async (data: any) => {
      if (!user) return;
      setIsSubmitting(true);

      await submitPost({
        user,
        content: data.caption || '',
        mediaFiles: data.files || [],
        mediaItems: data.mediaItems,
        selectedTags: [],
        courseInfo: data.selectedCourse,
        studioEditsByMediaId: data.studioEditsByMediaId,
        actorType: 'business',
        actorId: businessId,
        onSuccess: () => {
          setIsComposerOpen(false);
          setComposerMedia([]);
          setIsSubmitting(false);
          queryClient.invalidateQueries({ queryKey: ['actor-posts', 'business', businessId] });
          queryClient.invalidateQueries({ queryKey: ['actor-posts-count', 'business', businessId] });
        },
        onError: () => {
          setIsSubmitting(false);
        },
      });
    },
    [user, businessId, submitPost, queryClient]
  );

  const handleComposerClose = useCallback(() => {
    setIsComposerOpen(false);
    setComposerMedia([]);
  }, []);

  const handleHideTaggedPost = useCallback(async (postId: string) => {
    try {
      await hidePost(postId);
      queryClient.invalidateQueries({ queryKey: ['business-tagged-posts', businessId] });
      toast.success('Post hidden from Tagged');
    } catch (error) {
      toast.error('Failed to hide post');
    }
  }, [hidePost, businessId, queryClient]);

  const isLoading = feedTab === 'activity' ? postsLoading : taggedLoading;
  const error = feedTab === 'activity' ? postsError : taggedError;

  if (isLoading) {
    return (
      <div className="space-y-4 px-4">
        {/* Sub-tabs skeleton */}
        <div className="flex justify-center py-2 gap-4">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
        {/* Filter pills skeleton */}
        <div className="flex justify-center py-2">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>
        {/* Post cards skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-sq-md border border-border/50 overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-sq-sm bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-64 bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground mb-4">Failed to load posts.</p>
        <button
          onClick={() => feedTab === 'tagged' ? refetchTagged() : undefined}
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs: Activity / Tagged */}
      <div className="flex justify-center border-b border-border/50 bg-white">
        <button
          onClick={() => setFeedTab('activity')}
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            feedTab === 'activity'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Activity
          {feedTab === 'activity' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setFeedTab('tagged')}
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            feedTab === 'tagged'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Tagged
          {feedTab === 'tagged' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      {/* Controls container */}
      <div className="flex flex-col items-center gap-[10px] py-3">
        {/* Filter pills */}
        <div className="w-full max-w-[520px] mx-auto flex justify-center gap-2 px-4">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeFilter === key
                  ? 'bg-[#01754F] text-white'
                  : 'bg-white text-foreground border border-border hover:bg-muted/50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Create post CTA - only on Activity tab for admins */}
        {feedTab === 'activity' && canManage && (
          <div className="w-full max-w-[520px] mx-auto px-4">
            <button
              onClick={handleCreatePost}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'min-h-[46px] rounded-sq-md',
                'bg-white border border-border/60',
                'text-foreground text-sm font-medium',
                'shadow-sm hover:shadow-md',
                'transition-all duration-150',
                'active:scale-[0.98] active:shadow-sm'
              )}
            >
              <Plus className="h-4 w-4" />
              Create post
            </button>
          </div>
        )}
      </div>

      {/* Feed content */}
      {filteredPosts.length === 0 ? (
        <EmptyState 
          tab={feedTab} 
          filter={activeFilter}
          canManage={canManage}
          businessName={businessName}
          onCreatePost={handleCreatePost}
        />
      ) : (
        <div
          className="-mx-5 px-0 mt-3"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div className="flex flex-col gap-3 md:gap-4 py-3 md:py-4">
            {feedTab === 'activity' ? (
              filteredPosts.map((post, index) => (
                <BusinessPostCard
                  key={post.id}
                  post={post as BusinessPost}
                  businessId={businessId}
                  businessName={businessName}
                  businessLogo={businessLogo}
                  followerCount={followerCount}
                  canManage={canManage}
                  registerVideo={registerVideo}
                  isPlaying={playingIds.has(post.id)}
                  videoIndex={index}
                />
              ))
            ) : (
              filteredPosts.map((post) => (
                <TaggedPostCard
                  key={post.id}
                  post={post as any}
                  canManage={canManage}
                  onHide={handleHideTaggedPost}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Composer Modal */}
      <EnhancedCreateMomentModalCinematic
        isOpen={isComposerOpen}
        onClose={handleComposerClose}
        onSubmit={handleComposerSubmit}
        isSubmitting={isSubmitting}
        mediaItems={composerMedia}
        onMediaChange={setComposerMedia}
        initialActorOverride={{ type: 'business', id: businessId }}
      />
    </div>
  );
}

// Empty state component
function EmptyState({
  tab,
  filter,
  canManage,
  businessName,
  onCreatePost,
}: {
  tab: FeedTab;
  filter: FilterType;
  canManage: boolean;
  businessName?: string;
  onCreatePost: () => void;
}) {
  // Filter-specific empty states
  if (filter === 'videos') {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#EDEFF2' }}>
          <ImageIcon className="h-8 w-8 text-[#97A1AA]" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">No videos yet</p>
        <p className="text-sm text-muted-foreground">
          {tab === 'activity' ? 'Share video content to engage your followers.' : 'No video posts have tagged this business yet.'}
        </p>
      </div>
    );
  }

  if (filter === 'images') {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#EDEFF2' }}>
          <ImageIcon className="h-8 w-8 text-[#97A1AA]" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">No images yet</p>
        <p className="text-sm text-muted-foreground">
          {tab === 'activity' ? 'Share photos to showcase your business.' : 'No image posts have tagged this business yet.'}
        </p>
      </div>
    );
  }

  // Activity tab empty state
  if (tab === 'activity') {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#EDEFF2' }}>
          <ImageIcon className="h-8 w-8 text-[#97A1AA]" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">No posts yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          {canManage
            ? 'Create your first update for your members.'
            : `No posts yet from ${businessName || 'this business'}.`}
        </p>
        {canManage && (
          <button
            className="rounded-full bg-[#01754F] hover:bg-[#016544] text-white px-6 py-2.5 text-sm font-medium transition-colors"
            onClick={onCreatePost}
          >
            Create your first post
          </button>
        )}
      </div>
    );
  }

  // Tagged tab empty state
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: '#EDEFF2' }}>
        <Users className="h-8 w-8 text-[#97A1AA]" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">No tagged posts yet</p>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        When golfers or businesses tag {businessName || 'this club'}, you'll see it here.
      </p>
    </div>
  );
}

export default BusinessActivityFeed;
