/**
 * AmateurNewsSection — the Discover entry to Amateur News.
 *
 * Three stories: the newest photo-led in the compact 180px band, the next two as
 * rows. Identical to the Wire section on the Tour Overview, because it is the
 * same components with the amateur source behind them.
 *
 * It renders NOTHING while loading and nothing when empty: Discover carries no
 * editorial placeholder.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { HAIRLINE_INK_10 } from '@/features/tourhub/_shared/tokens';
import { Eyebrow, InkAction } from '@/components/explore-tab-new/courseled/tokens';
import { useAmateurStories, type AmateurStory } from './useAmateurStories';

export function AmateurNewsSection() {
  const navigate = useNavigate();
  const { stories, isLoading } = useAmateurStories(null);

  const [lead, rows] = useMemo(() => {
    const three = stories.slice(0, 3);
    const first = three[0];
    if (!first?.image_url) return [null, three] as [AmateurStory | null, AmateurStory[]];
    return [first, three.slice(1)] as [AmateurStory, AmateurStory[]];
  }, [stories]);

  if (isLoading || stories.length === 0) return null;

  const open = (slug: string) => navigate(`/discover/news/${slug}`);

  return (
    <section>
      <Eyebrow aside={<InkAction onClick={() => navigate('/discover/news')}>ALL STORIES</InkAction>}>
        AMATEUR NEWS
      </Eyebrow>
      {lead && <LeadStory story={lead} onOpen={() => open(lead.slug)} compact />}
      <div style={{ marginTop: lead ? 8 : 0 }}>
        {rows.map((story, index) => (
          <div
            key={story.id}
            style={{ borderTop: index === 0 && !lead ? 'none' : `1px solid ${HAIRLINE_INK_10}` }}
          >
            <StoryRow story={story} onOpen={() => open(story.slug)} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

export default AmateurNewsSection;
