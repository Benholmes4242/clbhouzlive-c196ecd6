import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Play, Heart, MessageCircle, Image as ImageIcon, Users } from 'lucide-react';

interface GolfersHereTabProps {
  businessId: string;
  businessName?: string;
  businessLocation?: string;
}

interface TaggedPost {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  post_media: Array<{
    media_url: string;
    media_type: string;
    poster_url?: string;
  }>;
  user_profiles: {
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
}

export function GolfersHereTab({ businessId, businessName, businessLocation }: GolfersHereTabProps) {
  // Fetch posts tagged at this location/business
  // Note: This is a placeholder query - actual implementation depends on your tagging schema
  const { data: taggedPosts, isLoading } = useQuery({
    queryKey: ['business-tagged-posts', businessId],
    queryFn: async () => {
      // For now, return empty array since the posts table schema may not have
      // tagged_business_id or location columns yet
      // TODO: Implement proper tagging when schema is updated
      
      // Placeholder: try to find posts that might be related
      // In production, you'd have a proper tagged_business_id column
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            post_media (
              media_url,
              media_type,
              poster_url
            )
          `)
          .limit(30)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          return [];
        }

        // For now, return empty since we can't properly filter by business
        // This prevents showing unrelated posts
        return [];
      } catch (err) {
        console.error('Error in tagged posts query:', err);
        return [];
      }
    },
    enabled: !!businessId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!taggedPosts || taggedPosts.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">
          No followers yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {taggedPosts.length} post{taggedPosts.length !== 1 ? 's' : ''} from golfers
        </p>
      </div>

      {/* Grid of tagged posts */}
      <div className="grid grid-cols-3 gap-0.5">
        {taggedPosts.map((post) => (
          <PostTile key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function PostTile({ post }: { post: TaggedPost }) {
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
