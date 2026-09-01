import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { TourStory } from './useTourStories';
import { StoryRelativeTime } from './StoryImageText';
import { AMBER, FONT, INK, INK_MUTE, INK_SOFT } from '../_shared/tokens';
import { SLAB } from '@/components/feed/feedSurfaces';
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import { CommentAction } from '@/components/explore-tab-new/courseled/CommentAction';
import useContentReactions from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import type { StoryBeat } from '@/components/feed/injectWireStories';

/**
 * A FEED CARD IS AN OBJECT YOU ACT ON, so the slide carries a live heart and a
 * live comment glyph — unlike the news list rows, where the row itself is
 * navigation. One slide, two beats: `beat` drives the route, the eyebrow, and
 * the engagement target type.
 */
export function WireFeedSlide({ story, beat = 'tour' }: { story: TourStory; beat?: StoryBeat }) {
  const { t } = useTranslation('tourhub');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const targetType = beat === 'amateur' ? ('amateur_story' as const) : ('tour_story' as const);
  const openStory = () =>
    navigate(beat === 'amateur' ? `/discover/news/${story.slug}` : `/tour/news/${story.slug}`);

  const { stateFor, toggle, unavailable, viewerId } = useContentReactions([
    { type: targetType, id: story.id },
  ]);
  const like = stateFor(targetType, story.id);
  const { engagementFor } = useStoryEngagement(targetType, [story.id]);
  const commentCount = engagementFor(story.id).commentCount;
  const signedIn = !!viewerId;

  return (
    <article style={{ height: 341, background: SLAB, fontFamily: FONT }} data-wire-slide data-wire-beat={beat}>
      <button
        type="button"
        onClick={openStory}
        aria-label={`${t('news.readStory')}: ${story.headline}`}
        style={{ display: 'grid', gridTemplateRows: '35px 212px 94px', width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px' }}>
          <span style={{ minWidth: 0, color: AMBER, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.2 }}>
            {beat === 'amateur' ? t('news.amateurNews') : t('news.fromWire')}
          </span>
          <StoryRelativeTime at={story.published_at} />
        </div>

        <div style={{ position: 'relative', height: 212, overflow: 'hidden', background: SLAB }}>
          <img src={story.image_url ?? ''} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%' }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 22%, ${SLAB} 100%)` }} />
          <div style={{ position: 'absolute', left: 17, right: 17, bottom: 16 }}>
            {story.kicker && (
              <span style={{ display: 'block', color: INK_SOFT, fontSize: 10, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                {story.kicker}
              </span>
            )}
            <div style={{ marginTop: story.kicker ? 6 : 0, color: INK, fontSize: 21, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
              {story.headline}
            </div>
          </div>
        </div>

        <div style={{ padding: '13px 17px 17px', overflow: 'hidden' }}>
          <div style={{ height: 41 }}>
            {story.standfirst && <p style={{ margin: 0, color: INK_MUTE, fontSize: 14, lineHeight: 1.45, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{story.standfirst}</p>}
          </div>
          <div style={{ marginTop: story.standfirst ? 12 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: INK_SOFT, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.2 }}>
              {t('news.readStory')}
            </span>
            {/* Both controls stopPropagation, so a like never navigates. */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
              <ReactionAction
                count={like.count}
                reacted={like.mine}
                onToggle={() => toggle(targetType, story.id)}
                label={like.mine ? tc('story.unlikeAria') : tc('story.likeAria')}
                readOnly={!signedIn}
                hidden={unavailable}
                size={16}
                figureSize={12.5}
              />
              {signedIn && (
                <CommentAction
                  count={commentCount}
                  onOpen={() => setSheetOpen(true)}
                  label={tc('story.commentsAria')}
                  size={16}
                  figureSize={12.5}
                />
              )}
            </span>
          </div>
        </div>
      </button>

      {signedIn && (
        <CommentsSheetV2
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          targetType={targetType}
          targetId={story.id}
        />
      )}
    </article>
  );
}
