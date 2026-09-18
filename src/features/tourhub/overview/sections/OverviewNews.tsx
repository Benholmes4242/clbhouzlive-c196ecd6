import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TourStory } from '../../news/useTourStories';
import { FeatureStory, HeroStory, WorkhorseRow } from '../../news/StoryShapes';
import { FONT, HAIRLINE_INK_10 } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

export interface OverviewNewsSelection {
  hero: TourStory | null;
  features: TourStory[];
  rows: TourStory[];
}

export function selectOverviewNews(stories: TourStory[], excludeId?: string | null): OverviewNewsSelection {
  const visible = stories.filter((story) => story.id !== excludeId).slice(0, 6);
  const [hero, ...afterHero] = visible;
  const features = afterHero.length >= 2 ? afterHero.slice(0, 2) : [];
  return { hero: hero ?? null, features, rows: afterHero.slice(features.length, 5) };
}

export function OverviewNews({ stories, excludeId }: { stories: TourStory[]; excludeId?: string | null }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { hero, features, rows } = selectOverviewNews(stories, excludeId);
  if (!hero) return null;
  const open = (story: TourStory) => navigate(`/tour/news/${story.slug}`);

  return (
    <section data-overview-news-lead={hero.id}>
      <OverviewSectionHead title={t('overview.news.title')} action={t('overview.news.all')} onAction={() => navigate('/tourhub?tab=news')} />
      <article style={{ fontFamily: FONT }}>
        <HeroStory story={hero} onOpen={() => open(hero)} gutter={24} showEngagement={false} />
        <div style={{ padding: '0 24px' }}>
          {features.length === 2 ? (
            <section aria-label="Featured stories" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, marginTop: 24 }}>
              {features.map((story) => <FeatureStory key={story.id} story={story} onOpen={() => open(story)} showEngagement={false} />)}
            </section>
          ) : null}
          {rows.length > 0 ? (
            <section aria-label="More stories" style={{ marginTop: 24 }}>
              {rows.map((story, index) => (
                <div key={story.id} style={{ borderTop: index === 0 ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}>
                  <WorkhorseRow story={story} onOpen={() => open(story)} showEngagement={false} />
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </article>
    </section>
  );
}