import React, { forwardRef, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { AlertCircle, Camera, Loader2 } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { CourseMediaTile } from './CourseMediaTile';
import { CourseMediaLandscapeCard } from './CourseMediaLandscapeCard';
import { CourseMediaGridSkeleton } from './CourseMediaGridSkeleton';

interface CourseMediaGridProps {
  posts: FeedPost[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  courseName?: string;
  courseId?: string;
}

function isLandscape(post: FeedPost): boolean {
  const firstMedia = post.mediaItems[0];
  if (!firstMedia) return false;
  return firstMedia.width > firstMedia.height;
}

export const CourseMediaGrid = forwardRef<HTMLDivElement, CourseMediaGridProps>(({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  courseName,
  courseId,
}, ref) => {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Sync new posts into fullscreen overlay
  const { isOpen: isFullscreenOpen, appendPosts } = useFullscreenFeedStore();

  useEffect(() => {
    if (!isFullscreenOpen) return;
    if (posts.length > 0) {
      appendPosts(posts);
    }
  }, [posts.length, isFullscreenOpen, appendPosts]);

  if (isLoading) return <CourseMediaGridSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="text-base font-semibold text-foreground">Couldn't load media</p>
        <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#f59e0b] text-white hover:bg-[#e8920f] active:scale-[0.97] transition-all min-h-[44px]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ paddingBottom: 40 }}>
        {/* Hero empty */}
        <div style={{ padding: '44px 24px 28px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(247,147,30,0.07)', border: '1.5px solid rgba(247,147,30,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 30 }}>
            📸
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>No media yet</div>
          <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, maxWidth: 270, margin: '0 auto 24px' }}>
            Be the first to capture {courseName || 'this course'} — photos and videos from your round help fellow golfers discover it.
          </p>
          <button
            type="button"
            onClick={() => courseId && navigate(`/courses/${courseId}/rate`)}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: 'linear-gradient(90deg, #F59E0B, #F7931E)', color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(247,147,30,0.28)', marginBottom: 10 }}
          >
            📷 Share your experience
          </button>
          <button
            type="button"
            onClick={() => navigate('/share')}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: 'transparent', color: '#0F172A', fontSize: 13, fontWeight: 700, border: '1.5px solid rgba(15,23,42,0.1)', cursor: 'pointer' }}
          >
            🎬 Upload a video
          </button>
        </div>

        <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '0 16px 24px' }} />

        {/* What to share guide */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>What to share</span>
          </div>
          {[
            { icon: '⛳', label: 'Signature holes', sub: 'Show the world what makes this course special' },
            { icon: '🎬', label: 'Shots from your round', sub: 'Short clips of your best moments on the course' },
            { icon: '🌅', label: 'Views & atmosphere', sub: 'Sunsets, landscapes, the feeling of being there' },
            { icon: '🏠', label: 'Clubhouse & facilities', sub: 'Help others know what to expect before they visit' },
          ].map(({ icon, label, sub }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.02)', border: '0.5px solid rgba(15,23,42,0.06)' }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ghost grid preview */}
        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 12, background: '#F7931E', borderRadius: 1 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Your gallery awaits</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.3, pointerEvents: 'none' }}>
            <div style={{ height: 160, borderRadius: 6, background: 'linear-gradient(135deg,#0f172a,#1e293b)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <div style={{ aspectRatio: '3/4', borderRadius: 6, background: 'linear-gradient(135deg,#1e293b,#334155)' }} />
              <div style={{ aspectRatio: '3/4', borderRadius: 6, background: 'linear-gradient(135deg,#334155,#475569)' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  let tileIndex = 0;
  const [firstPost, ...restPosts] = posts;
  const firstMediaKey = firstPost?.mediaItems[0]?.id || firstPost?.id;
  const firstIsLandscape = firstPost ? isLandscape(firstPost) : false;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Hero tile — first post, full width, taller */}
      {firstPost && (
        <div style={{ position: 'relative' }}>
          {firstIsLandscape ? (
            <CourseMediaLandscapeCard
              key={firstMediaKey}
              post={firstPost}
              index={tileIndex++}
              allPosts={posts}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          ) : (
            <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
              <CourseMediaTile
                key={firstMediaKey}
                post={firstPost}
                index={tileIndex++}
                allPosts={posts}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            </div>
          )}
          {/* Featured badge */}
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(247,147,30,0.92)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '3px 8px', fontSize: 8, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', pointerEvents: 'none', zIndex: 2 }}>
            Featured
          </div>
        </div>
      )}

      {/* Rest of posts — 2-col grid, landscape cards span full width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, gridAutoFlow: 'dense' }}>
        {restPosts.map((post) => {
          const mediaKey = post.mediaItems[0]?.id || post.id;
          if (isLandscape(post)) {
            const idx = tileIndex++;
            return (
              <div key={mediaKey} style={{ gridColumn: '1 / -1' }}>
                <CourseMediaLandscapeCard
                  post={post}
                  index={idx}
                  allPosts={posts}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
            );
          }
          const idx = tileIndex++;
          return (
            <CourseMediaTile
              key={mediaKey}
              post={post}
              index={idx}
              allPosts={posts}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          );
        })}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ gridColumn: '1 / -1', height: 1 }} />

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
            <Loader2 className="w-5 h-5 animate-spin text-[#f59e0b]" />
          </div>
        )}
      </div>
    </div>
  );
});

CourseMediaGrid.displayName = 'CourseMediaGrid';
