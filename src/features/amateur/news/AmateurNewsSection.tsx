/**
 * Amateur News on Discover.
 *
 * Three stories: the newest photo-led at the 180px compact band, the next two as
 * rows. It shares the INDEX'S QUERY KEY, so this costs no extra fetch.
 *
 * PENDING IS NOT EMPTY (BRIEF_DISCOVER_LOADING_STATES). While the query is
 * unresolved this holds a shell of the section's real shape; only when it has
 * SETTLED and is empty does it render nothing. Discover carries no editorial
 * placeholder — an empty beat leaves no trace on the page.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { HAIRLINE_INK_10 } from '@/features/tourhub/_shared/tokens';
import { Eyebrow, HEAD_GAP, InkAction } from '@/components/explore-tab-new/courseled/tokens';

import { useAmateurStories } from './useAmateurStories';

/** Must match COMPACT_LEAD_HEIGHT in the wire's NewsTab. */
const COMPACT_LEAD_HEIGHT = 180;

export function AmateurNewsSection() {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { stories, isPending } = useAmateurStories(null);

  if (isPending) {
    return (
      <section aria-busy="true">
        <Eyebrow>{t('amateurNews.section', 'Amateur news')}</Eyebrow>
        <div style={{ marginTop: HEAD_GAP }}>
          <Skeleton style={{ height: COMPACT_LEAD_HEIGHT, width: '100%', borderRadius: 0 }} />
          <Skeleton style={{ height: 54, width: '100%', marginTop: 14 }} />
          <Skeleton style={{ height: 54, width: '100%', marginTop: 12 }} />
        </div>
      </section>
    );
  }

  if (stories.length === 0) return null;

  const newest = stories[0];
  const lead = newest.image_url ? newest : null;
  const rows = (lead ? stories.slice(1) : stories).slice(0, lead ? 2 : 3);
  const open = (slug: string) => navigate(`/discover/news/${slug}`);

  return (
    <section>
      <Eyebrow
        aside={
          <InkAction onClick={() => navigate('/discover/news')}>
            {t('amateurNews.allStories', 'ALL STORIES')}
          </InkAction>
        }
      >
        {t('amateurNews.section', 'Amateur news')}
      </Eyebrow>
      <div style={{ marginTop: HEAD_GAP }}>
        {lead && <LeadStory story={lead} onOpen={() => open(lead.slug)} compact />}
        <div style={{ marginTop: lead ? 14 : 0 }}>
          {rows.map((s, i) => (
            <div
              key={s.id}
              style={{ borderTop: i === 0 && !lead ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}
            >
              <StoryRow story={s} onOpen={() => open(s.slug)} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AmateurNewsSection;
