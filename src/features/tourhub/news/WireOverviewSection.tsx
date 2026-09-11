import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { SectionShell } from '@/features/tourhub/overview/sections/SectionShell';
import { OVERVIEW_GUTTER } from '@/features/tourhub/overview/tokens';
import { HAIRLINE_INK_10 } from '@/features/tourhub/_shared/tokens';
import { LeadStory, StoryRow } from './NewsTab';
import { useTourStories, type TourStory } from './useTourStories';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';

const NEWS_TOURS = new Set(['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv']);

/** Three-story Wire preview driven by the overview's existing global tour lens. */
export function WireOverviewSection() {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { selectedTourSlug } = useTourSelection();
  const active = selectedTourSlug ?? 'all';
  const lens = NEWS_TOURS.has(active) ? active : null;
  const { stories, isLoading } = useTourStories(lens);

  const [lead, rows] = useMemo(() => {
    const three = stories.slice(0, 3);
    const first = three[0];
    if (!first?.image_url) return [null, three] as [TourStory | null, TourStory[]];
    return [first, three.slice(1)] as [TourStory, TourStory[]];
  }, [stories]);

  /* ONE read for the three-story window. */
  const { engagementFor } = useStoryEngagement(
    'tour_story',
    useMemo(() => stories.slice(0, 3).map((s) => s.id), [stories]),
  );

  // The overview never waits for editorial data and carries no empty placeholder.
  if (isLoading || stories.length === 0) return null;

  const open = (slug: string) => navigate(`/tour/news/${slug}`);

  return (
    <SectionShell
      eyebrow={t('news.masthead')}
      linkLabel={t('news.allStories')}
      onLinkClick={() => navigate('/tourhub?tab=news')}
    >
      {/* BOTH OVERVIEW IMAGES SIT ON THE 20px GUTTER (device-check E). The Wire
          lead photograph ran edge to edge while Course of the Week's was inset,
          so the two sections read as different page widths. This section now
          owns the gutter and LeadStory renders its overlay text flush to the
          image, which puts kicker and headline on the same 20px line as every
          other section. The 16px LeadStory gutter recorded as an accepted
          workaround applies to the FULL news tab, not to this inset consumer. */}
      {lead && (
        <div style={{ padding: `0 ${OVERVIEW_GUTTER}px` }}>
          <LeadStory story={lead} onOpen={() => open(lead.slug)} compact onGutter engagement={engagementFor(lead.id)} />
        </div>
      )}
      <div style={{ marginTop: lead ? 8 : 0 }}>
        {rows.map((story, index) => (
          <div
            key={story.id}
            style={{ borderTop: index === 0 && !lead ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}
          >
            <StoryRow story={story} onOpen={() => open(story.slug)} compact engagement={engagementFor(story.id)} />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export default WireOverviewSection;