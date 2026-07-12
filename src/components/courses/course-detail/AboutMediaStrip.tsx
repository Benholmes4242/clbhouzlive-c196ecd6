import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Play, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClubMedia } from '@/hooks/useClubMedia';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { openWithOrigin } from '@/lib/openWithOrigin';
// groupMultiMedia intentionally not imported: posts are built one-per-parent-id already grouped.
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { AMBER } from '@/features/courses/_shared/tokens';
import { SectionHeader } from '@/components/ui/SectionHeader';


interface AboutMediaStripProps {
  clubId: string;
  onSeeAllClick: () => void;
}

const Header: React.FC<{ photoCount: number; videoCount: number; onSeeAll?: () => void }> = ({
  photoCount,
  videoCount,
  onSeeAll,
}) => (
  <SectionHeader
    role="section"
    kicker="MEDIA"
    sub={`${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} · ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`}
    action={onSeeAll ? { label: 'See all', onClick: onSeeAll } : undefined}
    paddingX={16}
  />
);

const AboutMediaStrip: React.FC<AboutMediaStripProps> = ({ clubId, onSeeAllClick }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const maxItems = isMobile ? 3 : 9;
  const fetchLimit = isMobile ? 10 : 20;

  const { data: rawMedia, isLoading: loading } = useClubMedia(clubId, fetchLimit);

  // (Removed dependency on the legacy explore adapter; tiles derive
  //  directly from `rawMedia` below.)


  // Build ONE real FeedPost per parent (post/review), aggregating all of that
  // parent's media items. mediaId targets the tapped item; vertical swipe
  // browses BETWEEN parents. Posts arrive already grouped, so groupMultiMedia
  // is intentionally not called.
  const { feedPosts, tileParentIds } = useMemo((): {
    feedPosts: FeedPost[];
    tileParentIds: string[];
  } => {
    if (!rawMedia) return { feedPosts: [], tileParentIds: [] };
    const visible = rawMedia.slice(0, maxItems);
    // Preserve display order via first-seen parent id.
    const parentOrder: string[] = [];
    const byParent = new Map<string, any[]>();
    for (const item of rawMedia as any[]) {
      const parentId = item.sourceId || item.id;
      if (!byParent.has(parentId)) {
        parentOrder.push(parentId);
        byParent.set(parentId, []);
      }
      byParent.get(parentId)!.push(item);
    }
    // Only include parents that have at least one item in the visible tile set,
    // and order them by the first visible tile of each parent.
    const visibleParentIds: string[] = [];
    const seen = new Set<string>();
    for (const item of visible as any[]) {
      const parentId = item.sourceId || item.id;
      if (!seen.has(parentId)) {
        seen.add(parentId);
        visibleParentIds.push(parentId);
      }
    }
    const posts: FeedPost[] = visibleParentIds.map((parentId) => {
      const group = byParent.get(parentId) ?? [];
      const first = group[0];
      const mediaItems: MediaItem[] = group.map((item: any) => {
        const isVideo = item.type === 'video';
        return {
          id: item.id,
          type: isVideo ? 'video' : 'image',
          hlsUrl: isVideo ? item.url : undefined,
          imageUrl: !isVideo ? item.url : undefined,
          thumbnailUrl: item.thumbnailUrl || undefined,
          width: item.width || 1080,
          height: item.height || 1080,
          duration: item.duration || undefined,
        };
      });
      return {
        id: parentId,
        userId: first?.author?.id || '',
        actorType: 'personal' as const,
        actorId: first?.author?.id || '',
        username: first?.author?.username || '',
        displayName: first?.author?.displayName || 'Golfer',
        avatarUrl: first?.author?.avatarUrl || '',
        isVerified: false,
        creatorRelation: 'none' as const,
        caption: '',
        mediaItems,
        createdAt: first?.createdAt || new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: false,
        isFollowedByMe: false,
        tags: [],
      };
    });
    // Map each visible tile (by index) to its parent id, so click handlers
    // can resolve the post index quickly.
    const tileParentIds = (visible as any[]).map((item) => item.sourceId || item.id);
    return { feedPosts: posts, tileParentIds };
  }, [rawMedia, maxItems]);

  const extractStreamUidFromHls = (hls: string) => {
    try {
      const u = new URL(hls);
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] || null;
    } catch {
      return null;
    }
  };

  const streamThumb = (uid: string) => generateStreamThumbnailUrl(uid);

  const mediaTiles = (rawMedia ?? []).slice(0, maxItems).map((raw: any) => {
    const isVideo = raw.type === 'video';
    const url = raw.url as string | undefined;
    if (isVideo) {
      const uid = url ? extractStreamUidFromHls(url) : null;
      const thumb = raw.thumbnailUrl || (uid ? streamThumb(uid) : undefined);
      return {
        id: raw.id,
        media_type: 'video' as const,
        poster: thumb,
      };
    }
    return {
      id: raw.id,
      media_type: 'image' as const,
      poster: raw.thumbnailUrl || url || '/placeholder.svg',
    };
  });


  const { photoCount, videoCount, totalCount } = useMemo(() => {
    if (loading || !rawMedia) return { photoCount: 0, videoCount: 0, totalCount: 0 };
    const photos = rawMedia.filter((m: any) => m.type === 'image').length;
    const videos = rawMedia.filter((m: any) => m.type === 'video').length;
    const total = rawMedia.length;
    return { photoCount: photos, videoCount: videos, totalCount: total };
  }, [loading, rawMedia]);

  const hasMedia = mediaTiles.length > 0;
  const overflowCount = totalCount > maxItems ? totalCount - maxItems : 0;

  if (loading) {
    return (
      <div>
        <Header photoCount={0} videoCount={0} />
        <div
          style={
            isMobile
              ? { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 5, padding: '0 16px' }
              : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '0 16px' }
          }
        >
          {Array.from({ length: maxItems }).map((_, i) => (
            <div
              key={i}
              style={
                isMobile && i === 0
                  ? { gridRow: '1 / span 2', height: '100%', borderRadius: 14, background: 'rgba(15,23,42,0.06)' }
                  : { aspectRatio: '1', borderRadius: isMobile ? 12 : 10, background: 'rgba(15,23,42,0.06)' }
              }
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state — sibling of ratings empty state
  if (!hasMedia) {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <SectionHeader role="section" kicker="MEDIA" paddingX={16} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            padding: '0 16px',
            marginBottom: 14,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.04)',
                border: '1.5px dashed rgba(15,23,42,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i === 0 && (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(247,147,30,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={18} strokeWidth={2} color={AMBER} />
                </div>
              )}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 16px 12px', lineHeight: 1.5, textAlign: 'center' as const }}>
          Help fellow golfers discover this course — share your experience.
        </p>

        <div style={{ padding: '0 16px' }}>
          <button
            type="button"
            onClick={() => navigate(`/courses/${clubId}/rate`)}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 0',
              borderRadius: 13,
              background: AMBER,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(247,147,30,0.28)',
            }}
          >
            <Camera size={16} strokeWidth={2} />
            Share your experience
          </button>
        </div>
      </div>
    );
  }


  return (
    <div>
      <Header photoCount={photoCount} videoCount={videoCount} onSeeAll={onSeeAllClick} />

      <div
        style={
          isMobile
            ? { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 5, padding: '0 16px' }
            : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '0 16px' }
        }
      >
        {mediaTiles.map((media, index) => {
          const isHero = isMobile && index === 0 && mediaTiles.length >= 3;
          const isLastTile = index === mediaTiles.length - 1;
          const showOverflow = isLastTile && overflowCount > 0;
          const btnRef = React.createRef<HTMLButtonElement>();

          return (
            <button
              key={media.id}
              ref={btnRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (showOverflow) {
                  onSeeAllClick();
                } else {
                  const parentId = tileParentIds[index];
                  const mediaId = media.id;
                  const parentIndex = Math.max(0, feedPosts.findIndex((p) => p.id === parentId));
                  const parent = feedPosts[parentIndex];
                  const posterUrl = parent?.mediaItems?.find((m) => m.id === mediaId)?.thumbnailUrl
                    || parent?.mediaItems?.[0]?.thumbnailUrl
                    || null;
                  openWithOrigin({
                    posts: feedPosts,
                    index: parentIndex,
                    originEl: btnRef.current,
                    posterUrl,
                    mediaId,
                    openedFrom: 'about-strip',
                    options: { readOnly: true, hasNextPage: false },
                  });
                }
              }}
              style={{
                position: 'relative',
                ...(isHero
                  ? { gridRow: '1 / span 2', height: '100%', borderRadius: 14 }
                  : { aspectRatio: '1', borderRadius: isMobile ? 12 : 10 }),
                overflow: 'hidden',
                padding: 0,
                border: 'none',
                background: '#0F172A',
                cursor: 'pointer',
              }}
              aria-label="Open Media tab"
            >
              {media.poster ? (
                <img
                  src={media.poster}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(15,23,42,0.08)' }} />
              )}

              {media.media_type === 'video' && !showOverflow && (
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Play size={14} color="#fff" fill="#fff" />
                  </div>
                </div>
              )}

              {showOverflow && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ color: '#fff', fontSize: 19, fontWeight: 800 }}>+{overflowCount}</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 600 }}>See all</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}

      </div>
    </div>
  );
};

export default AboutMediaStrip;
