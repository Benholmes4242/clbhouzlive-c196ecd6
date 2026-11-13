import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import type { TourStory } from '../../news/useTourStories';
import { FeatureStory, HeroStory, WorkhorseRow } from '../../news/StoryShapes';
import { FONT, HAIRLINE_INK_10 } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';
import { isNewStory, markNewsOpened, useNewsVisit } from '../../news/newsVisit';
import type { NewsPresentation } from './overviewNewsRules';

export interface OverviewNewsSelection {
  hero: TourStory | null;
  features: TourStory[];
  rows: TourStory[];
}

export function selectOverviewNews(stories: TourStory[], excludeIds: readonly string[] = []): OverviewNewsSelection {
  const used = new Set(excludeIds);
  const visible = stories.filter((story) => !used.has(story.id)).slice(0, 6);
  const [hero, ...afterHero] = visible;
  const features = afterHero.length >= 2 ? afterHero.slice(0, 2) : [];
  return { hero: hero ?? null, features, rows: afterHero.slice(features.length, 5) };
}

export function OverviewNews({ stories, excludeIds, presentations }: { stories: TourStory[]; excludeIds?: readonly string[]; presentations?: Map<string, NewsPresentation> }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { hero, features, rows } = selectOverviewNews(stories, excludeIds);
  const { ref, visit } = useNewsVisit(!!hero);
  const shown = hero ? [hero, ...features, ...rows] : [];
  const count = shown.filter(story => isNewStory(story, visit)).length;
  const presentation = (story: TourStory): NewsPresentation => ({ ...(presentations?.get(story.id) ?? { liveRound: null, players: [] }), isNew: isNewStory(story, visit) });
  if (!hero) return null;
  const open = (story: TourStory) => { markNewsOpened(story.id); navigate(`/tour/news/${story.slug}`); };

  return (
    <section ref={ref} className="overview-news" data-overview-band="news" data-overview-news-lead={hero.id}>
      <OverviewSectionHead title={t('overview.news.title')} action={t('overview.news.all')} onAction={() => navigate('/tourhub?tab=news')} />
      {count > 0 && <div className="overview-news-fresh"><i className="overview-news-dot" aria-hidden /><span><Trans t={t} i18nKey="overview.news.newSince" count={count} components={{ b: <b /> }} /></span></div>}
      <article style={{ fontFamily: FONT }}>
        <HeroStory story={hero} onOpen={() => open(hero)} gutter={24} showEngagement={false} overviewNews={presentation(hero)} />
        <div style={{ padding: '0 24px' }}>
          {features.length === 2 ? (
            <section aria-label="Featured stories" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14, marginTop: 24 }}>
              {features.map((story) => <FeatureStory key={story.id} story={story} onOpen={() => open(story)} showEngagement={false} overviewNews={presentation(story)} />)}
            </section>
          ) : null}
          {rows.length > 0 ? (
            <section aria-label="More stories" style={{ marginTop: 10 }}>
              {rows.map((story, index) => (
                <div key={story.id} style={{ borderTop: index === 0 ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}>
                  <WorkhorseRow story={story} onOpen={() => open(story)} showEngagement={false} overviewNews={presentation(story)} />
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </article>
    </section>
  );
}