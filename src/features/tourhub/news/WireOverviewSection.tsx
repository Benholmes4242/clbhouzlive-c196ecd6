import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { SectionShell } from '@/features/tourhub/overview/sections/SectionShell';
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
      {/* THE LEAD PHOTOGRAPH IS FULL-BLEED (device-walk-2 B1, REVERSING
          device-check E). E inset both overview images on the 20px gutter to
          make the two sections read as one page width; Ben's ruling is the
          opposite — where the content IS the edge, the image goes edge to edge,
          matching the Amateur news page, with the kicker and headline overlaid
          as they are there. Text, figures and rows stay on the gutter; only
          images and full-width dividers break out. LeadStory's own default
          (full-bleed, its own 16px inner gutter) is therefore what we want, so
          the wrapper and the `onGutter` opt-in are both gone. `onGutter` stays
          on LeadStory: it is additive, defaulted off, and harms nothing. */}
      {lead && (
        <LeadStory story={lead} onOpen={() => open(lead.slug)} compact engagement={engagementFor(lead.id)} />
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