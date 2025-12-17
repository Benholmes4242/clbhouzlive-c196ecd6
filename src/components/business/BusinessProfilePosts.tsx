import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useBusinessPosts, BusinessPost } from '@/hooks/useBusinessPosts';
import { useRealtimeBusinessPosts } from '@/hooks/useRealtimeBusinessPosts';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { 
  Play, 
  Heart, 
  MessageSquare, 
  Repeat2, 
  Send, 
  MoreHorizontal, 
  Globe, 
  Image as ImageIcon, 
  Plus,
  Link2,
  Flag,
  Pencil,
  Eye,
  Pin,
  BarChart3,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveActor } from '@/context/ActiveActorContext';
import EnhancedCreateMomentModalCinematic from '@/components/post/EnhancedCreateMomentModal.cinematic';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { useOptimisticPostSubmission } from '@/hooks/useOptimisticPostSubmission';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { getStreamPoster } from '@/utils/stream';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import CommentsModal from '@/components/posts/CommentsModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import GridAutoplayVideo from '@/components/profile/activity/GridAutoplayVideo';
import { useGridAutoplay } from '@/hooks/useGridAutoplay';
import { uidFromNode, generateHlsUrl } from '@/utils/cloudflareStreamTransform';

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
  const { submitPost } = useOptimisticPostSubmission();
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMedia, setComposerMedia] = useState<ComposerMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Comments modal state
  const [commentsModalPostId, setCommentsModalPostId] = useState<string | null>(null);

  // Video autoplay - reuse personal profile logic, applied to every video
  const { registerVideo, playingIds } = useGridAutoplay({
    maxPlaying: 2,
    visibilityThreshold: 0.6,
  });

  const handleCreatePost = useCallback(() => {
    const businessActor = availableActors.find(
      a => a.type === 'business' && a.id === businessId
    );
    if (businessActor) {
      setActiveActor(businessActor);
    }
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
        queryClient.invalidateQueries({ queryKey: ['actor-posts', 'business', businessId] });
        queryClient.invalidateQueries({ queryKey: ['actor-posts-count', 'business', businessId] });
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

  const handleOpenComments = useCallback((postId: string) => {
    setCommentsModalPostId(postId);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsModalPostId(null);
  }, []);

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
    <>
      {/* Feed with gradient background separator */}
      <div 
        className="min-h-[50vh]"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.5) 100%)'
        }}
      >
        {/* Filter pills - horizontal scrollable */}
        <div className="flex gap-2 overflow-x-auto py-3 px-5 no-scrollbar bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeFilter === key
                  ? "bg-[#01754F] text-white"
                  : "bg-white text-foreground border border-border hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Create post button for admins */}
        {membership?.canManage && (
          <div className="px-5 pb-3">
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

        {/* Posts feed with spacing */}
        {!filteredPosts || filteredPosts.length === 0 ? (
          <div className="py-12 text-center px-5">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#EDEFF2' }}
            >
              <ImageIcon className="h-8 w-8 text-[#97A1AA]" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {membership?.canManage 
                ? "No posts yet. Share updates, photos and offers."
                : `No posts yet from ${businessName || 'this business'}.`}
            </p>
            {membership?.canManage && (
              <Button 
                className="rounded-full bg-[#01754F] hover:bg-[#016544] text-white" 
                onClick={handleCreatePost}
              >
                Create your first post
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4 px-3 md:px-5 pb-6">
            {filteredPosts.map((post, index) => (
              <BusinessPostCard 
                key={post.id} 
                post={post} 
                businessName={businessName}
                businessLogo={businessLogo}
                followerCount={followerCount}
                canManage={membership?.canManage ?? false}
                onOpenComments={handleOpenComments}
                registerVideo={registerVideo}
                isPlaying={playingIds.has(post.id)}
                videoIndex={index}
              />
            ))}
          </div>
        )}
      </div>

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

      {/* Comments Modal - reuse existing with grey variant */}
      {commentsModalPostId && (
        <CommentsModal
          isOpen={!!commentsModalPostId}
          onClose={handleCloseComments}
          postId={commentsModalPostId}
          variant="grey"
        />
      )}
    </>
  );
}

interface BusinessPostCardProps {
  post: BusinessPost;
  businessName?: string;
  businessLogo?: string | null;
  followerCount?: number;
  canManage: boolean;
  onOpenComments: (postId: string) => void;
  registerVideo: (args: { id: string; element: HTMLVideoElement | null; isCandidate: boolean; sortIndex: number }) => void;
  isPlaying: boolean;
  videoIndex: number;
}

function BusinessPostCard({ 
  post, 
  businessName, 
  businessLogo, 
  followerCount = 0,
  canManage,
  onOpenComments,
  registerVideo,
  isPlaying,
  videoIndex
}: BusinessPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const hasMultipleMedia = (post.post_media?.length || 0) > 1;
  
  // Use the existing post engagement hook for unified data
  const { 
    likesCount, 
    commentsCount, 
    hasLiked, 
    toggleLike, 
    isTogglingLike 
  } = usePostEngagement(post.id);
  
  // Format timestamp like LinkedIn (1d, 2w, etc.)
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

  // Truncate content if longer than 150 chars
  const content = post.content || '';
  const shouldTruncate = content.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? content.slice(0, 150) : content;

  // Get video playback URL and thumbnail
  const uid = isVideo ? uidFromNode({ src: primaryMedia?.media_url, media_url: primaryMedia?.media_url }) : null;
  const playbackUrl = uid ? generateHlsUrl(uid) : primaryMedia?.media_url;
  const thumbnailUrl = isVideo 
    ? (primaryMedia?.poster_url || getStreamPoster(primaryMedia?.media_url || '', '1s', 600))
    : primaryMedia?.media_url;

  // Register video for autoplay - every video is a candidate for business feeds
  useEffect(() => {
    if (isVideo && videoRef.current) {
      registerVideo({
        id: post.id,
        element: videoRef.current,
        isCandidate: true, // Every video is a candidate in business feeds
        sortIndex: videoIndex,
      });
    }
    return () => {
      if (isVideo) {
        registerVideo({
          id: post.id,
          element: null,
          isCandidate: true,
          sortIndex: videoIndex,
        });
      }
    };
  }, [isVideo, post.id, videoIndex, registerVideo]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success('Link copied to clipboard');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName || 'Post',
          url: `${window.location.origin}/post/${post.id}`,
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div 
      className="bg-white rounded-sq-md overflow-hidden"
      style={{
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)'
      }}
    >
      {/* Post header */}
      <div className="p-3 md:p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            {/* Business avatar */}
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {businessLogo ? (
                <img src={businessLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-semibold">
                  {businessName?.charAt(0) || 'B'}
                </div>
              )}
            </div>
            
            {/* Business info */}
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
          
          {/* More menu - functional */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 hover:bg-muted/50 rounded-full transition-colors">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Everyone actions */}
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Send className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
              
              {/* Admin/Editor actions */}
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit caption
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Change visibility
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin to top
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View insights
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Post content */}
      {content && (
        <div className="px-3 md:px-4 pb-2">
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

      {/* Media - contained within card, never overflows */}
      {primaryMedia && (
        <div 
          className="relative w-full overflow-hidden"
          style={{ 
            aspectRatio: isVideo ? '16/9' : undefined,
            maxHeight: isVideo ? undefined : '500px',
            minWidth: 0 // Prevents flex overflow
          }}
        >
          {isVideo ? (
            <>
              {/* Use GridAutoplayVideo for consistent autoplay behavior */}
              <GridAutoplayVideo
                ref={videoRef}
                src={playbackUrl || ''}
                poster={thumbnailUrl || ''}
                className="w-full h-full object-cover"
              />
              {/* Play button overlay when not playing */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Play className="h-7 w-7 md:h-8 md:w-8 text-white ml-1" fill="white" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <img
              src={primaryMedia.media_url}
              alt=""
              className="w-full h-full object-cover"
              style={{ maxHeight: '500px' }}
            />
          )}
          
          {/* Multiple media indicator */}
          {hasMultipleMedia && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-sq-xs">
              +{post.post_media!.length - 1}
            </div>
          )}
        </div>
      )}

      {/* Social proof line */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="px-3 md:px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-b border-border/30">
          <span>
            {likesCount > 0 && `${likesCount} golfer${likesCount !== 1 ? 's' : ''} appreciated`}
          </span>
          <button 
            onClick={() => onOpenComments(post.id)}
            className="hover:underline"
          >
            {commentsCount > 0 && `${commentsCount} comment${commentsCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Action bar - Option A naming (Appreciate/Comment/Reshare/Send) */}
      <div className="py-1 flex items-center justify-around border-t border-border/30">
        <ActionButton 
          icon={Heart} 
          label="Appreciate" 
          isActive={hasLiked}
          onClick={toggleLike}
          disabled={isTogglingLike}
        />
        <ActionButton 
          icon={MessageSquare} 
          label="Comment" 
          onClick={() => onOpenComments(post.id)}
        />
        <ActionButton icon={Repeat2} label="Reshare" />
        <ActionButton icon={Send} label="Send" onClick={handleShare} />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function ActionButton({ icon: Icon, label, isActive, onClick, disabled }: ActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2 px-2 md:px-3 rounded-sq-sm transition-colors",
        "hover:bg-muted/50 active:bg-muted/70",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isActive ? "text-[#F7931E]" : "text-muted-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
      <span className="text-[11px] md:text-xs font-medium">{label}</span>
    </button>
  );
}
