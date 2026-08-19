import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clapperboard, Film, Image as ImageIcon } from 'lucide-react';

import {
  CommunityClipTile,
  CommunityVideoTile,
} from '@/components/explore-tab-new/courseled/CommunityMediaTiles';
import {
  useCommunityLibrary,
  type CommunityLibraryItem,
} from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';
import { Eyebrow } from '@/components/explore-tab-new/courseled/tokens';
import { PageRoot } from '@/components/layout/PageRoot';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { CommunityCourseIndex } from './CommunityCourseIndex';
import { CommunityPhotoMosaic } from './CommunityPhotoMosaic';
import { CommunitySkeleton } from './CommunitySkeleton';

/**
 * COMMUNITY PAGE — the destination the Discover video rails and the mosaic's
 * "see all" point at (BRIEF_COMMUNITY_PAGE_REBUILD).
 *
 * IT READS THE WHOLE LIBRARY. It used to call useMomentsOfTheWeek(null), which
 * is all-time but still COURSE-TAGGED — six of 242 media posts carry a tag, so
 * the destination showed less than the rails pointing at it. It now reads
 * useCommunityLibrary: every published post with media, all-time, no tag
 * predicate, newest first.
 *
 * SHAPE, top to bottom:
 *   1  HEADER          title, subline, media-kind chips
 *   2  FEATURED FILM   newest long video, full width, 16:9 — headless lead
 *   3  CLIPS           3-up grid of 9:16 verticals
 *   4  LATEST VIDEOS   landscape rows, long form
 *   5  PHOTOS          the mosaic
 *   6  BROWSE BY CLUB  last, and only over tagged content
 *
 * WHY CLIPS SIT ABOVE VIDEOS HERE AND BELOW THEM ON DISCOVER — deliberate, do
 * NOT "align" the two later. Discover is a feed being passed THROUGH, so the
 * long film is the arresting thing that earns a stop. This is a DESTINATION the
 * member chose to enter, and 108 of 121 videos are clips: the depth is in the
 * clips, so the clips come first.
 *
 * CLIPS ARE A GRID, NOT A RAIL. A rail asks for a swipe and shows three; a grid
 * shows nine and says there is depth here. A destination shows depth.
 *
 * CARRIED FORWARD FROM THE OLD PAGE, VERBATIM IN BEHAVIOUR:
 *   - ONE QUERY drives everything, so a chip can never leave a section
 *     describing a pool the member is no longer looking at;
 *   - THE LEAD IS SPENT, so nothing below repeats the featured film;
 *   - ABSENT RATHER THAN STALE — a section with nothing in it does not render;
 *   - CHIP STATE IS COMPONENT STATE, never the URL: a filtered view is not a
 *     place a member should land on cold.
 *
 * REGION CHIPS ARE GONE, with the memberRegion derivation that fed them: they
 * filtered on a course tag 97.5% of this pool does not have.
 */

const INK = '#0E1216';
const MUTE = '#A2A9B2';
const BORDER = '#E2E7EC';
const CANVAS = '#F8FAFC';
const HAIR = '#EDF0F3';

/** Long video rows mounted. Past this the page is a feed, not a section. */
const VIDEO_ROWS_CAP = 24;
/** Clips grid tiles mounted — multiples of three keep whole rows. */
const CLIPS_CAP = 30;

type ChipId = 'all' | 'clips' | 'videos' | 'photos';

export default function CommunityPage() {
  const { t } = useTranslation('courses');
  const { data, isPending } = useCommunityLibrary();

  const all = useMemo(() => data?.all ?? [], [data]);
  const clipsPool = useMemo(() => data?.clips ?? [], [data]);
  const videosPool = useMemo(() => data?.videos ?? [], [data]);
  const photosPool = useMemo(() => data?.photos ?? [], [data]);

  const [chip, setChip] = useState<ChipId>('all');

  /** THE LEAD: the NEWEST long video. The pool is already newest-first. */
  const featured = videosPool[0] ?? null;
  /** THE LEAD IS SPENT — the rows below never repeat it. */
  const videoRows = useMemo(
    () => (featured ? videosPool.filter((v) => v.key !== featured.key) : videosPool),
    [videosPool, featured],
  );

  /**
   * A CHIP HIDES WHOLE SECTIONS rather than filtering inside them, so a member
   * on Clips is looking at the clips grid and nothing else.
   */
  const showFilm = chip === 'all' || chip === 'videos';
  const showClips = chip === 'all' || chip === 'clips';
  const showVideos = chip === 'all' || chip === 'videos';
  const showPhotos = chip === 'all' || chip === 'photos';

  /**
   * THE QUEUE IS WHAT THE MEMBER CAN SEE. Under a chip it carries only the
   * visible sections, in the order they are read on the page, so swiping in the
   * fullscreen viewer follows the page rather than the database.
   */
  const visible = useMemo<CommunityLibraryItem[]>(() => {
    const out: CommunityLibraryItem[] = [];
    if (showFilm && featured) out.push(featured);
    if (showClips) out.push(...clipsPool.slice(0, CLIPS_CAP));
    if (showVideos) out.push(...videoRows.slice(0, VIDEO_ROWS_CAP));
    if (showPhotos) out.push(...photosPool);
    return out;
  }, [showFilm, featured, showClips, clipsPool, showVideos, videoRows, showPhotos, photosPool]);

  const posts = useMemo(() => visible.map((i) => i.post), [visible]);

  const handlePress = useCallback(
    (item: { postId: string; thumbnail: string | null }) => {
      const found = visible.find((i) => i.postId === item.postId);
      analyticsEvents.track('community_moment_tapped', {
        course_id: found?.courseId ?? null,
        post_id: item.postId,
        media_index: found?.mediaIndex ?? 0,
      });
      const index = Math.max(0, posts.findIndex((p) => p.id === item.postId));
      openWithOrigin({
        posts,
        index,
        originEl: null,
        posterUrl: item.thumbnail,
        mediaIndex: found?.mediaIndex ?? 0,
        mediaId: found?.mediaId ?? null,
        openedFrom: 'community-page',
      });
    },
    [posts, visible],
  );

  const chips: { id: ChipId; label: string }[] = [
    { id: 'all', label: t('community.chips.everything', 'Everything') },
    { id: 'clips', label: t('community.chips.clips', 'Clips') },
    { id: 'videos', label: t('community.chips.videos', 'Videos') },
    { id: 'photos', label: t('community.chips.photos', 'Photos') },
  ];

  return (
    <PageRoot style={{ background: CANVAS, minHeight: '100dvh' }}>
      {/* MASTHEAD — sticky, real from the first frame. The title sits on the
          island back arrow's row, inset past the capsule. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: CANVAS,
          borderBottom: `0.5px solid ${HAIR}`,
          padding: '0 0 8px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        }}
      >
        <div
          style={{
            minHeight: 44,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 16px 0 60px',
          }}
        >
          <h1
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: INK,
              margin: 0,
            }}
          >
            {t('community.heading', 'From the community')}
          </h1>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: MUTE, marginTop: 1 }}>
            {t('community.subline', 'Everything members have filmed and photographed')}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            padding: '8px 16px 0',
            scrollbarWidth: 'none',
          }}
        >
          {chips.map((c) => {
            const on = c.id === chip;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChip(c.id)}
                style={{
                  flex: 'none',
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  background: on ? INK : '#FFFFFF',
                  color: on ? '#FFFFFF' : MUTE,
                  border: on ? '1px solid transparent' : `1px solid ${BORDER}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nav-visible page: flat 88 bottom per spacing canon. */}
      <main style={{ paddingTop: 16, paddingBottom: 88 }}>
        {isPending ? (
          <CommunitySkeleton />
        ) : all.length === 0 ? (
          <div style={{ padding: '40px 16px', fontSize: 13, color: MUTE }}>
            {t('community.empty', 'No member media yet.')}
          </div>
        ) : (
          <>
            {/* FEATURED FILM — headless: it IS the lead, so a heading above it
                would only repeat the masthead. Landscape 16:9, full width: long
                form is framed landscape and a vertical crop cuts off what the
                creator composed. */}
            {showFilm && featured && (
              <div style={{ padding: '0 16px 22px' }}>
                <CommunityVideoTile
                  item={featured}
                  railVisible
                  onPress={handlePress}
                  width="100%"
                />
              </div>
            )}

            {showClips && clipsPool.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <Eyebrow
                  icon={Film}
                  subline={t('community.sections.clips.subline', 'Short and vertical')}
                >
                  {t('community.sections.clips.title', 'Clips')}
                </Eyebrow>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 6,
                    padding: '0 16px',
                  }}
                >
                  {clipsPool.slice(0, CLIPS_CAP).map((item) => (
                    <CommunityClipTile
                      key={item.key}
                      item={item}
                      railVisible
                      onPress={handlePress}
                      width="100%"
                    />
                  ))}
                </div>
              </section>
            )}

            {showVideos && videoRows.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <Eyebrow
                  icon={Clapperboard}
                  subline={t('community.sections.videos.subline', 'Three minutes and over')}
                >
                  {t('community.sections.videos.title', 'Latest videos')}
                </Eyebrow>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: '0 16px',
                  }}
                >
                  {videoRows.slice(0, VIDEO_ROWS_CAP).map((item) => (
                    <CommunityVideoTile
                      key={item.key}
                      item={item}
                      railVisible
                      onPress={handlePress}
                      width="100%"
                    />
                  ))}
                </div>
              </section>
            )}

            {showPhotos && photosPool.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <Eyebrow
                  icon={ImageIcon}
                  subline={t('community.sections.photos.subline', 'Stills from members')}
                >
                  {t('community.sections.photos.title', 'Photos')}
                </Eyebrow>
                <div style={{ padding: '0 16px' }}>
                  <CommunityPhotoMosaic items={photosPool} onPress={handlePress} />
                </div>
              </section>
            )}

            {/* BROWSE BY CLUB ALWAYS RENDERS, and last: it covers only tagged
                content, so its subline says so rather than looking broken. */}
            <CommunityCourseIndex
              items={all}
              title={t('community.sections.clubs.title', 'Browse by club')}
              subline={t('community.sections.clubs.subline', 'Only where a course was tagged')}
              countLabel={(n) =>
                t('community.count', { defaultValue: '{{count}} posts', count: n })
              }
            />
          </>
        )}
      </main>
    </PageRoot>
  );
}
