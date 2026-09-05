/**
 * StoryPage — /tour/news/:slug. A single Wire story, deep-linkable and
 * shareable, and it MUST render for a guest: a share that hits a login wall is
 * worthless. Nothing on this page reads the viewing member.
 *
 * A story about an event carries that event's leaderboard strip between the
 * standfirst and the first paragraph, so the reader starts already oriented.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsChromeBridge } from './NewsChromeBridge';

import { useMoreFromTheWire, useTourStory, type TourStory } from './useTourStories';
import StoryLeaderboardStrip from './StoryLeaderboardStrip';
import { StoryRow } from './NewsTab';
import { StoryEngagementBlock } from '@/features/stories/StoryEngagementBlock';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { StoryBody } from './StoryBody';
import { storyTime } from './storyTime';
import { OVERVIEW_HERO_HEIGHT } from '../components/overview-v3/OverviewHero';
import { heroCanonScrimOn } from '../_shared/heroGradient';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
} from '../_shared/tokens';

const TOUR_TAG: Record<string, string> = {
  pga: 'PGA TOUR',
  lpga: 'LPGA',
  euro: 'DP WORLD TOUR',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV GOLF',
};

/**
 * How far the photograph's subject moves DOWN inside the hero frame.
 *
 * object-position cannot do this here: at 390x345 a landscape photo covers
 * the box by cropping the SIDES, so vertical overflow is zero and a focal
 * point has nothing to travel through. Instead the image box is made taller
 * than the frame and the frame clips the bottom.
 *
 * The image is anchored to the top, so extra height of 2x moves the centre
 * of the picture down by x. These two numbers only ever change together.
 */
const HERO_SUBJECT_DROP = 26;

const KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

/**
 * StoryArticle — the story itself: lead image, headline, standfirst, the event
 * strip and the blocks. Extracted from the page so the ADMIN PREVIEW can
 * render the REAL article rather than an approximation of it. If the preview and
 * the live page could disagree, the preview would be worthless.
 *
 * Everything above it (the sticky masthead, the loading state, MORE FROM THE
 * WIRE) belongs to the page, not the article.
 */
export function StoryArticle({ story, immersiveHero = false, tagLabel }: {
  story: TourStory;
  immersiveHero?: boolean;
  /**
   * The tag beside the timestamp, when the caller knows it better than the tour
   * map does. Amateur News passes its category line plus the free-text event
   * name, because there is no tour to name. Omitted, tour behaviour is
   * unchanged: the tour_slug resolves through TOUR_TAG.
   */
  tagLabel?: string | null;
}) {
  const tag = tagLabel ?? (story.tour_slug ? TOUR_TAG[story.tour_slug] ?? null : null);

  return (
    <>
      {/* S4: the band used to sit on SLATE_100, a lighter wash than the page
          canvas, so the strip above the photograph read as a different grey
          while the image loaded (and permanently on a short image). The band is
          the CANVAS behind a photograph, not a panel, so it takes the page
          surface and the surface is now continuous. */}
      {story.image_url && (
        <div style={{ position: 'relative', height: immersiveHero ? OVERVIEW_HERO_HEIGHT : 232, width: '100%', overflow: 'hidden', background: SLATE_50 }}>


          <img
            src={story.image_url}
            alt={story.headline}
            style={{
              width: '100%',
              height: `calc(100% + ${HERO_SUBJECT_DROP * 2}px)`,
              objectFit: 'cover',
              // objectPosition is the default; it is written out to stop future
              // edits trying to "tune" a focal point that has no vertical travel
              // on this nearly-square hero (landscape photos crop at the sides).
              objectPosition: '50% 50%',
              display: 'block',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 260,
              background: heroCanonScrimOn(SLATE_50),
            }}
          />
          {story.kicker && (
            <div style={{ position: 'absolute', top: immersiveHero ? 'calc(env(safe-area-inset-top, 0px) + 68px)' : 12, left: 14, right: 14 }}>
              <span style={{ ...KICKER, color: '#FFFFFF' }}>{story.kicker}</span>
            </div>
          )}
          {story.image_credit && (
            <div style={{ position: 'absolute', bottom: 8, right: 14, fontSize: 9, color: 'rgba(255,255,255,0.72)' }}>
              {story.image_credit}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px 14px 0' }}>
        {!story.image_url && story.kicker && (
          <div style={{ ...KICKER, color: INK_FAINT, marginBottom: 8 }}>{story.kicker}</div>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: INK, margin: 0 }}>
          {story.headline}
        </h1>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ ...KICKER, color: INK_FAINT, whiteSpace: 'nowrap', flexShrink: 0 }}>{storyTime(story.published_at)}</span>
          {tag && (
            <>
              <span aria-hidden style={{ width: 3, height: 3, borderRadius: '50%', background: INK_FAINT, flexShrink: 0, marginTop: 4 }} />
              <span style={{ ...KICKER, color: INK_FAINT, minWidth: 0 }}>{tag}</span>
            </>
          )}
        </div>

        {story.standfirst && (
          <p style={{ marginTop: 14, fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: INK, whiteSpace: 'pre-wrap' }}>
            {story.standfirst}
          </p>
        )}
        {/* MICRO_BRIEF_STRIP_ON_STORY_PAGE — context before the read, not after
            it. Self-contained: no event ⇒ nothing mounted, no space reserved. */}
        {story.tournament_id && (
          <div style={{ marginTop: 14 }}>
            <StoryLeaderboardStrip tournamentId={story.tournament_id} />
          </div>
        )}
        {story.body_blocks.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <StoryBody blocks={story.body_blocks} />
          </div>
        )}
      </div>
    </>
  );
}

/**
 * StoryIslandLeft — the story page's left-capsule content: back to the wire,
 * then the tour burger. NO TOUR PICKER: a reader inside one article has nothing
 * to filter, and a tour label there would state something the page does not do.
 *
 * The burger only renders for a signed-in member — the drawer's tail is
 * Settings / Profile / Sign out, none of which mean anything to a guest on a
 * shared link. A guest gets the back arrow alone.
 */
export function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data: story, isLoading } = useTourStory(slug);
  const { data: more } = useMoreFromTheWire(story?.id);

  /* ONE read for the MORE FROM THE WIRE window. */
  const { engagementFor } = useStoryEngagement(
    'tour_story',
    React.useMemo(() => (more ?? []).map((s) => s.id), [more]),
  );

  return (
    <div
      style={{
        background: SLATE_50,
        minHeight: '100dvh',
        fontFamily: FONT,
      }}
    >
      <NewsChromeBridge label="The Wire" mode="back" backFallback="/tour/news" />


      {isLoading ? (
        <div style={{ padding: 14 }}>
          <Skeleton style={{ height: 232, width: '100%' }} />
          <Skeleton style={{ height: 22, width: '80%', marginTop: 14 }} />
          <Skeleton style={{ height: 90, width: '100%', marginTop: 12 }} />
        </div>
      ) : !story ? (
        <div style={{ padding: '18px 14px', fontSize: 13, color: INK_MUTE }}>
          {t('news.notFound', 'This story is no longer available.')}
        </div>
      ) : (
        <>
          <StoryArticle story={story} immersiveHero={false} />

          {/* Below the article, above MORE FROM THE WIRE. */}
          <StoryEngagementBlock targetType="tour_story" storyId={story.id} />

          {(more?.length ?? 0) > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ ...KICKER, color: INK, padding: '0 14px 6px', letterSpacing: '0.14em', fontSize: 11 }}>
                {t('news.more', 'MORE FROM THE WIRE')}
              </div>
              {(more ?? []).map((s, i) => (
                <div key={s.id} style={{ borderTop: `1px solid ${HAIRLINE_INK_10}` }}>
                  <StoryRow story={s} onOpen={() => navigate(`/tour/news/${s.slug}`)} engagement={engagementFor(s.id)} />
                </div>
              ))}
            </div>
          )}
          <div
            aria-hidden
            style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 88px) + 16px)' }}
          />
        </>
      )}
    </div>
  );
}

export default StoryPage;
