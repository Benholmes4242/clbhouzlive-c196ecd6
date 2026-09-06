import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { type AmateurStory, useAmateurStories } from '@/features/amateur/news/useAmateurStories';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import {
  FeatureStory,
  GUTTER,
  HeroStory,
  KICKER,
  LoadMoreRow,
  StoryChipRail,
  WireItem,
  WorkhorseRow,
} from '@/features/tourhub/news/StoryShapes';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';

const WIRE_PAGE_SIZE = 10;

/** NEWS is editorial only and deliberately mounts no Discover media query. */
export function NewsTabPage() {
  const navigate = useNavigate();
  const { stories: allStories = [], isPending } = useAmateurStories(null);
  const [wireLimit, setWireLimit] = useState(WIRE_PAGE_SIZE);
  const [competition, setCompetition] = useState<string | null>(null);
  const stories = useMemo(
    () => competition ? allStories.filter((story) => story.tournament_name?.trim() === competition) : allStories,
    [allStories, competition],
  );
  const { engagementFor } = useStoryEngagement('amateur_story', useMemo(() => allStories.map((story) => story.id), [allStories]));

  const lead = stories[0];
  const afterLead = stories.slice(1);
  const twoUp = afterLead.length >= 2 ? afterLead.slice(0, 2) : [];
  const afterFeatures = afterLead.slice(twoUp.length);
  const rows = afterFeatures.slice(0, 3);
  const wire = afterFeatures.slice(3);
  const visibleWire = wire.slice(0, wireLimit);

  const competitions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const story of allStories) {
      const name = story.tournament_name?.trim();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  }, [allStories]);

  const open = (story: AmateurStory) => navigate(`/discover/news/${story.slug}`);

  return (
    <main style={{ paddingTop: 'var(--discover-header-h)', minHeight: '100dvh', background: A.CANVAS, color: A.INK, fontFamily: SANS }}>
      {isPending ? (
        <div>
          <Skeleton style={{ height: 340, width: '100%', borderRadius: 0 }} />
          <div style={{ padding: `11px ${GUTTER}px 110px` }}><Skeleton style={{ height: 16, width: 82 }} /></div>
        </div>
      ) : !lead ? (
        <div style={{ padding: `18px ${GUTTER}px 110px`, fontSize: 13, color: A.MUTE }}>The first stories are on their way.</div>
      ) : (
        <>
          <HeroStory story={lead} onOpen={() => open(lead)} engagement={engagementFor(lead.id)} />

          <div style={{ padding: `0 ${GUTTER}px 110px` }}>
            {twoUp.length === 2 && (
              <section aria-label="Featured stories" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 9, marginTop: 24 }}>
                {twoUp.map((story) => <FeatureStory key={story.id} story={story} onOpen={() => open(story)} engagement={engagementFor(story.id)} />)}
              </section>
            )}

            {rows.length > 0 && (
              <section aria-label="Latest stories" style={{ marginTop: 24 }}>
                {rows.map((story, index) => (
                  <div key={story.id} style={{ borderTop: index === 0 ? `1px solid ${A.HAIRLINE}` : 'none', borderBottom: `1px solid ${A.HAIRLINE}` }}>
                    <WorkhorseRow story={story} onOpen={() => open(story)} engagement={engagementFor(story.id)} />
                  </div>
                ))}
              </section>
            )}

            {competitions.length >= 2 && (
              <StoryChipRail
                id="news-competitions"
                heading="By competition"
                chips={competitions.map(([name, count]) => ({ key: name, label: name, count }))}
                selected={competition}
                onSelect={(key) => {
                  setCompetition(key);
                  setWireLimit(WIRE_PAGE_SIZE);
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
              />
            )}

            {wire.length > 0 && (
              <section aria-labelledby="news-wire" style={{ marginTop: 26, borderRadius: r.md, overflow: 'hidden', background: A.PANEL, border: `1px solid ${A.BORDER}` }}>
                <h2 id="news-wire" style={{ ...KICKER, margin: 0, padding: '13px 13px 9px', color: A.INK }}>The wire</h2>
                {visibleWire.map((story) => (
                  <WireItem key={story.id} story={story} onOpen={() => open(story)} />
                ))}
                {visibleWire.length < wire.length && (
                  <LoadMoreRow onClick={() => setWireLimit((current) => current + WIRE_PAGE_SIZE)} />
                )}
              </section>
            )}
          </div>
        </>
      )}
    </main>
  );
}