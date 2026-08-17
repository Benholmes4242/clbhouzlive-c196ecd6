import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MomentTile } from '@/components/explore-tab-new/courseled/MomentTile';
import {
  useMomentsOfTheWeek,
  type Moment,
} from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { PageRoot } from '@/components/layout/PageRoot';
import { useUserStatsCourseMap } from '@/contexts/UserStatsCoursesContext';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { CommunityCourseIndex } from './CommunityCourseIndex';
import { CommunityEverythingGrid } from './CommunityEverythingGrid';
import { CommunityRail, clampAspect, HEADING_STYLE, SCROLLER_GUTTER } from './CommunityRail';
import { CommunitySkeleton } from './CommunitySkeleton';
import { featuredMoment, useCommunityRails } from './useCommunityRails';
import { buildMomentQueue } from './momentQueue';

/**
 * COMMUNITY PAGE — the destination that replaced the moments see-all sheet.
 *
 * SHAPE, top to bottom:
 *   1  HEADER          title on the island's row + a filter chip row
 *   2  FEATURED LEAD   one RECENT moment (30d), TRUE ASPECT, full width
 *   3  RAILS           relevance-ordered, one tile per course
 *   4  BROWSE BY CLUB  twelve clubs, horizontal — a suggestion, not an index
 *   5  EVERYTHING      square 3-up incremental grid, the complete index
 *
 * ONE QUERY drives all of it, and ONE FILTER narrows all of it. A chip that
 * narrowed only the grid would leave the rails above it describing a pool the
 * member is no longer looking at.
 *
 * CHIP STATE IS COMPONENT STATE, never the URL: a filtered view is not a place
 * a member should be able to land on cold.
 */

const LEAD_MAX_H = 420;
const LEAD_MIN_H = 240;

const INK = '#0E1216';
const MUTE = '#A2A9B2';
const PANEL = '#EDF0F3';
const BORDER = '#E2E7EC';
const CANVAS = '#F8FAFC';
const HAIR = '#EDF0F3';

/** At most four region chips — past that the row is a directory again. */
const MAX_REGION_CHIPS = 4;

type ChipId = 'all' | 'video' | 'played' | `region:${string}`;

export default function CommunityPage() {
  const { t } = useTranslation('courses');

  // ALL-TIME pool (windowDays = null). The Discover section keeps its own
  // 30-day cache entry — separate query keys, no overwrite.
  const { data, isPending } = useMomentsOfTheWeek(null);
  const moments = useMemo(() => data ?? [], [data]);

  const playedMap = useUserStatsCourseMap();
  const [chip, setChip] = useState<ChipId>('all');

  /**
   * MEMBER REGION, derived rather than fetched: the region the member has played
   * in most, inside this very pool. Computed on the UNFILTERED pool so a chip
   * cannot move the member's home region.
   */
  const memberRegion = useMemo(() => {
    if (playedMap.size === 0) return null;
    const tally = new Map<string, number>();
    for (const m of moments) {
      if (!m.region || !playedMap.has(m.courseId)) continue;
      tally.set(m.region, (tally.get(m.region) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestN = 0;
    for (const [region, n] of tally) {
      if (n > bestN) {
        best = region;
        bestN = n;
      }
    }
    return best;
  }, [moments, playedMap]);

  /** Regions present in the pool, biggest first, capped. Labels are DATA. */
  const regions = useMemo(() => {
    const tally = new Map<string, number>();
    for (const m of moments) {
      if (!m.region) continue;
      tally.set(m.region, (tally.get(m.region) ?? 0) + 1);
    }
    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_REGION_CHIPS)
      .map(([region]) => region);
  }, [moments]);

  const pool = useMemo(() => {
    if (chip === 'all') return moments;
    if (chip === 'video') return moments.filter((m) => m.mediaType === 'video');
    if (chip === 'played') return moments.filter((m) => playedMap.has(m.courseId));
    const region = chip.slice('region:'.length);
    return moments.filter((m) => m.region === region);
  }, [moments, chip, playedMap]);

  const rails = useCommunityRails({ moments: pool, memberRegion });
  // ABSENT rather than stale: no fallback to an older moment or to the
  // unfiltered pool when the filtered pool has nothing inside 30 days.
  const lead = useMemo(() => featuredMoment(pool), [pool]);

  // NOTHING APPEARS TWICE: the lead is spent, so the grid beneath it never
  // repeats it. Keyed on the moment key, not on position — the lead is now a
  // video pick from anywhere in the ranked pool, not always the first item.
  const gridMoments = useMemo(
    () => (lead ? pool.filter((m) => m.key !== lead.key) : pool),
    [pool, lead],
  );

  // The viewer opens with its full action rail, exactly as Discover does:
  // this is a social browse surface. The QUEUE IS WHAT THE
  // MEMBER CAN SEE: under a filter it carries only filtered moments.
  // Each queued post LEADS with the media that earned its best-ranked tile, so
  // swiping onto it mounts that clip (and autoplays) rather than the post's
  // first media — the Clubhouse feed behaviour.
  const posts = useMemo(() => buildMomentQueue(pool), [pool]);

  const handleTile = useCallback(
    (m: Moment) => {
      analyticsEvents.track('community_moment_tapped', {
        course_id: m.courseId,
        post_id: m.post.id,
        media_index: m.mediaIndex ?? 0,
      });
      const index = Math.max(0, posts.findIndex((p) => p.id === m.post.id));
      openWithOrigin({
        posts,
        index,
        originEl: null,
        posterUrl: m.thumbnail,
        mediaIndex: m.mediaIndex ?? 0,
        mediaId: m.mediaId ?? null,
        openedFrom: 'community-page',
      });
    },
    [posts],
  );

  const leadHeight = lead
    ? Math.round(
        Math.min(LEAD_MAX_H, Math.max(LEAD_MIN_H, 340 / clampAspect(lead.aspect))),
      )
    : LEAD_MIN_H;

  const chips: { id: ChipId; label: string }[] = [
    { id: 'all', label: t('community.filter.all', 'All') },
    { id: 'video', label: t('community.filter.video', 'Video') },
    { id: 'played', label: t('community.filter.played', 'Played') },
    ...regions.map((r) => ({ id: `region:${r}` as ChipId, label: r })),
  ];

  return (
    <PageRoot style={{ background: CANVAS, minHeight: '100dvh' }}>
      {/* MASTHEAD — sticky. The title sits on the island back arrow's row,
          vertically centred, inset past the capsule. */}
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
            alignItems: 'center',
            padding: '0 16px 0 60px',
          }}
        >
          <h1
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: INK,
              margin: 0,
            }}
          >
            {t('discover.momentsFromCommunity', 'From the community')}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 6, ...SCROLLER_GUTTER }}>
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
                  background: on ? INK : PANEL,
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
        ) : moments.length === 0 ? (
          <div style={{ padding: '40px 16px', fontSize: 13, color: MUTE }}>
            {t('community.empty', 'No member media yet.')}
          </div>
        ) : (
          <>
            {lead && (
              <div style={{ padding: '0 16px 22px' }}>
                <MomentTile
                  moment={lead}
                  onPress={handleTile}
                  radius={10}
                  initialsSize={34}
                  labelSize={11}
                  labelInset={12}
                  autoplayGroup="community-lead"
                  style={{ height: leadHeight, width: '100%' }}
                />
              </div>
            )}

            {rails.map((rail) => (
              <CommunityRail
                key={rail.id}
                moments={rail.moments}
                title={t(`community.rails.${rail.titleKey}`, RAIL_FALLBACK[rail.id])}
                onTilePress={handleTile}
                autoplayGroup={`community-rail-${rail.id}`}
              />
            ))}

            <CommunityCourseIndex
              moments={pool}
              title={t('community.browseByClub', 'Browse by club')}
              countLabel={(n) =>
                t('community.count', { defaultValue: '{{count}} moments', count: n })
              }
            />

            <h2 style={HEADING_STYLE}>{t('community.everything', 'Everything')}</h2>
            <CommunityEverythingGrid moments={gridMoments} onTilePress={handleTile} />
          </>
        )}
      </main>
    </PageRoot>
  );
}

const RAIL_FALLBACK: Record<string, string> = {
  played: 'Courses you have played',
  nearby: 'Near you',
  top100: 'From the Top 100',
  busiest: 'Busiest clubs',
  video: 'In motion',
};
