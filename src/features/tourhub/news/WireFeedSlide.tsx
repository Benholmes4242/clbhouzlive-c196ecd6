import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { TourStory } from './useTourStories';
import { StoryRelativeTime } from './StoryImageText';
import { AMBER, FONT, INK_MUTE, INK_SOFT } from '../_shared/tokens';
import { SLAB } from '@/components/feed/feedSurfaces';

export function WireFeedSlide({ story }: { story: TourStory }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const openStory = () => navigate(`/tour/news/${story.slug}`);

  return (
    <article style={{ height: 341, background: SLAB, fontFamily: FONT }} data-wire-slide>
      <button
        type="button"
        onClick={openStory}
        aria-label={`${t('news.readStory')}: ${story.headline}`}
        style={{ display: 'grid', gridTemplateRows: '35px 212px 94px', width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px' }}>
          <span style={{ minWidth: 0, color: AMBER, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.2 }}>
            {t('news.fromWire')}
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
            <div style={{ marginTop: story.kicker ? 6 : 0, color: 'inherit', fontSize: 21, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
              {story.headline}
            </div>
          </div>
        </div>

        <div style={{ padding: '13px 17px 17px', overflow: 'hidden' }}>
          <div style={{ height: 41 }}>
            {story.standfirst && <p style={{ margin: 0, color: INK_MUTE, fontSize: 14, lineHeight: 1.45, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{story.standfirst}</p>}
          </div>
          <div style={{ marginTop: story.standfirst ? 12 : 0, color: INK_SOFT, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1.2 }}>
            {t('news.readStory')}
          </div>
        </div>
      </button>
    </article>
  );
}