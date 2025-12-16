import React, { useState, useCallback } from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { Play, Heart, MessageCircle, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveActor } from '@/context/ActiveActorContext';
import { normalizeFilesToMediaItems } from '@/lib/mediaUtils';
import { openMediaPicker } from '@/utils/openMediaPicker';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';

interface BusinessProfilePostsProps {
  businessId: string;
  businessName?: string;
  membership: BusinessMembership | null;
}

export function BusinessProfilePosts({ businessId, businessName, membership }: BusinessProfilePostsProps) {
  const { data: posts, isLoading, error } = useBusinessPosts(businessId);
  const { setActiveActor, availableActors } = useActiveActor();
  const { submitPost } = useOptimisticPostSubmission();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  
  // Create post modal state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMedia, setComposerMedia] = useState<ComposerMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open composer with business pre-selected
  const handleCreatePost = useCallback(() => {
    // Pre-select this business in the active actor context
    const businessActor = availableActors.find(
      a => a.type === 'business' && a.id === businessId
    );
    if (businessActor) {
      setActiveActor(businessActor);
    }
    
    // Open media picker
    openMediaPicker(async (files) => {
      if (files.length > 0) {
        const items = await normalizeFilesToMediaItems(files);
        setComposerMedia(items);
        setIsComposerOpen(true);
      }
    }, 10);
  }, [businessId, availableActors, setActiveActor]);

  const handleComposerSubmit = useCallback(async (data: any) => {
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
        // Refresh business posts
        queryClient.invalidateQueries({ queryKey: ['business-posts', businessId] });
        queryClient.invalidateQueries({ queryKey: ['business-posts-count', businessId] });
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  }, [user, businessId, submitPost, queryClient]);

  const handleComposerClose = useCallback(() => {
    setIsComposerOpen(false);
    setComposerMedia([]);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load posts.</p>
      </div>
    );
  }

  // Show create post button for owners/admins
  const CreatePostButton = membership?.canManage ? (
    <Button 
      onClick={handleCreatePost}
      className="w-full rounded-sq-md mb-4 bg-[#F7931E] hover:bg-[#E07D0A] text-white"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create post as {businessName || 'this business'}
    </Button>
  ) : null;

  if (!posts || posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <div 
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: '#EDEFF2' }}
        >
          <ImageIcon className="h-8 w-8 text-[#97A1AA]" />
        </div>
        <p className="text-sm text-[#5E666D] mb-4">
          {membership?.canManage 
            ? "No posts yet. Post as this business to share updates, photos and offers."
            : `No posts yet from ${businessName || 'this business'}.`}
        </p>
        {membership?.canManage && (
          <Button 
            variant="outline" 
            className="rounded-full text-[#1F2428] border-[#1F2428]/10 hover:bg-[#EDEFF2]" 
            onClick={handleCreatePost}
          >
            Create post as {businessName || 'this business'}
          </Button>
        )}
        
        {/* Composer Modal */}
        <EnhancedCreateMomentModalCinematic
          isOpen={isComposerOpen}
          onClose={handleComposerClose}
          onSubmit={handleComposerSubmit}
          isSubmitting={isSubmitting}
          mediaItems={composerMedia}
          onMediaChange={setComposerMedia}
        />
      </div>
    );
  }

  // Instagram-style 3-column grid with no gap (matches personal Activity)
  return (
    <div>
      {CreatePostButton}
      
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <PostTile key={post.id} post={post} />
        ))}
      </div>

      {/* Composer Modal */}
      <EnhancedCreateMomentModalCinematic
        isOpen={isComposerOpen}
        onClose={handleComposerClose}
        onSubmit={handleComposerSubmit}
        isSubmitting={isSubmitting}
        mediaItems={composerMedia}
        onMediaChange={setComposerMedia}
      />
    </div>
  );
}

function PostTile({ post }: { post: BusinessPost }) {
  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const thumbnailUrl = isVideo ? primaryMedia?.poster_url : primaryMedia?.media_url;

  return (
    <div className="group relative aspect-square overflow-hidden cursor-pointer rounded-sq-xs" style={{ background: '#EDEFF2' }}>
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-[#97A1AA]" />
        </div>
      )}

      {/* Video indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2">
          <Play className="h-5 w-5 text-white drop-shadow-lg" fill="white" />
        </div>
      )}

      {/* Hover overlay with stats */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
        <div className="flex items-center gap-1">
          <Heart className="h-5 w-5" />
          <span className="text-sm font-medium">–</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">–</span>
        </div>
      </div>
    </div>
  );
}
