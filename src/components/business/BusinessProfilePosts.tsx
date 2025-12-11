import React from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { Play, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BusinessProfilePostsProps {
  businessId: string;
  businessName?: string;
  membership: BusinessMembership | null;
}

export function BusinessProfilePosts({ businessId, businessName, membership }: BusinessProfilePostsProps) {
  const { data: posts, isLoading, error } = useBusinessPosts(businessId);

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

  if (!posts || posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
        <p className="text-sm text-muted-foreground mb-4">
          {membership?.canManage 
            ? "No posts yet. Post as this business to share updates, photos and offers."
            : `No posts yet from ${businessName || 'this business'}.`}
        </p>
        {membership?.canManage && (
          <Button variant="outline" className="rounded-full">
            Post as this business
          </Button>
        )}
      </div>
    );
  }

  // Instagram-style 3-column grid with no gap (matches personal Activity)
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <PostTile key={post.id} post={post} />
      ))}
    </div>
  );
}

function PostTile({ post }: { post: BusinessPost }) {
  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const thumbnailUrl = isVideo ? primaryMedia?.poster_url : primaryMedia?.media_url;

  return (
    <div className="group relative aspect-square bg-muted overflow-hidden cursor-pointer">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
          <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
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
