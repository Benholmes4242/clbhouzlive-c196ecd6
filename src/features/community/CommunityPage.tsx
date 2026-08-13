import { useCallback, useMemo } from 'react';
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
import { CommunityRail, clampAspect } from './CommunityRail';
import { CommunitySkeleton } from './CommunitySkeleton';
import { featuredMoment, useCommunityRails } from './useCommunityRails';

/**
 * COMMUNITY PAGE (BRIEF_COMMUNITY_PAGE_V2) — the destination that replaced the
 * moments see-all sheet.
 *
 * WHY A PAGE, NOT A SHEET. The sheet promised "the complete month" and delivered
 * a scrolling wall inside a 95dvh box with no address, no back stack and no way
 * to link to it. A month of member media across 57 clubs is a section of the
 * product, so it gets a route.
 *
 * SHAPE, top to bottom:
 *   1  FEATURED LEAD    one recent moment, TRUE ASPECT, full width
 *   2  RAILS            relevance-ordered, ALL-TIME pool (useCommunityRails)
 *   3  COURSE INDEX     every club with media, grouped by region — text rows
 *   4  EVERYTHING       square 3-up incremental grid, the complete index
 *
 * ONE QUERY drives all four. The rails, the index and the grid are readings of
 * the same array, so they cannot disagree about what exists.
 *
 * HEADER: the chrome-v2 registry gives this route the island BACK capsule, so
 * the page's own sticky masthead carries the TITLE ONLY — a second back arrow
 * would be two ways to do one thing.
 */

/** Height of the featured lead. Its WIDTH is the column; aspect drives nothing
 *  but the crop, so a landscape lead is short and a portrait lead is tall. */
const LEAD_MAX_H = 420;
const LEAD_MIN_H = 240;

const INK = '#0E1216';
const DIM = '#A2A9B2';
const CANVAS = '#F8FAFC';
const HAIR = '#EDF0F3';

export default function CommunityPage() {
  const { t } = useTranslation('courses');

  // ALL-TIME pool (windowDays = null). The Discover section keeps its own
  // 30-day cache entry — separate query keys, no overwrite.
  const { data, isPending } = useMomentsOfTheWeek(null);
  const moments = useMemo(() => data ?? [], [data]);

  const playedMap = useUserStatsCourseMap();

  /**
   * MEMBER REGION, derived rather than fetched: the region the member has played
   * in most, inside this very pool. A profile field would be a second source of
   * truth for the same question and could point at a region with no media.
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

  const rails = useCommunityRails({ moments, memberRegion });
  const lead = useMemo(() => featuredMoment(moments), [moments]);

  // READ-ONLY viewer, exactly as Discover opens moments: this page reports, it
  // is not a second engagement surface. One deduped post list serves every
  // surface on the page so the viewer can page through the whole community.
  const posts = useMemo(() => {
    const seen = new Set<string>();
    const out = [] as Moment['post'][];
    for (const m of moments) {
      if (seen.has(m.post.id)) continue;
      seen.add(m.post.id);
      out.push(m.post);
    }
    return out;
  }, [moments]);

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
        options: { readOnly: true },
      });
    },
    [posts],
  );

  const leadHeight = lead
    ? Math.round(
        Math.min(LEAD_MAX_H, Math.max(LEAD_MIN_H, 340 / clampAspect(lead.aspect))),
      )
    : LEAD_MIN_H;

  return (
    <PageRoot style={{ background: CANVAS, minHeight: '100dvh' }}>
      {/* MASTHEAD — sticky, sits BELOW the floating island (44 + 10 gap + notch). */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: CANVAS,
          borderBottom: `0.5px solid ${HAIR}`,
          padding: '0 16px 10px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: DIM,
            marginBottom: 4,
          }}
        >
          {isPending
            ? '\u00A0'
            : t('community.count', {
                defaultValue: '{{count}} moments',
                count: moments.length,
              })}
        </div>
        <h1
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: INK,
            margin: 0,
          }}
        >
          {t('discover.momentsFromCommunity', 'From the community')}
        </h1>
      </div>

      {/* Nav-visible page: flat 88 bottom per spacing canon. */}
      <main style={{ paddingTop: 16, paddingBottom: 88 }}>
        {isPending ? (
          <CommunitySkeleton />
        ) : moments.length === 0 ? (
          <div style={{ padding: '40px 16px', fontSize: 13, color: DIM }}>
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
                  scrimStop="40%"
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

            <SectionRule label={t('community.courseIndex', 'Every course')} />
            <CommunityCourseIndex
              moments={moments}
              elsewhereLabel={t('community.elsewhere', 'Elsewhere')}
              countLabel={(n) =>
                t('community.count', { defaultValue: '{{count}} moments', count: n })
              }
            />

            <SectionRule label={t('community.everything', 'Everything')} />
            <CommunityEverythingGrid moments={moments} onTilePress={handleTile} />
          </>
        )}
      </main>
    </PageRoot>
  );
}

/** 3px rule marker + label — the Dispatch section seam. */
function SectionRule({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '18px 16px 10px',
      }}
    >
      <span aria-hidden style={{ width: 3, height: 12, background: INK }} />
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: INK,
          margin: 0,
        }}
      >
        {label}
      </h2>
    </div>
  );
}

const RAIL_FALLBACK: Record<string, string> = {
  played: 'Courses you have played',
  nearby: 'Near you',
  top100: 'From the Top 100',
  busiest: 'Busiest clubs',
  video: 'In motion',
};
