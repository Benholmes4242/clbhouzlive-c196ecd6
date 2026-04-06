/**
 * VideosSubpage — /watch/videos
 * Ground-up rebuild. Self-contained — does not import or render
 * VideosTabContent, VideosFeed, VideosHeader, or VideosFeedSkeleton.
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Heart, MessageCircle, Share2, MapPin, MoreHorizontal,
  Bookmark, Link2, EyeOff, Flag, Film, Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideosFeed, type VideosFilter } from '@/components/videos-tab/hooks/useVideosFeed';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import CommentsSheet from '@/components/comments/CommentsSheet';
import PostContentWithTags from '@/components/posts/PostContentWithTags';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { removeGolfCourseFromContent, extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import type { FeedPost } from '@/components/media-system/types/media';

// Strip body classes synchronously at import time — before first paint
if (typeof document !== 'undefined') {
  document.body.classList.remove('route-clubhouse', 'route-hub');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatVideoDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTERS: { id: VideosFilter; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Popular' },
  { id: 'following', label: 'Following' },
];

function FilterChip({ label, isActive, onTap }: { label: string; isActive: boolean; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="flex items-center active:scale-[0.97] transition-transform whitespace-nowrap"
      style={{
        height: 32,
        padding: '0 14px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
        color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
        border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
      }}
    >
      {label}
    </button>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function VideoCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden border-b border-border/50">
      <Skeleton className="aspect-video w-full" />
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
        <Skeleton className="h-8 w-8 shrink-0" style={{ borderRadius: '28%' }} />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
      </div>
      <div className="px-3 pb-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Skeleton className="h-[34px] w-20 rounded-full" />
        <Skeleton className="h-[34px] w-20 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-[34px] w-20 rounded-full" />
      </div>
    </div>
  );
}

// ─── Mobile debug overlay ─────────────────────────────────────────────────────

function ArticleChildrenDebug() {
  const [children, setChildren] = useState<string[]>([]);

  useEffect(() => {
    const articleEl = document.querySelector('article[data-card-index="0"]');
    if (!articleEl) { setChildren(['❌ article not found']); return; }
    const kids = Array.from(articleEl.children).map((el, i) => {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      const cs = getComputedStyle(htmlEl);
      return `[${i}] ${el.tagName} h=${Math.round(rect.height)}px w=${Math.round(rect.width)}px display=${cs.display} visibility=${cs.visibility} opacity=${cs.opacity}`;
    });
    setChildren(kids);
  }, []);

  return (
    <div>
      <div style={{ color: '#ffd93d', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
        📦 Article children ({children.length}):
      </div>
      {children.map((c, i) => (
        <div key={i} style={{ color: '#ccc', fontFamily: 'monospace', fontSize: 11, marginBottom: 4, wordBreak: 'break-all' }}>
          {c}
        </div>
      ))}
    </div>
  );
}

function MobileDebugOverlay({ post, thumbnailUrl, cleanedCaption }: {
  post: FeedPost;
  thumbnailUrl: string;
  cleanedCaption: string | null;
}) {
  const [info, setInfo] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const cs = getComputedStyle(root);

    const articleEl = body.querySelector('article[data-card-index="0"]');
    const articleHeight = articleEl ? `${articleEl.getBoundingClientRect().height}px` : 'not found';
    const articleOverflow = articleEl ? getComputedStyle(articleEl).overflow : '?';

    setInfo({
      '👤 displayName': post.displayName || '❌ empty',
      '💬 caption': post.caption?.slice(0, 30) || '❌ empty',
      '🖼 thumbnail': thumbnailUrl ? '✅' : '❌ null',
      '❤️ likeCount': String(post.likeCount),
      '💬 commentCount': String(post.commentCount),
      '📐 articleHeight': articleHeight,
      '🔒 articleOverflow': articleOverflow,
      '🎨 --foreground': cs.getPropertyValue('--foreground').trim() || '❌',
      '🎨 --card': cs.getPropertyValue('--card').trim() || '❌',
      '🎨 --background': cs.getPropertyValue('--background').trim() || '❌',
      '📱 viewport W': `${window.innerWidth}px`,
      '📱 viewport H': `${window.innerHeight}px`,
      '📱 devicePixelRatio': String(window.devicePixelRatio),
      '📱 safeAreaTop': getComputedStyle(body).getPropertyValue('--sat') ||
        `env=${CSS.supports('padding-top', 'env(safe-area-inset-top)') ? '✅' : '❌'}`,
      '🏷 body classes': document.body.className || '— none',
      '🌐 userAgent': navigator.userAgent.slice(0, 60),
    });
  }, [post, thumbnailUrl, cleanedCaption]);

  if (!visible) return (
    <button
      onClick={() => setVisible(true)}
      style={{
        position: 'fixed', bottom: 100, right: 12, zIndex: 9999,
        background: '#ff0055', color: '#fff', borderRadius: 20,
        padding: '6px 12px', fontSize: 12, fontWeight: 700,
        border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      🔍 Debug
    </button>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, background: 'rgba(0,0,0,0.92)',
      overflowY: 'auto', padding: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>
          🔍 Mobile Debug — Card 0
        </span>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: '#ff0055', color: '#fff', border: 'none',
            borderRadius: 16, padding: '6px 14px', fontSize: 13, fontWeight: 700,
          }}
        >
          Close ✕
        </button>
      </div>

      {Object.entries(info).map(([key, val]) => (
        <div key={key} style={{
          borderBottom: '1px solid #333', paddingBottom: 8, marginBottom: 8,
        }}>
          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }}>{key}</div>
          <div style={{
            color: val.includes('❌') ? '#ff6b6b' : '#ffffff',
            fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
            wordBreak: 'break-all',
          }}>{val}</div>
        </div>
      ))}

      <ArticleChildrenDebug />
    </div>
  );
}

// ─── Single video card ────────────────────────────────────────────────────────

function VideoCard({
  post, userId, cardIndex, allPosts,
}: {
  post: FeedPost;
  userId?: string;
  cardIndex: number;
  allPosts: FeedPost[];
}) {
  const navigate = useNavigate();
  const { open } = useFullscreenFeedStore();

  const firstVideo = post.mediaItems.find(m => m.type === 'video');
  const thumbnailUrl = firstVideo?.thumbnailUrl || '';
  const duration = firstVideo?.duration || 0;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);

  const cleanedCaption = removeGolfCourseFromContent(post.caption);
  const extractedCourse = extractGolfCourseFromContent(post.caption);
  const courseNameToShow = post.review?.courseName || post.courseName || extractedCourse?.name || null;
  const courseIdToShow = post.review?.courseId || post.courseId || null;

  const handleTap = () => open(allPosts, cardIndex);

  const toggleLike = async () => {
    if (!userId) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount(prev => next ? prev + 1 : Math.max(0, prev - 1));
    navigator?.vibrate?.(10);
    try {
      if (next) {
        await supabase.from('post_likes').upsert(
          { post_id: post.id, user_id: userId, actor_id: userId, actor_type: 'personal' },
          { onConflict: 'post_id,actor_type,actor_id', ignoreDuplicates: true }
        );
      } else {
        await supabase.from('post_likes').delete()
          .eq('post_id', post.id).eq('actor_id', userId).eq('actor_type', 'personal');
      }
    } catch {
      setIsLiked(!next);
      setLikeCount(prev => next ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/video/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: post.caption || 'Check out this video', url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/video/${post.id}`);
    toast.success('Link copied');
  };

  const handleNotInterested = async () => {
    if (!userId) return;
    await supabase.from('post_dismissals').insert({ post_id: post.id, user_id: userId });
    toast.success("We'll show you less like this");
  };

  const handleReport = async () => {
    if (!userId) return;
    await supabase.from('post_reports').insert({ post_id: post.id, reporter_id: userId });
    toast.success('Report submitted');
  };

  const handleCourseNav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (courseIdToShow) { navigate(`/courses/${courseIdToShow}`); return; }
    if (!courseNameToShow) return;
    try {
      const { data } = await supabase.from('golf_courses').select('id')
        .ilike('name', courseNameToShow.trim()).limit(1).single();
      navigate(data?.id ? `/courses/${data.id}` : `/courses?search=${encodeURIComponent(courseNameToShow)}`);
    } catch {
      navigate(`/courses?search=${encodeURIComponent(courseNameToShow)}`);
    }
  };

  return (
    <>
      <article className="bg-card overflow-hidden border-b border-border/50">
        {/* ── TEMP MOBILE DEBUG ── */}
        {cardIndex === 0 && (
          <MobileDebugOverlay post={post} thumbnailUrl={thumbnailUrl} cleanedCaption={cleanedCaption} />
        )}
        {/* ── END TEMP MOBILE DEBUG ── */}
        {/* Thumbnail */}
        <button
          data-media-wrapper
          className="relative w-full aspect-video bg-muted cursor-pointer"
          onClick={handleTap}
          aria-label={`Play video by ${post.displayName}`}
        >
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          {duration > 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-medium rounded bg-black/70 text-white backdrop-blur-sm z-10">
              {formatVideoDuration(duration)}
            </span>
          )}
        </button>

        {/* Creator row */}
        <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
          <button onClick={() => navigate(`/profile/${post.userId}`)} className="shrink-0">
            <SquircleAvatar src={post.avatarUrl || '/placeholder.svg'} size="sm" hideRing />
          </button>
          <button onClick={() => navigate(`/profile/${post.userId}`)} className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-foreground truncate">{post.displayName}</span>
              {post.isVerified && (
                <svg className="h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs text-muted-foreground">· {timeAgo}</span>
            </div>
          </button>

          {/* ⋯ menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-full hover:bg-muted/60 transition-colors" aria-label="More options">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => toast.success('Saved')} className="gap-2 text-sm">
                <Bookmark className="h-4 w-4" /> Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink} className="gap-2 text-sm">
                <Link2 className="h-4 w-4" /> Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare} className="gap-2 text-sm">
                <Share2 className="h-4 w-4" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNotInterested} className="gap-2 text-sm">
                <EyeOff className="h-4 w-4" /> Not Interested
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="gap-2 text-sm text-destructive">
                <Flag className="h-4 w-4" /> Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Caption */}
        {cleanedCaption && (
          <div className="px-3 pb-1.5">
            <PostContentWithTags
              content={cleanedCaption}
              tags={post.tags || []}
              className="text-[13px] text-foreground line-clamp-1"
            />
          </div>
        )}

        {/* Course tag */}
        {courseNameToShow && (
          <div className="px-3 pb-1.5">
            <button onClick={handleCourseNav} className="flex items-center gap-1 hover:underline">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{courseNameToShow}</span>
            </button>
          </div>
        )}

        {/* Engagement row — pill buttons */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderTop: '1px solid hsl(var(--border) / 0.08)' }}
        >
          {/* Like */}
          <button
            onClick={toggleLike}
            aria-label={`${isLiked ? 'Unlike' : 'Like'} video`}
            className="flex items-center gap-1.5 active:scale-[0.95] transition-transform"
            style={{
              minHeight: 34, padding: '0 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              background: isLiked ? 'rgba(247,147,30,0.10)' : 'hsl(var(--muted) / 0.6)',
              border: isLiked ? '1px solid rgba(247,147,30,0.3)' : '1px solid hsl(var(--border) / 0.5)',
              color: isLiked ? '#c97a10' : 'hsl(var(--muted-foreground))',
            }}
          >
            <Heart
              className="h-[14px] w-[14px] transition-colors"
              style={{
                fill: isLiked ? '#F7931E' : 'transparent',
                color: isLiked ? '#F7931E' : 'hsl(var(--muted-foreground))',
              }}
            />
            <span>{formatCompact(likeCount)}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(true)}
            aria-label="Open comments"
            className="flex items-center gap-1.5 active:scale-[0.95] transition-transform"
            style={{
              minHeight: 34, padding: '0 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              background: 'hsl(var(--muted) / 0.6)',
              border: '1px solid hsl(var(--border) / 0.5)',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <MessageCircle className="h-[14px] w-[14px]" />
            <span>{formatCompact(post.commentCount)}</span>
          </button>

          <div className="flex-1" />

          {/* Share */}
          <button
            onClick={handleShare}
            aria-label="Share video"
            className="flex items-center gap-1.5 active:scale-[0.95] transition-transform"
            style={{
              minHeight: 34, padding: '0 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              background: 'hsl(var(--muted) / 0.6)',
              border: '1px solid hsl(var(--border) / 0.5)',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <Share2 className="h-[14px] w-[14px]" />
            <span>Share</span>
          </button>
        </div>
      </article>

      <CommentsSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        currentUserId={userId}
        creatorName={post.displayName}
        creatorAvatar={post.avatarUrl}
        creatorUserId={post.userId}
        caption={post.caption}
        videoThumbnail={thumbnailUrl}
        theme="light"
        likesCount={likeCount}
        courseId={post.review?.courseId}
        courseName={post.review?.courseName}
        isReview={post.isReview}
        reviewRating={post.review?.rating}
      />
    </>
  );
}

// ─── Feed list ────────────────────────────────────────────────────────────────

function VideoFeedList({
  posts, isLoading, isError, hasNextPage, isFetchingNextPage,
  fetchNextPage, refetch, userId, activeFilter,
}: {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  userId?: string;
  activeFilter: VideosFilter;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const guard = useRef(false);
  const { isOpen: fsOpen, appendPosts } = useFullscreenFeedStore();

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !guard.current) {
        guard.current = true;
        fetchNextPage();
        setTimeout(() => { guard.current = false; }, 300);
      }
    }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync into fullscreen overlay
  useEffect(() => {
    if (!fsOpen || posts.length === 0) return;
    appendPosts(posts);
  }, [posts.length, fsOpen, appendPosts]);

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 3 }).map((_, i) => <VideoCardSkeleton key={i} />)}
      </div>
    );
  }

  if (isError && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <span className="text-3xl mb-3">📡</span>
        <p className="text-[15px] font-semibold text-foreground">Something went wrong</p>
        <p className="text-[13px] text-muted-foreground mt-1">Check your connection and try again</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-6 py-2 rounded-full text-sm font-semibold bg-foreground text-background"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <span className="text-3xl mb-3">📹</span>
        <p className="text-[15px] font-semibold text-foreground">
          {activeFilter === 'following' ? 'Nothing here yet' : 'No long-form videos yet'}
        </p>
        <p className="text-[13px] text-muted-foreground mt-1">
          {activeFilter === 'following'
            ? 'Follow golfers to see their videos.'
            : 'Videos over 3 minutes will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0 pb-24">
      {posts.map((post, i) => (
        <VideoCard key={post.id} post={post} userId={userId} cardIndex={i} allPosts={posts} />
      ))}
      <div ref={sentinelRef} className="h-px" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function VideosSubpage() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [activeFilter, setActiveFilter] = useState<VideosFilter>('latest');

  // Strip body classes that bleed CSS variables from Clubhouse dark theme
  useLayoutEffect(() => {
    document.body.classList.remove('route-clubhouse', 'route-hub');
  }, []);

  const {
    posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch, resetSeen,
  } = useVideosFeed({ userId: user?.id, filter: activeFilter });

  const handleFilterChange = useCallback((filter: VideosFilter) => {
    setActiveFilter(filter);
    resetSeen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetSeen]);

  return (
    <div className="bg-background min-h-screen light" data-page-scope="videos">
      {/* Sticky header — safe area baked into paddingTop, top:0, no gap on load */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 29,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          paddingBottom: 10,
          background: 'hsl(var(--background))',
          borderBottom: '1px solid hsl(var(--border) / 0.12)',
        }}
      >
        {/* Back + title */}
        <div className="flex items-center gap-3 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
            style={{ background: 'rgba(0,0,0,0.06)' }}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-[18px] font-bold text-foreground">Videos</span>
          <div className="flex-1" />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 pt-2.5">
          {FILTERS.map(f => (
            <FilterChip
              key={f.id}
              label={f.label}
              isActive={activeFilter === f.id}
              onTap={() => handleFilterChange(f.id)}
            />
          ))}
        </div>
      </div>

      {/* Feed */}
      <VideoFeedList
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        userId={user?.id}
        activeFilter={activeFilter}
      />
    </div>
  );
}
