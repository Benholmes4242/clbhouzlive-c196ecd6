import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { AboutSection } from '@/components/courses/course-detail/about/AboutSection';
import { FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { HAIRLINE_INK_10 } from '@/features/tourhub/_shared/tokens';
import { useAmateurStories } from '@/features/amateur/news/useAmateurStories';
import { rememberAmateurScroll } from '@/features/amateur/amateurScrollMemory';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * BLOCK 3 - AMATEUR NEWS (BRIEF_AMATEUR_PAGE).
 *
 * IT IS AMATEUR BY TABLE, NOT BY FILTER. The rows come from
 * `amateur_stories`; tour stories live in a different table read by a different
 * hook (`useTourStories`), and the amateur mapper forces `tour_slug` and
 * `tournament_id` to null. There is no shared pipeline and therefore no path by
 * which a DP World story reaches this heading.
 *
 * THIS BLOCK IS NOT FILTERED. It carries no basis line, and that absence is
 * what marks the filter's boundary on the page.
 *
 * EMPTY RENDERS NOTHING - no heading, no placeholder.
 *
 * IT DEGRADES RATHER THAN PADS: lead plus two rows, lead plus one, lead alone.
 * A story without an image is a row, never a stretched lead.
 */
export function AmateurNewsBlock() {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { stories, isPending } = useAmateurStories(null);

  const window = useMemo(() => stories.slice(0, 3), [stories]);
  const { engagementFor } = useStoryEngagement(
    'amateur_story',
    useMemo(() => window.map((s) => s.id), [window]),
  );

  /* A held height, so blocks below do not jump when the stories arrive. */
  if (isPending) return <div style={{ height: 300 }} aria-hidden />;
  if (window.length === 0) return null;

  const newest = window[0];
  const lead = newest.image_url ? newest : null;
  const rows = lead ? window.slice(1, 3) : window.slice(0, 3);

  const open = (slug: string) => {
    analyticsEvents.track('amateur_news_story_opened', { slug });
    rememberAmateurScroll();
    navigate(`/discover/news/${slug}`);
  };

  return (
    /* §7 — the shared section primitive. The lead photograph still bleeds: its
       frame is written against a 14px gutter, so the one place it is wrapped
       pays 14px inside a bleeding section rather than the shared LeadStory
       being forked. */
    <AboutSection
      heading={t('amateurNews.section', 'Amateur news')}
      meta={t('amateurNews.seeAllCount', 'See all {{count}}', { count: stories.length })}
      onMetaPress={() => {
        analyticsEvents.track('amateur_news_see_all_opened', { total: stories.length });
        rememberAmateurScroll();
        navigate('/discover/news');
      }}
      bleed
    >
      {lead && (
        <div style={{ paddingInline: 14 }}>
          <LeadStory story={lead} onOpen={() => open(lead.slug)} compact bleed engagement={engagementFor(lead.id)} />
        </div>
      )}
      {rows.length > 0 && (
        <div style={{ marginTop: lead ? 8 : 0, padding: '0 20px' }}>
          {rows.map((story, index) => (
            <div
              key={story.id}
              style={{ borderTop: index === 0 ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}
            >
              <StoryRow story={story} onOpen={() => open(story.slug)} compact engagement={engagementFor(story.id)} />
            </div>
          ))}
        </div>
      )}
    </AboutSection>
  );
}
