/** BRIEF_COURSES_LATEST_FROM_COURSES §1-3 — "Through members' eyes / Latest
 * from the courses": one card per course from get_latest_course_media (RPC
 * owns one row per course, newest member shot first, at most 30; we ask for
 * 15). BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS §3 — tapping a tile opens the
 * CANONICAL full-screen viewer (FullscreenFeedOverlay via openWithOrigin,
 * readOnly) over ONE run through every photo and video of that course,
 * starting on the tapped shot. The set is still the course's media from
 * get_course_media_v2 via useGalleryCourseMedia, in the Media tab's order,
 * exploded post-then-media into one page per shot, each credited to the
 * member who added it. This rail never starts video playback; video tiles
 * draw their poster. */
import { useEffect, useState } from 'react';
import { useGamRpc } from '@/hooks/gam/_useGamRpc';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useGalleryCourseMedia } from '@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia';
import { coursePostsToShotPosts } from '@/lib/courseMedia/memberShotPosts';
import { openWithOrigin } from '@/lib/openWithOrigin';
import type { FeedPost } from '@/components/media-system/types/media';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { useSectionReady } from './PageLoadGate';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { RAIL_BLEED } from './format';
import { PHOTO_FIGURE_GAP } from './PhotoFigureCard';
import { LatestCoursesShell } from './sectionShells';

/* Card geometry, read by the card AND its shell (BRIEF_COURSES_SKELETONS 2.3). */
export const LATEST_COURSE_W = 300;
export const LATEST_COURSE_H = 230;
export const LATEST_COURSE_BIG_W = 198;
export const LATEST_COURSE_SMALL_W = 100;
export const LATEST_COURSE_SMALL_H = 114;

export interface LatestCourseMediaTile {
  post_id: string;
  media_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url: string | null;
  stream_id: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface LatestCourseMedia {
  course_id: string;
  course_name: string;
  media_count: number;
  contributor_count: number;
  latest_member_name: string | null;
  tiles: LatestCourseMediaTile[];
}

interface PendingOpen {
  courseId: string;
  postId: string;
  mediaId: string;
  mediaUrl: string;
  posterUrl: string | null;
}

const tileImage = (tile: LatestCourseMediaTile) =>
  tile.media_type === 'video' ? holeMediaPoster(tile) : tile.media_url;

function creditLine(row: LatestCourseMedia): string | null {
  const name = row.latest_member_name;
  if (!name) return null;
  const others = row.contributor_count - 1;
  if (others <= 0) return name;
  if (others === 1) return `${name} and 1 other`;
  return `${name} and ${others} others`;
}

/** §3 — the position of the tapped shot in the exploded list: media id, then
 * any url match, then the first shot of the tapped post, then 0. */
function shotStartIndex(posts: readonly FeedPost[], pending: PendingOpen): number {
  let index = posts.findIndex(p => p.mediaItems[0]?.id === pending.mediaId);
  if (index < 0) {
    index = posts.findIndex(p => {
      const item = p.mediaItems[0];
      return item != null && (item.imageUrl === pending.mediaUrl || item.mp4Url === pending.mediaUrl
        || item.hlsUrl === pending.mediaUrl || item.thumbnailUrl === pending.mediaUrl);
    });
  }
  if (index < 0) index = posts.findIndex(p => p.id.startsWith(`${pending.postId}::`));
  return index < 0 ? 0 : index;
}

function LatestCourseCard({ row, pending, onOpen }: {
  row: LatestCourseMedia;
  pending: boolean;
  onOpen: (tile: LatestCourseMediaTile) => void;
}) {
  const credit = creditLine(row);
  const cells: Array<LatestCourseMediaTile | null> = [row.tiles[0] ?? null, row.tiles[1] ?? null, row.tiles[2] ?? null];
  return (
    <div
      style={{
        width: LATEST_COURSE_W, height: LATEST_COURSE_H, flex: 'none',
        display: 'grid', gridTemplateColumns: `${LATEST_COURSE_BIG_W}px ${LATEST_COURSE_SMALL_W}px`,
        gridTemplateRows: `${LATEST_COURSE_SMALL_H}px ${LATEST_COURSE_SMALL_H}px`,
        gap: 2, overflow: 'hidden', background: A.PANEL,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {cells.map((tile, i) => {
        const cellStyle: React.CSSProperties = {
          position: 'relative', overflow: 'hidden', background: A.PANEL,
          ...(i === 0 ? { gridRow: '1 / 3' } : {}),
        };
        if (!tile) return <div key={i} style={cellStyle} />;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Open ${row.course_name} shot ${i + 1} of ${row.media_count}`}
            disabled={pending}
            onClick={() => onOpen(tile)}
            style={{ ...cellStyle, padding: 0, border: 0, cursor: 'pointer', textAlign: 'left' }}
          >
            <img
              src={tileImage(tile)}
              alt=""
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              onError={event => { event.currentTarget.hidden = true; }}
            />
            {i === 0 && <>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 45%)' }} />
              <div style={{ position: 'absolute', top: 14, left: 14 }}>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                  {row.media_count}
                </div>
                <div style={{ marginTop: 5, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  {row.media_count === 1 ? 'Member shot' : 'Member shots'}
                </div>
              </div>
              <div style={{ position: 'absolute', left: 14, right: 12, bottom: 13 }}>
                <div style={{
                  fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#FFFFFF',
                  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                }}>
                  {row.course_name}
                </div>
                {credit && <div style={{ marginTop: 5, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.78)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {credit}
                </div>}
              </div>
            </>}
            {i > 0 && tile.media_type === 'video' && (
              <span
                className="glass-chip"
                aria-hidden="true"
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFFFFF', fontSize: 11, paddingLeft: 2,
                }}
              >{'▶'}</span>
            )}
            {i === 2 && row.media_count > 3 && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(10,10,12,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontSize: 15, fontWeight: 700,
              }}>
                +{row.media_count - 3}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function LatestCoursesSection() {
  const { user } = useSupabaseSession();
  const { data, isLoading, isError } = useGamRpc<LatestCourseMedia[]>('get_latest_course_media', { p_limit: 15 }, { staleTime: 60_000 });
  useSectionReady('latestCourses', !isLoading);
  const [pending, setPending] = useState<PendingOpen | null>(null);
  const [viewer, setViewer] = useState<{ items: OrderedMediaItem[]; start: number } | null>(null);
  const gallery = useGalleryCourseMedia(pending?.courseId ?? null, user?.id);

  // §1-5 — once the course's media set arrives, flatten it into one sideways
  // run and open MediaPreviewViewer on the tapped shot (media id, then url,
  // then post id, then 0). An empty or errored set just clears the tap.
  useEffect(() => {
    if (!pending) return;
    if (gallery.isError) { setPending(null); return; }
    const posts = gallery.data;
    if (!posts) return;
    const flat = flattenShots(posts);
    if (flat.length === 0) { setPending(null); return; }
    const start = flatStartIndex(flat, pending);
    setViewer({ items: toViewerItems(flat, pending.courseName), start });
    setPending(null);
  }, [gallery.data, gallery.isError, pending]);

  if (isLoading) return <LatestCoursesShell />;
  if (isError || !data || data.length < 3) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="Through members' eyes" title="Latest from the courses" />
      <div className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: PHOTO_FIGURE_GAP, marginTop: HEAD_GAP }}>
        {data.map(row => (
          <LatestCourseCard
            key={row.course_id}
            row={row}
            pending={pending?.courseId === row.course_id}
            onOpen={tile => {
              if (pending) return;
              setPending({
                courseId: row.course_id,
                courseName: row.course_name,
                postId: tile.post_id,
                mediaId: tile.media_id,
                mediaUrl: tile.media_url,
              });
            }}
          />
        ))}
      </div>
      {viewer && (
        <MediaPreviewViewer
          items={viewer.items}
          initialIndex={viewer.start}
          edgeBounce
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  );
}
