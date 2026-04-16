import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SquareCardMedia from '@/components/explore/media/SquareCardMedia';
import { CardType } from '@/components/explore/media/CardMediaTypes';
import { adaptClubMediaArrayToExploreItems } from '@/lib/adapters/clubMediaToExplore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClubMedia } from '@/hooks/useClubMedia';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { useCourseMediaViewerStore } from '@/components/course-media-tab/CourseMediaViewer';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

interface AboutMediaStripProps {
  clubId: string;
  onSeeAllClick: () => void;
}

const Header: React.FC<{ photoCount: number; videoCount: number; onSeeAll?: () => void }> = ({
  photoCount,
  videoCount,
  onSeeAll,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      marginBottom: 10,
    }}
  >
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Media</div>
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
        {photoCount} {photoCount === 1 ? 'photo' : 'photos'} · {videoCount}{' '}
        {videoCount === 1 ? 'video' : 'videos'}
      </div>
    </div>
    {onSeeAll && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSeeAll();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          color: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        See all <span style={{ fontSize: 14, color: '#CBD5E1' }}>›</span>
      </button>
    )}
  </div>
);

const AboutMediaStrip: React.FC<AboutMediaStripProps> = ({ clubId, onSeeAllClick }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const maxItems = isMobile ? 3 : 9;
  const fetchLimit = isMobile ? 10 : 20;

  const { data: rawMedia, isLoading: loading } = useClubMedia(clubId, fetchLimit);

  const items = useMemo(() => {
    if (!rawMedia) return [];
    const sliced = rawMedia.slice(0, maxItems);
    return adaptClubMediaArrayToExploreItems(sliced);
  }, [rawMedia, maxItems]);

  const feedPosts = useMemo((): FeedPost[] => {
    if (!rawMedia) return [];
    return rawMedia.slice(0, maxItems).map((item: any) => {
      const isVideo = item.type === 'video';
      const mediaItem: MediaItem = {
        id: item.id,
        type: isVideo ? 'video' : 'image',
        hlsUrl: isVideo ? item.url : undefined,
        imageUrl: !isVideo ? item.url : undefined,
        thumbnailUrl: item.thumbnailUrl || undefined,
        width: item.width || 1080,
        height: item.height || 1080,
        duration: item.duration || undefined,
      };
      return {
        id: item.id,
        userId: item.author?.id || '',
        actorType: 'personal' as const,
        actorId: item.author?.id || '',
        username: item.author?.username || '',
        displayName: item.author?.displayName || 'Golfer',
        avatarUrl: item.author?.avatarUrl || '',
        isVerified: false,
        creatorRelation: 'none' as const,
        caption: '',
        mediaItems: [mediaItem],
        createdAt: item.createdAt || new Date().toISOString(),
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

  const mediaTiles = (items ?? []).slice(0, maxItems).map((item) => {
    const src = item.src ?? '';
    const isVideo = item.type === 'video';

    if (isVideo) {
      const uid = extractStreamUidFromHls(src);
      const derivedThumb = uid ? streamThumb(uid) : undefined;
      const apiThumb =
        typeof item.media?.[0]?.media_url === 'string' && !item.media[0].media_url.endsWith('.m3u8')
          ? item.media[0].media_url
          : undefined;
      const thumb = apiThumb || derivedThumb;
      return {
        id: item.id,
        media_type: 'video' as const,
        media_url: thumb ?? '/placeholder.svg',
        thumbnail_url: thumb,
        poster_url: thumb,
      };
    }

    const img = item.media?.[0]?.media_url || src;
    return {
      id: item.id,
      media_type: 'image' as const,
      media_url: img || '/placeholder.svg',
      thumbnail_url: img || undefined,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '0 16px' }}>
          {Array.from({ length: maxItems }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 10,
                background: 'rgba(15,23,42,0.06)',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state — small ghost grid + prompt
  if (!hasMedia) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Media</div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            padding: '0 16px',
            marginBottom: 12,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 10,
                background: 'rgba(15,23,42,0.04)',
                border: '1px dashed rgba(15,23,42,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              {i === 0 ? '📷' : i === 1 ? '🎬' : '⛳'}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 16px 14px', lineHeight: 1.5 }}>
          No photos or videos yet — be the first to share your experience.
        </p>

        <div style={{ padding: '0 16px' }}>
          <button
            type="button"
            onClick={() => navigate(`/courses/${clubId}/rate`)}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              background: 'transparent',
              border: '1.5px solid rgba(15,23,42,0.1)',
              fontSize: 13,
              fontWeight: 700,
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            Share your experience
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header photoCount={photoCount} videoCount={videoCount} onSeeAll={onSeeAllClick} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: '0 16px' }}>
        {mediaTiles.map((media, index) => {
          const isLastTile = index === mediaTiles.length - 1;
          const showOverflow = isLastTile && overflowCount > 0;

          return (
            <button
              key={media.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (showOverflow) {
                  onSeeAllClick();
                } else {
                  useCourseMediaViewerStore.getState().open(feedPosts, index);
                }
              }}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 10,
                overflow: 'hidden',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              aria-label="Open Media tab"
            >
              <SquareCardMedia media={media} cardType={CardType.SQUARE} className="w-full h-full" />

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
                  <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>+{overflowCount}</span>
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
