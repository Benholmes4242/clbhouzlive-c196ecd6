import React from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { Play, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react';

interface BusinessProfilePostsProps {
  businessId: string;
  membership: BusinessMembership | null;
}

export function BusinessProfilePosts({ businessId, membership }: BusinessProfilePostsProps) {
  const { data: posts, isLoading, error } = useBusinessPosts(businessId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-sq-sm" />
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
      <div className="bg-card border border-border rounded-sq-md p-8 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        {membership?.canManage ? (
          <>
            <p className="text-muted-foreground mb-2">
              You haven't posted as this business yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Create a Moment and choose this business in the "Posting as" selector.
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            No posts yet from this business.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
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
    <div className="group relative aspect-square bg-muted rounded-sq-sm overflow-hidden cursor-pointer">
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

      {/* Hover overlay */}
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
