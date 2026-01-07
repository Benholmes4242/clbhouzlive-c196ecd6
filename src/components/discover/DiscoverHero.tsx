import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { getStreamPoster } from '@/utils/stream';
import { OverlayCorners } from '@/components/shared/overlay';
import { HLSPlayer, HLSPlayerRef, useMediaAutoplay, MediaRuntime } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import PostMeta from '@/components/posts/PostMeta';
import {
  logHeroMount,
  logHeroPosterLoad,
  logHeroHlsLoadStart,
  logHeroCanplay,
  logHeroPlaying,
  logHeroError,
  logHeroLoadedData,
} from '@/utils/gridAuditTimeline';
import {
  logHeroComponentMount,
  logHeroMediaRuntimeRegister,
  logHeroPosterHidden,
  logHeroPreloadManifest,
  logHeroLoadedData as logHeroLoadedDataTiming,
  logHeroPlaying as logHeroPlayingTiming,
  logHeroCanPlay as logHeroCanPlayTiming,
} from '@/utils/discoverTimeline';

// Debug logging for video lifecycle analysis
const DEBUG_HERO = true;
const logHero = (event: string, data?: any) => {
  if (!DEBUG_HERO) return;
  const timestamp = performance.now().toFixed(2);
  console.log(`[${timestamp}ms] [DiscoverHero] ${event}`, data || '');
};

interface HeroItem {
  id: string;
  contextLabel: string; // e.g. "Trending in golf"
  title: string;
  subContext: string; // creator OR course name
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  ctaLabel?: string;
  onClick?: () => void;
  durationSeconds?: number; // Video duration in seconds
  isPopular?: boolean; // Ranking: Popular today
  isTrending?: boolean; // Ranking: Trending
  likes?: number; // Like count
  golfCourse?: {
    id: string;
    name: string;
    country: string;
    region?: string;
    sub_country?: string;
    slug?: string;
  };
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  /** Tags for @mentions in caption */
  tags?: Array<{
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    start_index?: number;
    end_index?: number;
  }>;
}

interface DiscoverHeroProps {
  item: HeroItem | null;
  isLoading?: boolean;
  onWatch?: (item: HeroItem) => void;
  /** When true, HLSPlayer manages its own autoplay via visibility */
  autoplay?: boolean;
}

/**
 * DiscoverHero - Hero card for discover page
 * 
 * IMPORTANT: This component does NOT control playback directly.
 * HLSPlayer handles autoplay internally based on visibility.
 * For grid contexts, the parent should use useMediaAutoplay + MediaRuntime.
 */
export default function DiscoverHero({ item, isLoading, onWatch, autoplay = true }: DiscoverHeroProps) {
  const navigate = useNavigate();
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedDuration, setResolvedDuration] = useState<number | undefined>(item?.durationSeconds);
  const hasPreloadedRef = useRef(false);
  const registeredIdRef = useRef<string | null>(null);

  // MediaRuntime integration - hero gets its own surface for independent playback
  const { registerMedia } = useMediaAutoplay({
    mode: 'grid',
    surface: 'hero', // Hero has its own surface - can play alongside grid videos
    startThreshold: 0.3, // Hero should start playing when 30% visible
    stopThreshold: 0.1,
  });

  // Register hero video with MediaRuntime when element is ready
  useEffect(() => {
    if (!item || item.mediaType !== 'video' || !autoplay) return;
    
    // Wait for player to be ready and get video element
    const checkAndRegister = () => {
      const element = playerRef.current?.getElement();
      if (element && registeredIdRef.current !== item.id) {
        registeredIdRef.current = item.id;
        registerMedia({
          id: item.id,
          element,
          isCandidate: true,
          sortIndex: 0, // High priority - hero gets sortIndex 0
          observeTarget: containerRef.current,
        });
        
        // Discover timing instrumentation
        logHeroMediaRuntimeRegister(item.id, 0);
        
        if (DEBUG_HERO) {
          logHero('REGISTERED_WITH_MEDIARUNTIME', { id: item.id.slice(0, 8) });
        }
      }
    };
    
    // Try immediately and again after short delay
    checkAndRegister();
    const timer = setTimeout(checkAndRegister, 100);
    
    return () => {
      clearTimeout(timer);
      // Unregister on cleanup
      if (registeredIdRef.current) {
        registerMedia({ id: registeredIdRef.current, element: null });
        registeredIdRef.current = null;
      }
    };
  }, [item?.id, item?.mediaType, autoplay, registerMedia]);

  // CRITICAL: Preload video HLS manifest immediately in layout phase
  useLayoutEffect(() => {
    if (hasPreloadedRef.current) return;
    if (!item || item.mediaType !== 'video' || !item.mediaUrl) return;

    hasPreloadedRef.current = true;

    const uid = uidFromNode({ src: item.mediaUrl });
    if (uid) {
      logHero('LAYOUT_EFFECT_PRELOAD', { id: item.id.slice(0, 8) });
      logHeroPreloadManifest(item.id);
      preloadHlsManifest(generateStreamHlsUrl(uid));
    }
  }, [item]);

  // Log mount/unmount - with audit timeline
  useEffect(() => {
    if (item) {
      logHeroMount(item.id, item.mediaType);
      // Discover timing instrumentation
      if (item.mediaType === 'video') {
        logHeroComponentMount(item.id, autoplay);
      }
    }
    logHero('MOUNT', { 
      itemId: item?.id,
      mediaType: item?.mediaType,
      autoplay,
      hasPoster: !!item?.posterUrl
    });
    return () => {
      logHero('UNMOUNT', { itemId: item?.id });
    };
  }, []);

  // Log autoplay prop changes
  useEffect(() => {
    logHero('AUTOPLAY_PROP_CHANGE', { 
      autoplay, 
      itemId: item?.id,
      mediaType: item?.mediaType 
    });
  }, [autoplay, item?.id, item?.mediaType]);

  // Update resolved duration when item changes
  useEffect(() => {
    setResolvedDuration(item?.durationSeconds);
  }, [item?.durationSeconds]);

  // Get duration from video element if not provided
  const handleLoadedData = useCallback(() => {
    if (item) {
      logHeroLoadedData(item.id, playerRef.current?.getCurrentTime?.() || 0);
      // Discover timing instrumentation
      logHeroLoadedDataTiming(item.id, playerRef.current?.getCurrentTime?.() || 0);
    }
    logHero('HANDLE_LOADED_DATA_CALLED', { itemId: item?.id, hasDuration: !!item?.durationSeconds });
    if (playerRef.current && !item?.durationSeconds) {
      const d = playerRef.current.getDuration();
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDuration(d);
      }
    }
  }, [item?.durationSeconds, item?.id]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border/60 overflow-hidden">
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
          <Skeleton className="absolute inset-0" />
        </div>
        <div className="px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  const handleClick = () => {
    onWatch?.(item);
    item.onClick?.();
  };

  const handleClubClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.golfCourse?.id) {
      navigate(`/clubs/${item.golfCourse.id}`);
    }
  };

  const creatorName = item.creator?.name || item.subContext;
  const creatorAvatar = item.creator?.avatarUrl;

  return (
    <div 
      ref={containerRef}
      className="bg-card border border-border/30 overflow-hidden cursor-pointer group"
      onClick={handleClick}
    >
      {/* Media Section - 16:9 */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {/* Media - Image or Video */}
        {item.mediaType === 'video' && item.mediaUrl ? (
          <>
            {/* RENDER_VIDEO log removed - fires on every render */}
            <HLSPlayer
              ref={playerRef}
              src={item.mediaUrl}
              autoplay={false}
              muted
              loop
              objectFit="cover"
              managedByMediaRuntime={true}
              externallyManaged={true}
              mediaId={item.id}
              onLoadedData={() => {
                logHero('VIDEO_LOADED_DATA', { itemId: item.id });
                handleLoadedData();
              }}
              className="absolute inset-0 w-full h-full"
            />
          </>
        ) : (
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Unified overlay system - no club tag on hero */}
        <OverlayCorners
          surface="hero"
          club={null}
          showDuration={false}
          trendingLabel="Trending Today"
          showCreator={false}
          showLikes={true}
          likes={item.likes}
          showAvatar={false}
        />

        {/* Subtle hover effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      </div>

      {/* Meta Area - White card section */}
      <div className="px-4 py-3 flex items-end justify-between gap-3">
        {/* Text content - constrained to ~75% to leave room for avatar */}
        <div className="flex-1 min-w-0 max-w-[80%]">
          {/* Caption + Course using PostMeta */}
          <PostMeta
            text={item.title}
            tags={item.tags}
            golfCourse={item.golfCourse}
            isDark={false}
            maxLines={2}
            showMore={false}
          />
          {/* Creator name */}
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {creatorName}
          </p>
        </div>

        {/* Avatar - global squircle shape, no border */}
        <div 
          className="shrink-0 overflow-hidden shadow-sm"
          style={{
            width: '40px',
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
          }}
        >
          <img
            src={creatorAvatar || '/placeholder.svg'}
            alt={creatorName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Helper to create hero item from post data
// Now supports engagement scoring and dynamic context labels
export function createHeroItem(
  post: any,
  engagementScore?: number,
  ageHours?: number
): HeroItem | null {
  if (!post) return null;

  const mediaUrl = post.media?.[0]?.media_url || post.src;
  const mediaType = (post.media?.[0]?.media_type || post.type) === 'video' ? 'video' : 'image';
  
  let posterUrl: string | undefined;
  if (mediaType === 'video' && mediaUrl) {
    posterUrl = getStreamPoster(mediaUrl, '1s') ?? undefined;
  }

  // Determine context label based on engagement and age
  let contextLabel = "RECOMMENDED FOR YOU";
  
  if (engagementScore !== undefined && ageHours !== undefined) {
    const VIRAL_THRESHOLD = 500;
    const HIGH_ENGAGEMENT_THRESHOLD = 200;
    
    if (ageHours < 6 && engagementScore > VIRAL_THRESHOLD) {
      contextLabel = "GOING VIRAL";
    } else if (ageHours < 24 && engagementScore > HIGH_ENGAGEMENT_THRESHOLD) {
      contextLabel = "TRENDING NOW";
    } else if (engagementScore > HIGH_ENGAGEMENT_THRESHOLD) {
      contextLabel = "POPULAR THIS WEEK";
    } else if (post.golfCourse?.id) {
      contextLabel = "FEATURED COURSE";
    } else if (post.user?.is_verified) {
      contextLabel = "FROM TOP CREATOR";
    }
  } else {
    // Fallback for older code paths without scoring
    contextLabel = "TRENDING TODAY";
  }

  return {
    id: post.id,
    contextLabel,
    title: post.title || post.caption || 'Featured moment',
    subContext: post.user?.name || post.course_name || '',
    mediaUrl,
    mediaType,
    posterUrl,
    ctaLabel: 'Watch',
    durationSeconds: post.durationSeconds,
    isPopular: post.isPopular,
    isTrending: post.isTrending,
    golfCourse: post.golfCourse,
    likes: post.likes,
    tags: post.tags,
    creator: post.user ? {
      id: post.user.id,
      name: post.user.display_name || post.user.name || post.user.username,
      avatarUrl: post.user.avatar || post.user.profile_photo_url || post.user.avatar_url,
    } : undefined,
  };
}
