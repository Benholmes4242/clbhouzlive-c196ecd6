import React, { useState, useCallback } from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { useRealtimeBusinessPosts } from '@/hooks/useRealtimeBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { 
  Play, 
  ThumbsUp, 
  MessageSquare, 
  Repeat2, 
  Send, 
  MoreHorizontal, 
  Globe, 
  Image as ImageIcon, 
  Plus,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveActor } from '@/context/ActiveActorContext';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { getStreamPoster } from '@/utils/stream';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface BusinessProfilePostsProps {
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

export function BusinessProfilePosts({ 
  businessId, 
  businessName, 
  businessLogo,
  followerCount = 0,
  membership 
}: BusinessProfilePostsProps) {
  const { data: posts, isLoading, error } = useBusinessPosts(businessId);
  useRealtimeBusinessPosts(businessId);
  const { setActiveActor, availableActors } = useActiveActor();
  const openPostStudio = usePostStudioStore((s) => s.openPostStudio);
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleCreatePost = useCallback(() => {
    const businessActor = availableActors.find(
      a => a.type === 'business' && a.id === businessId
    );
    if (businessActor) {
      setActiveActor(businessActor);
    }
    openPostStudio({ actorType: 'business', actorId: businessId, returnPath: window.location.pathname });
  }, [businessId, availableActors, setActiveActor, openPostStudio]);

  // Filter posts based on active filter
  const filteredPosts = posts?.filter(post => {
    if (activeFilter === 'all') return true;
    const hasVideo = post.post_media?.some(m => m.media_type === 'video');
    const hasImage = post.post_media?.some(m => m.media_type === 'image');
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
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeFilter === key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground border border-border hover:bg-muted/50"
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

      {/* Posts feed */}
      {!filteredPosts || filteredPosts.length === 0 ? (
        <div className="py-12 text-center">
          <div 
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted"
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {membership?.canManage 
              ? "No posts yet. Share updates, photos and offers."
              : `No posts yet from ${businessName || 'this business'}.`}
          </p>
          {membership?.canManage && (
            <Button 
              className="rounded-lg bg-card hover:bg-muted text-foreground border border-border/60 font-semibold" 
              onClick={handleCreatePost}
            >
              Create your first post
            </Button>
          )}
        </div>
      ) : (
        <div>
          {filteredPosts.map((post) => (
            <LinkedInPostCard 
              key={post.id} 
              post={post} 
              businessName={businessName}
              businessLogo={businessLogo}
              followerCount={followerCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LinkedInPostCardProps {
  post: BusinessPost;
  businessName?: string;
  businessLogo?: string | null;
  followerCount?: number;
}

function LinkedInPostCard({ post, businessName, businessLogo, followerCount = 0 }: LinkedInPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const hasMultipleMedia = (post.post_media?.length || 0) > 1;
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false })
    .replace('about ', '')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' weeks', 'w')
    .replace(' week', 'w')
    .replace(' months', 'mo')
    .replace(' month', 'mo');

  const content = post.content || '';
  const shouldTruncate = content.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? content.slice(0, 150) : content;

  const thumbnailUrl = isVideo 
    ? (primaryMedia?.poster_url || getStreamPoster(primaryMedia?.media_url || '', '1s', 600))
    : primaryMedia?.media_url;

  return (
    <div className="border-b border-border/30 pb-2">
      <div className="py-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {businessLogo ? (
                <img src={businessLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-semibold">
                  {businessName?.charAt(0) || 'B'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm leading-tight">
                {businessName || 'Business'}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {followerCount.toLocaleString()} followers
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <span>{timeAgo}</span>
                <span>•</span>
                <Globe className="h-3 w-3" />
              </div>
            </div>
          </div>
          <button className="p-1 hover:bg-muted/50 rounded-full transition-colors">
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {content && (
        <div className="pb-2">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {displayContent}
            {shouldTruncate && (
              <>
                {'... '}
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  more
                </button>
              </>
            )}
          </p>
        </div>
      )}

      {primaryMedia && (
        <div className="relative -mx-5">
          {isVideo ? (
            <div className="relative aspect-[4/5] bg-muted">
              <img src={thumbnailUrl || ''} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={primaryMedia.media_url}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: '500px' }}
            />
          )}
          {hasMultipleMedia && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
              +{post.post_media!.length - 1}
            </div>
          )}
        </div>
      )}

      <div className="py-1 flex items-center justify-around">
        <ActionButton icon={ThumbsUp} label="Like" />
        <ActionButton icon={MessageSquare} label="Comment" />
        <ActionButton icon={Repeat2} label="Repost" />
        <ActionButton icon={Send} label="Send" />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function ActionButton({ icon: Icon, label, isActive, onClick }: ActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2 px-3 rounded-md transition-colors hover:bg-muted/50",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
