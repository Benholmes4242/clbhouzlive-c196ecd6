import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { HAIRLINE_INK_10 } from '@/features/tourhub/_shared/tokens';
import { useTourStories } from '@/features/tourhub/news/useTourStories';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * BLOCK 4 - THE TOUR WIRE (BRIEF_TOUR_REBUILD).
 *
 * THE SAME SHAPE AS THE AMATEUR WIRE, reading the tour beat: `tour_stories`
 * through the deployed `useTourStories`, rendered by the SAME reader components
 * (LeadStory, StoryRow) so one story looks like a story wherever it is read.
 *
 * NO TOUR DIMENSION, deliberately, and for the same reason as Coming Up: a
 * member reading one tour still wants the week's news. The picker governs the
 * leaderboard and Our Picks only, so this block is unfiltered and carries no
 * basis line - that absence is where the filter's boundary is legible.
 *
 * EMPTY RENDERS NOTHING - no heading, no placeholder.
 * IT DEGRADES RATHER THAN PADS: lead plus two rows, lead plus one, lead alone.
 * A story with no image is a row, never a stretched lead.
 */
export function TourNewsBlock() {
  const navigate = useNavigate();
  const { stories, isPending } = useTourStories(null);

  const window = useMemo(() => stories.slice(0, 3), [stories]);
  const { engagementFor } = useStoryEngagement(
    'tour_story',
    useMemo(() => window.map((s) => s.id), [window]),
  );

  /* A held height, so the foot of the page does not jump when stories arrive. */
  if (isPending) return <div style={{ height: 300 }} aria-hidden />;
  if (window.length === 0) return null;

  const newest = window[0];
  const lead = newest.image_url ? newest : null;
  const rows = lead ? window.slice(1, 3) : window.slice(0, 3);

  const open = (slug: string) => {
    analyticsEvents.track('tour_news_story_opened', { slug });
    navigate(`/tour/news/${slug}`);
  };

  return (
    <section style={{ paddingTop: 26, fontFamily: SANS, ...FIGS }}>
      <DiscoverSectionHeading
        title="Tour news"
        right="All stories"
        onRightPress={() => {
          analyticsEvents.track('tour_news_see_all_opened', {});
          navigate('/tour/news');
        }}
      />

      {lead && (
        <LeadStory story={lead} onOpen={() => open(lead.slug)} compact engagement={engagementFor(lead.id)} />
      )}
      {rows.length > 0 && (
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
      )}
    </section>
  );
}
