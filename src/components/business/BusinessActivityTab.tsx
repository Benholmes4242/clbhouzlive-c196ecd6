/**
 * BusinessActivityTab - Single-column vertical activity feed for business profiles
 * NO grid, NO masonry, NO personal profile patterns
 */
import React, { useState, useCallback } from 'react';
import { useBusinessPosts, BusinessPost, isMockModeActive } from '@/hooks/useBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { BusinessActivityCard, BusinessActivityPost } from './BusinessActivityCard';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveActor } from '@/context/ActiveActorContext';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';

type ActivityFilter = 'all' | 'announcements' | 'reviews' | 'media';

interface BusinessActivityTabProps {
  businessId: string;
  businessName: string;
  businessLogo?: string | null;
  membership: BusinessMembership | null;
}

export function BusinessActivityTab({ 
  businessId, 
  businessName, 
  businessLogo,
  membership 
}: BusinessActivityTabProps) {
  const { data: posts, isLoading, error } = useBusinessPosts(businessId);
  const { setActiveActor, availableActors } = useActiveActor();
  const { submitPost } = useOptimisticPostSubmission();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMedia, setComposerMedia] = useState<ComposerMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filters: { id: ActivityFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'media', label: 'Media' },
  ];

  // Filter posts based on active filter
  const filteredPosts = (posts || []).filter((post) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'announcements') return (post as any).post_type === 'announcement';
    if (activeFilter === 'reviews') return (post as any).post_type === 'review';
    if (activeFilter === 'media') return post.post_media && post.post_media.length > 0;
    return true;
  });

  // Transform BusinessPost to BusinessActivityPost
  const transformPost = (post: BusinessPost): BusinessActivityPost => ({
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    post_type: (post as any).post_type || 'standard',
    post_media: post.post_media.map(m => ({
      id: m.id,
      media_url: m.media_url,
      media_type: m.media_type,
      poster_url: m.poster_url ?? null,
    })),
    likes_count: (post as any).likes_count ?? 0,
    comments_count: (post as any).comments_count ?? 0,
    location: (post as any).location ?? null,
  });

  // Open Create a Moment modal with business pre-selected
  const handleCreatePost = useCallback(() => {
    // Set the active actor to this business
    const businessActor = availableActors.find(
      a => a.type === 'business' && a.id === businessId
    );
    if (businessActor) {
      setActiveActor(businessActor);
    }
    
    // Open the composer modal directly (no file picker required)
    setComposerMedia([]);
    setIsComposerOpen(true);
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

  const handleEngagementClick = (postId: string) => {
    // Open engagement sheet - can be wired up later
    console.log('Open engagement for post:', postId);
  };

  const handleEditPost = (postId: string) => {
    // Wire up edit functionality
    console.log('Edit post:', postId);
  };

  const handleDeletePost = (postId: string) => {
    // Wire up delete functionality
    console.log('Delete post:', postId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-white rounded-sq-lg overflow-hidden animate-pulse"
            style={{ boxShadow: '0 2px 12px rgba(31, 36, 40, 0.06)' }}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-sq-sm bg-slate-200" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-3 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="aspect-[4/5] bg-slate-200" />
            <div className="p-4">
              <div className="w-full h-4 bg-slate-200 rounded mb-2" />
              <div className="w-3/4 h-4 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Failed to load activity.</p>
      </div>
    );
  }

  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <div 
          className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'rgba(100, 116, 139, 0.08)' }}
        >
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <p className="text-base text-slate-500 mb-2 max-w-xs mx-auto">
          Businesses use Activity to share updates, reviews and announcements.
        </p>
        {membership?.canManage && (
          <Button 
            onClick={handleCreatePost}
            className="mt-4 rounded-full bg-slate-700 hover:bg-slate-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create post as {businessName}
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

  const mockActive = isMockModeActive(businessId);

  return (
    <div className="space-y-4">
      {/* Mock mode indicator (dev only) */}
      {mockActive && (
        <div className="px-3 py-2 rounded-sq-sm bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium">
          ⚠️ Mock activity enabled (dev only)
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              background: activeFilter === filter.id ? '#1F2428' : '#F1F5F9',
              color: activeFilter === filter.id ? 'white' : '#64748b',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Create Post Button (Admin only) */}
      {membership?.canManage && (
        <Button 
          onClick={handleCreatePost}
          className="w-full rounded-sq-md bg-slate-700 hover:bg-slate-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create post as {businessName}
        </Button>
      )}

      {/* Activity Feed - Single column vertical */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <BusinessActivityCard
            key={post.id}
            post={transformPost(post)}
            businessName={businessName}
            businessLogo={businessLogo}
            isOwner={membership?.canManage}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            onEngagementClick={handleEngagementClick}
          />
        ))}
      </div>

      {/* Empty filtered state */}
      {filteredPosts.length === 0 && posts.length > 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">
            No {activeFilter === 'all' ? 'posts' : activeFilter} to show.
          </p>
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
      />
    </div>
  );
}
