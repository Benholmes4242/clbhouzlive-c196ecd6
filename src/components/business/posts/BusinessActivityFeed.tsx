/**
 * BusinessActivityFeed - Premium activity feed with gradient separators
 * Phase 1-6 implementation for business profile posts
 */

import React, { useState, useCallback } from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { useRealtimeBusinessPosts } from '@/hooks/useRealtimeBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { Button } from '@/components/ui/button';
import { useActiveActor } from '@/context/ActiveActorContext';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { useGridAutoplay } from '@/hooks/useGridAutoplay';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Plus } from 'lucide-react';
import BusinessPostCard from './BusinessPostCard';

interface BusinessActivityFeedProps {
  businessId: string;
  businessName?: string;
  businessLogo?: string | null;
  followerCount?: number;
  membership: BusinessMembership | null;
}

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
  const { data: posts, isLoading, error } = useBusinessPosts(businessId);
  useRealtimeBusinessPosts(businessId);
  const { setActiveActor, availableActors } = useActiveActor();
  const { submitPost } = useOptimisticPostSubmission();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMedia, setComposerMedia] = useState<ComposerMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use same autoplay hook as personal profile - applies to ALL videos for business
  const { registerVideo, playingIds } = useGridAutoplay({
    maxPlaying: 2,
    visibilityThreshold: 0.6,
    preloadMargin: 300,
  });

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

  // Filter posts based on active filter
  const filteredPosts = posts?.filter((post) => {
    if (activeFilter === 'all') return true;
    const hasVideo = post.post_media?.some((m) => m.media_type === 'video');
    const hasImage = post.post_media?.some((m) => m.media_type === 'image');
    if (activeFilter === 'videos') return hasVideo;
    if (activeFilter === 'images') return hasImage;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 px-4">
        {/* Filter pills skeleton */}
        <div className="flex gap-2 overflow-x-auto py-2 -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full flex-shrink-0" />
          ))}
        </div>
        {/* Post cards skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-sq-md border border-border/50 overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
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
        <p className="text-muted-foreground">Failed to load posts.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter pills - horizontal scrollable, full bleed */}
      <div className="flex gap-2 overflow-x-auto py-3 -mx-5 px-5 no-scrollbar">
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

      {/* Create post button for admins */}
      {membership?.canManage && (
        <div className="pb-3">
          <Button
            onClick={handleCreatePost}
            variant="outline"
            className="w-full rounded-sq-md border-border/50 bg-white hover:bg-muted/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create post
          </Button>
        </div>
      )}

      {/* Posts feed with gradient background and spacing */}
      {!filteredPosts || filteredPosts.length === 0 ? (
        <div className="py-12 text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#EDEFF2' }}
          >
            <ImageIcon className="h-8 w-8 text-[#97A1AA]" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {membership?.canManage
              ? 'No posts yet. Share updates, photos and offers.'
              : `No posts yet from ${businessName || 'this business'}.`}
          </p>
          {membership?.canManage && (
            <Button className="rounded-full bg-[#01754F] hover:bg-[#016544] text-white" onClick={handleCreatePost}>
              Create your first post
            </Button>
          )}
        </div>
      ) : (
        /* Gradient background container with spacing */
        <div
          className="-mx-5 px-0"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div className="flex flex-col gap-3 md:gap-4 py-3 md:py-4">
            {filteredPosts.map((post, index) => (
              <BusinessPostCard
                key={post.id}
                post={post}
                businessName={businessName}
                businessLogo={businessLogo}
                followerCount={followerCount}
                isOwner={membership?.canManage ?? false}
                registerVideo={registerVideo}
                isPlaying={playingIds.has(post.id)}
                videoIndex={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Composer Modal - with actor override to this business */}
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

export default BusinessActivityFeed;
