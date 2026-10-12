import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Share } from 'lucide-react';
import type { TourStory } from './useTourStories';
import { AMBER, FONT, INK } from '../_shared/tokens';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SLAB } from '@/components/feed/feedSurfaces';
import { LINE, T60 } from '@/components/feed/feedTokens';
import { FooterButton } from '@/components/feed/FeedCard';
import { ReactionGlyph, AMBER as REACTION_AMBER } from '@/lib/reactionKind';
import { formatCountKilo } from '@/i18n/format';
import { toast } from '@/lib/toast';
import useContentReactions from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { MASTHEAD_KICKER } from '@/components/courses/CourseMasthead';
import type { StoryBeat } from '@/components/feed/injectWireStories';
import { readingMinutes } from './readingTime';
import { joinDateline, storyDateline } from './storyTime';

const routeFor = (beat: StoryBeat, slug: string) =>
  beat === 'amateur' ? `/discover/news/${slug}` : `/tour/news/${slug}`;

const CLAMP = (lines: number): React.CSSProperties => ({
  display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden',
});

/**
 * THE NEWS CARD IN CLUBHOUSE (BRIEF_TOUR_NEWS_CARD, wirecard.html).
 * Masthead = the beat the injector placed. Lead story, a dateline (date ·
 * reading time · photo credit), a briefing of up to two more stories from the
 * SAME beat, and the feed's own engagement row. Nothing here is personalised.
 */
export function WireFeedSlide({
  story,
  beat = 'tour',
  more = [],
}: {
  story: TourStory;
  beat?: StoryBeat;
  more?: TourStory[];
}) {
  const { t } = useTranslation('tourhub');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const targetType = beat === 'amateur' ? ('amateur_story' as const) : ('tour_story' as const);
  const { stateFor, toggle, unavailable, viewerId } = useContentReactions([{ type: targetType, id: story.id }]);
  const like = stateFor(targetType, story.id);
  const { engagementFor } = useStoryEngagement(targetType, [story.id]);
  const commentCount = engagementFor(story.id).commentCount;
  const signedIn = !!viewerId;

  const minutes = readingMinutes(story.body_blocks);
  const dateline = joinDateline([
    storyDateline(story.published_at),
    t('news.minRead', { n: minutes, defaultValue: `${minutes} min read` }),
    story.image_credit ? t('news.photoCredit', { credit: story.image_credit, defaultValue: `Photo ${story.image_credit}` }) : null,
  ]);

  const share = async () => {
    const url = `${window.location.origin}${routeFor(beat, story.slug)}`;
    try {
      if (navigator.share) await navigator.share({ title: story.headline, url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch { /* dismissed */ }
  };

  const masthead = beat === 'amateur' ? t('news.amateurNews') : t('news.fromWire');
  const moreLabel = beat === 'amateur'
    ? t('news.moreAmateurNews', 'More amateur news')
    : t('news.moreTourNews', 'More tour news');

  return (
    <article style={{ background: SLAB, fontFamily: FONT, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }} data-wire-slide data-wire-beat={beat}>
      <button
        type="button"
        onClick={() => navigate(routeFor(beat, story.slug))}
        aria-label={`${t('news.readStory')}: ${story.headline}`}
        style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
      >
        {/* W.2 — one element: the beat. No age, no tag pill. */}
        <div data-wire-strip style={{ display: 'flex', alignItems: 'center', padding: '11px 14px 9px' }}>
          <span style={{ color: AMBER, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', lineHeight: 1.2, textTransform: 'uppercase' }}>
            {masthead}
          </span>
        </div>

        {/* W.3 — hero unchanged. */}
        <div style={{ position: 'relative', height: 212, overflow: 'hidden', background: SLAB }}>
          <img src={story.image_url ?? ''} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%' }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 22%, ${SLAB} 100%)` }} />
          <div style={{ position: 'absolute', left: 17, right: 17, bottom: 16 }}>
            {story.kicker && <span style={{ ...MASTHEAD_KICKER, display: 'block' }}>{story.kicker}</span>}
            <div style={{ marginTop: story.kicker ? 6 : 0, color: INK, fontSize: 24, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.028em', ...CLAMP(3) }}>
              {story.headline}
            </div>
          </div>
        </div>

        {story.standfirst && (
          <p style={{ margin: 0, padding: '12px 14px 0', color: T60, fontSize: 14.5, lineHeight: 1.45, ...CLAMP(2) }}>{story.standfirst}</p>
        )}

        {/* W.4 — the dateline. */}
        {dateline && (
          <div data-wire-dateline style={{ padding: '9px 14px 0', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', color: A.DIM }}>
            {dateline}
          </div>
        )}

        <div style={{ padding: '11px 14px 0', fontSize: 12.5, fontWeight: 800, color: AMBER }}>
          {t('news.readStory')} ›
        </div>
      </button>

      {/* W.5 — the briefing: same beat only; no label when nothing remains. */}
      {more.length > 0 && (
        <div data-wire-briefing style={{ marginTop: 12, borderTop: `1px solid ${LINE}` }}>
          <div style={{ padding: '10px 14px 2px', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: A.DIM }}>
            {moreLabel}
          </div>
          {more.map((s) => {
            const m = readingMinutes(s.body_blocks);
            return (
              <button
                key={s.id}
                type="button"
                data-wire-briefing-row
                onClick={() => navigate(routeFor(beat, s.slug))}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '7px 14px', border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
              >
                <img src={s.image_url ?? ''} alt="" loading="lazy" style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', flex: 'none', background: LINE }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: INK, ...CLAMP(2) }}>{s.headline}</span>
                  <span style={{ display: 'block', marginTop: 3, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: A.DIM }}>
                    {joinDateline([storyDateline(s.published_at), t('news.minShort', { n: m, defaultValue: `${m} min` })])}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* W.6 — the feed's own engagement row, same buttons as FeedCard. */}
      <div data-wire-engagement style={{ marginTop: more.length > 0 ? 4 : 12, borderTop: `1px solid ${LINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '10px 20px 12px' }}>
          {!unavailable && (
            <FooterButton
              icon={MessageCircle}
              label={like.count > 0 ? formatCountKilo(like.count) : undefined}
              active={like.mine}
              activeColor={REACTION_AMBER}
              glyph={<ReactionGlyph reacted={like.mine} size={21} />}
              ariaLabel={like.mine ? tc('story.unlikeAria') : tc('story.likeAria')}
              onClick={() => { if (signedIn) toggle(targetType, story.id); }}
            />
          )}
          <FooterButton
            icon={MessageCircle}
            label={commentCount > 0 ? formatCountKilo(commentCount) : undefined}
            ariaLabel={tc('story.commentsAria')}
            onClick={() => (signedIn ? setSheetOpen(true) : navigate(routeFor(beat, story.slug)))}
          />
          <FooterButton icon={Share} onClick={() => { void share(); }} ariaLabel="Send" />
        </div>
      </div>

      {signedIn && (
        <CommentsSheetV2 isOpen={sheetOpen} onClose={() => setSheetOpen(false)} targetType={targetType} targetId={story.id} />
      )}
    </article>
  );
}
