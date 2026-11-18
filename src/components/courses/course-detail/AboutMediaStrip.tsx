import React, { useMemo, useRef } from 'react';
import { FIGS, FIGURE } from '@/lib/tokens/type';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Play, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClubMedia } from '@/hooks/useClubMedia';
import { useCourseMediaCounts } from '@/hooks/useCourseMediaCounts';

export interface MomentStripItem {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  posterUrl?: string | null;
}

/** Additive thumbnail mode for viewer-scoped media; canonical defaults stay unchanged. */
export const MomentMediaStrip: React.FC<{
  items: MomentStripItem[];
  onOpen: (index: number) => void;
}> = ({ items, onOpen }) => (
  <div
    style={{
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4,
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      willChange: 'transform',
    }}
  >
    {items.map((item, index) => (
      <button
        key={item.id}
        type="button"
        onClick={() => onOpen(index)}
        style={{
          position: 'relative',
          flex: '0 0 84px',
          width: 84,
          height: 84,
          overflow: 'hidden',
          border: 0,
          borderRadius: 8,
          padding: 0,
          background: A.PANEL,
          cursor: 'pointer',
        }}
      >
        <img
          src={item.posterUrl ?? item.mediaUrl}
          alt=""
          loading="lazy"
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {item.mediaType === 'video' ? (
          <Play
            aria-hidden="true"
            size={14}
            color={A.INK}
            fill={A.INK}
            style={{ position: 'absolute', right: 6, bottom: 6 }}
          />
        ) : null}
      </button>
    ))}
  </div>
);
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapRow, WORDS_SELECT } from '@/components/courses/useBrowseReviews';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { reviewFeedPost, latestReviewInput } from '@/lib/reviews/reviewFeedPost';
// groupMultiMedia intentionally not imported: posts are built one-per-parent-id already grouped.
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { AMBER } from '@/features/courses/_shared/tokens';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A, Action, KICKER, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';


interface AboutMediaStripProps {
  clubId: string;
  onSeeAllClick: () => void;
  /** §3.8 — the section heading above supplies the title and the counts. */
  headerless?: boolean;
  /** Page gutter. 16 for the legacy callers, 20 on the rebuilt Course tab. */
  gutter?: number;
}

/**
 * The fetch limit, exported so the §3.8 heading can read the SAME query at the
 * SAME limit and hit one cache entry rather than issuing a second request.
 */
export const mediaFetchLimit = (isMobile: boolean) => (isMobile ? 10 : 20);

/**
 * Analytical header (BRIEF_COURSE_TAB_LOWER_BLOCKS, Block 4c): uppercase
 * micro-label plus a count aside. No "See all" pill - the overflow tile is
 * the only affordance into the media tab.
 */
const Header: React.FC<{ photoCount: number; videoCount: number }> = ({
  photoCount,
  videoCount,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
      padding: '0 16px',
      marginBottom: 10,
    }}
  >
    <span style={KICKER}>MEDIA</span>
    <span style={{ ...LABEL, ...FIGS }}>
      {`${photoCount} ${photoCount === 1 ? 'photo' : 'photos'} \u00B7 ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`}
    </span>
  </div>
);


const AboutMediaStrip: React.FC<AboutMediaStripProps> = ({
  clubId,
  onSeeAllClick,
  headerless = false,
  gutter = 16,
}) => {
  const { t } = useTranslation('courses');
  const isMobile = useIsMobile();
  const navigate = useNavigate();


  const maxItems = isMobile ? 3 : 9;
  const fetchLimit = mediaFetchLimit(isMobile);
  const pad = `0 ${gutter}px`;

  const { data: rawMediaRaw, isLoading: loading } = useClubMedia(clubId, fetchLimit);

  interface ClubMediaItem {
    id: string;
    source?: 'post' | 'review';
    sourceId?: string;
    type: 'image' | 'video';
    url?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
    createdAt?: string;
    author?: {
      id?: string;
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    };
  }
  const rawMedia = rawMediaRaw as ClubMediaItem[] | undefined;

  /* CANONICAL_FULLSCREEN_VIEWER §3: review parents open as real reviews. ONE
     batched course_ratings read by id (useBrowseReviews' columns, viewer RLS)
     feeds the shared adapter; post parents get the course header from one
     golf_courses row. Post parents stay readOnly: no client read returns post
     like/comment counts and viewer-liked by id. */
  const reviewParentIds = useMemo(() => Array.from(new Set((rawMedia ?? [])
    .filter((item) => item.source === 'review' && item.sourceId).map((item) => item.sourceId as string))).sort(), [rawMedia]);
  const { data: parentReviews } = useQuery({
    queryKey: ['about-strip-reviews', clubId, reviewParentIds.join(',')],
    enabled: reviewParentIds.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<LatestReview[]> => {
      const { data, error } = await supabase.from('course_ratings').select(WORDS_SELECT).in('id', reviewParentIds);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data ?? []) as any[]).map((row) => mapRow(row)).filter((r): r is LatestReview => !!r);
    },
  });
  const { data: stripCourse } = useQuery({
    queryKey: ['about-strip-course', clubId],
    enabled: !!clubId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('golf_courses')
        .select('id, name, country, region, sub_country').eq('id', clubId).maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string | null; country: string | null; region: string | null; sub_country: string | null } | null;
    },
  });

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
    const byParent = new Map<string, ClubMediaItem[]>();
    for (const item of rawMedia) {
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
    for (const item of visible) {
      const parentId = item.sourceId || item.id;
      if (!seen.has(parentId)) {
        seen.add(parentId);
        visibleParentIds.push(parentId);
      }
    }
    const reviewsById = new Map((parentReviews ?? []).map((r) => [r.reviewId, r]));
    const posts: FeedPost[] = visibleParentIds.map((parentId) => {
      const group = byParent.get(parentId) ?? [];
      const first = group[0];
      const media = group.map((item) => ({
        id: item.id, type: item.type, url: item.url ?? '', posterUrl: item.thumbnailUrl ?? null,
        width: item.width ?? null, height: item.height ?? null, durationSeconds: item.duration ?? null,
      }));
      const fetched = first?.source === 'review' ? reviewsById.get(parentId) : undefined;
      if (first?.source === 'review') {
        // Review parent: the shared adapter, the strip's own tiles as its media.
        const base = fetched ? latestReviewInput(fetched) : {
          reviewId: parentId, userId: first.author?.id ?? null, username: first.author?.username,
          displayName: first.author?.displayName, avatarUrl: first.author?.avatarUrl, createdAt: first.createdAt,
          courseId: clubId, courseName: stripCourse?.name ?? '', rating: null,
          courseCountry: stripCourse?.country ?? null, courseRegion: stripCourse?.region ?? null,
          courseSubCountry: stripCourse?.sub_country ?? null, media: [],
        };
        return reviewFeedPost({ ...base, media });
      }
      const mediaItems: MediaItem[] = group.map((item) => {
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
        // Zero engagement is safe ONLY because post parents are per-post
        // readOnly (no by-id post engagement read exists client-side).
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: false,
        isFollowedByMe: false,
        tags: [],
        readOnly: true,
        courseId: clubId,
        courseName: stripCourse?.name ?? undefined,
        courseCountry: stripCourse?.country ?? undefined,
        courseRegion: stripCourse?.region ?? undefined,
        courseSubCountry: stripCourse?.sub_country ?? undefined,
      };
    });
    // Map each visible tile (by index) to its parent id, so click handlers
    // can resolve the post index quickly.
    const tileParentIds = visible.map((item) => item.sourceId || item.id);
    return { feedPosts: posts, tileParentIds };
  }, [rawMedia, maxItems, parentReviews, stripCourse, clubId]);

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

  const mediaTiles = (rawMedia ?? []).slice(0, maxItems).map((raw) => {
    const isVideo = raw.type === 'video';
    const url = raw.url;
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


  /* THE COUNTS COME FROM POSTGRES (§1), not from the length of this capped
     fetch. The client-side filter counted a review photograph twice when it had
     also been posted, and stopped at the 30-row limit. get_course_media_counts
     is the one definition: distinct media on published posts at this course
     plus review photographs not already posted, blocked authors excluded. */
  const { data: serverCounts } = useCourseMediaCounts(clubId);
  const photoCount = serverCounts?.photos ?? 0;
  const videoCount = serverCounts?.videos ?? 0;
  const totalCount = serverCounts?.total ?? 0;

  const hasMedia = mediaTiles.length > 0;
  const overflowCount = totalCount > maxItems ? totalCount - maxItems : 0;

  if (loading) {
    return (
      <div>
        {!headerless && <Header photoCount={0} videoCount={0} />}
        <div
          style={
            isMobile
              ? { display: 'grid', gridTemplateColumns: '2fr 1fr', gridAutoRows: 55, gap: 4, padding: pad }
              : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: pad }
          }
        >
          {Array.from({ length: maxItems }).map((_, i) => (
            <div
              key={i}
              style={
                isMobile && i === 0
                  ? { gridRow: '1 / span 2', height: '100%', borderRadius: 10, background: 'rgba(255,255,255,0.08)' }
                  : { height: '100%', borderRadius: 8, background: 'rgba(255,255,255,0.08)' }
              }
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state — analytical: dashed placeholders + one quiet text affordance
  if (!hasMedia) {
    return (
      <div>
        {!headerless && <Header photoCount={0} videoCount={0} />}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
            padding: pad,
            marginBottom: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px dashed rgba(255,255,255,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i === 0 && <Plus size={16} strokeWidth={2} color={A.DIM} />}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: A.MUTE, margin: `0 ${gutter}px`, lineHeight: 1.5 }}>
          {t('courseDetail.mediaStrip.helpDiscover')}
        </p>

        <div style={{ padding: pad }}>
          <Action
            label={t('courseDetail.mediaStrip.share')}
            onClick={() => navigate(`/courses/${clubId}/rate`)}
            align="left"
          />

        </div>
      </div>
    );
  }


  return (
    <div>
      {!headerless && <Header photoCount={photoCount} videoCount={videoCount} />}

      <div
        style={
          isMobile
            ? { display: 'grid', gridTemplateColumns: '2fr 1fr', gridAutoRows: 55, gap: 4, padding: pad }
            : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: pad }
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
                    options: { hasNextPage: false },
                  });
                }
              }}
              style={{
                position: 'relative',
                ...(isHero
                  ? { gridRow: '1 / span 2', height: '100%', borderRadius: 10 }
                  : { height: isMobile ? '100%' : undefined, aspectRatio: isMobile ? undefined : '1', borderRadius: 8 }),
                overflow: 'hidden',
                padding: 0,
                border: 'none',
                background: A.CANVAS,
                cursor: 'pointer',
              }}
              aria-label={t('courseDetail.a11y.openMediaTab')}
            >
              {media.poster ? (
                <img
                  src={media.poster}
                  alt=""
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.14)' }} />
              )}

              {media.media_type === 'video' && !showOverflow && (
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div className={CHIP_GLASS_CLASS} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Play size={14} color={A.INK} fill={A.INK} />
                  </div>
                </div>
              )}

              {showOverflow && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#2A313A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ ...FIGURE, color: A.INK, fontSize: 19 }}>+{overflowCount}</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 600 }}>{t('courseDetail.mediaStrip.seeAll')}</span>
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
