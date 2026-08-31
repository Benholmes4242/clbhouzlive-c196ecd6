import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { TourStory } from './useTourStories';
import { StoryImageHeadline, StoryImageKicker, StoryRelativeTime } from './StoryImageText';
import { FONT, INK_MUTE, INK_SOFT } from '../_shared/tokens';
import { FEED_DATE_INK, SLAB } from '@/components/feed/feedSurfaces';

export function WireFeedSlide({ story }: { story: TourStory }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const openStory = () => navigate(`/tour/news/${story.slug}`);

  return (
    <article style={{ background: SLAB, fontFamily: FONT }} data-wire-slide>
      <button
        type="button"
        onClick={openStory}
        aria-label={`${t('news.readStory')}: ${story.headline}`}
        style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px' }}>
          <span style={{ minWidth: 0, color: FEED_DATE_INK, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.2 }}>
            {t('news.fromWire')}
          </span>
          <StoryRelativeTime at={story.published_at} />
        </div>

        <div style={{ position: 'relative', height: 176, overflow: 'hidden', background: SLAB }}>
          <img src={story.image_url ?? ''} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%' }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 22%, ${SLAB} 100%)` }} />
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 13 }}>
            {story.kicker && <StoryImageKicker>{story.kicker}</StoryImageKicker>}
            <div style={{ marginTop: story.kicker ? 5 : 0 }}><StoryImageHeadline feed>{story.headline}</StoryImageHeadline></div>
          </div>
        </div>

        <div style={{ padding: '11px 14px 14px' }}>
          {story.standfirst && <p style={{ margin: 0, color: INK_MUTE, fontSize: 13, lineHeight: 1.45 }}>{story.standfirst}</p>}
          <div style={{ marginTop: story.standfirst ? 12 : 0, color: INK_SOFT, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.2 }}>
            {t('news.readStory')}
          </div>
        </div>
      </button>
    </article>
  );
}