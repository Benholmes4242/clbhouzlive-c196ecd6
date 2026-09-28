import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AMATEUR_CATEGORIES, categoryLabel } from '@/features/amateur/news/categories';

import { Skeleton } from '@/components/ui/skeleton';
import { type AmateurStory, useAmateurStories } from '@/features/amateur/news/useAmateurStories';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { CommentAction } from '@/components/explore-tab-new/courseled/CommentAction';
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import useContentReactions from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import {
  FeatureStory,
  GUTTER,
  HeroStory,
  
  LoadMoreRow,
  StoryChipRail,
  WireItem,
  WorkhorseRow,
} from '@/features/tourhub/news/StoryShapes';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';

const WIRE_PAGE_SIZE = 10;

/** NEWS is editorial only and deliberately mounts no Discover media query. */
export function NewsTabPage({
  onOpenStory,
  chrome = 'discover',
  railBy = 'competition',
}: {
  onOpenStory: (slug: string) => void;
  /** The page shell owns the frame. Discover's tab owns its own. */
  chrome?: 'discover' | 'none';
  /** Which cut the chip rail offers. Same rail, same threshold. */
  railBy?: 'competition' | 'category';
}) {
  const { t } = useTranslation('courses');
  const { stories: allStories = [], isPending } = useAmateurStories(null);
  const [wireLimit, setWireLimit] = useState(WIRE_PAGE_SIZE);
  const [competition, setCompetition] = useState<string | null>(null);
  const [commentsStoryId, setCommentsStoryId] = useState<string | null>(null);
  const stories = useMemo(
    () => !competition
      ? allStories
      : railBy === 'category'
        ? allStories.filter((story) => story.categories.includes(competition))
        : allStories.filter((story) => story.tournament_name?.trim() === competition),
    [allStories, competition, railBy],
  );
  const { engagementFor } = useStoryEngagement('amateur_story', useMemo(() => allStories.map((story) => story.id), [allStories]));
  const { stateFor, toggle, unavailable, viewerId } = useContentReactions(
    useMemo(() => allStories.map((story) => ({ type: 'amateur_story' as const, id: story.id })), [allStories]),
  );

  /* A story with no photograph never takes the hero slot — a photo-led band
     with no photo is a 340px grey slab. It joins the normal flow instead. */
  const lead = stories[0]?.image_url ? stories[0] : undefined;
  const afterLead = lead ? stories.slice(1) : stories;
  const twoUp = afterLead.length >= 2 ? afterLead.slice(0, 2) : [];
  const afterFeatures = afterLead.slice(twoUp.length);
  const rows = afterFeatures.slice(0, 3);
  const wire = afterFeatures.slice(3);
  const visibleWire = wire.slice(0, wireLimit);

  const competitions = useMemo(() => {
    const counts = new Map<string, number>();
    if (railBy === 'category') {
      for (const story of allStories) for (const c of story.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
      /* Declared order, whole vocabulary — ORDER IS MEANINGFUL, nothing to cap. */
      return AMATEUR_CATEGORIES.filter((c) => (counts.get(c.value) ?? 0) > 0).map((c) => [c.value, counts.get(c.value)!] as [string, number]);
    }
    for (const story of allStories) {
      const name = story.tournament_name?.trim();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  }, [allStories, railBy]);
  const chipLabel = (key: string) =>
    railBy === 'category' ? categoryLabel(key, (v, f) => t(`amateurNews.categories.${v}`, f)) : key;
  const bottomPad = chrome === 'none' ? 0 : 110;
  const Frame = chrome === 'none' ? 'div' : 'main';
  const frameStyle: React.CSSProperties = chrome === 'none'
    ? {}
    : { paddingTop: 'var(--discover-header-h, calc(env(safe-area-inset-top, 0px) + 78px))', minHeight: '100dvh', background: A.CANVAS, color: A.INK, fontFamily: SANS };

  const open = (story: AmateurStory) => onOpenStory(story.slug);
  const engagementAction = (story: AmateurStory, size = 13) => {
    const like = stateFor('amateur_story', story.id);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
        <ReactionAction
          count={like.count}
          reacted={like.mine}
          onToggle={() => toggle('amateur_story', story.id)}
          label={like.mine ? 'Unlike story' : 'Like story'}
          readOnly={!viewerId}
          hidden={unavailable}
          size={size}
        />
        {viewerId && <CommentAction count={engagementFor(story.id).commentCount} onOpen={() => setCommentsStoryId(story.id)} label="Open story comments" size={size} />}
      </span>
    );
  };

  return (
    <Frame style={frameStyle}>
      {isPending ? (
        <div>
          <Skeleton style={{ height: 340, width: '100%', borderRadius: 0 }} />
          <div style={{ padding: `11px ${GUTTER}px ${bottomPad}px` }}><Skeleton style={{ height: 16, width: 82 }} /></div>
        </div>
      ) : allStories.length === 0 ? (
        <div style={{ padding: `18px ${GUTTER}px ${bottomPad}px`, fontSize: 13, color: A.MUTE }}>{railBy === 'category' ? t('amateurNews.emptyAll', 'The first stories are on their way.') : 'The first stories are on their way.'}</div>
      ) : stories.length === 0 ? (
        <div style={{ padding: `18px ${GUTTER}px ${bottomPad}px`, fontSize: 13, color: A.MUTE }}>{railBy === 'category' ? t('amateurNews.emptyFilter', 'Nothing filed under this yet.') : 'The first stories are on their way.'}</div>
      ) : (
        <>
          <HeroStory
            story={lead}
            onOpen={() => open(lead)}
            engagement={engagementFor(lead.id)}
            engagementAction={engagementAction(lead, 14)}
          />

          <div style={{ padding: `0 ${GUTTER}px ${bottomPad}px` }}>
            {twoUp.length === 2 && (
              <section aria-label="Featured stories" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 9, marginTop: 24 }}>
                {twoUp.map((story) => <FeatureStory key={story.id} story={story} onOpen={() => open(story)} engagement={engagementFor(story.id)} engagementAction={engagementAction(story)} />)}
              </section>
            )}

            {rows.length > 0 && (
              <section aria-label="Latest stories" style={{ marginTop: 24 }}>
                {rows.map((story, index) => (
                  <div key={story.id} style={{ borderTop: index === 0 ? `1px solid ${A.HAIRLINE}` : 'none', borderBottom: `1px solid ${A.HAIRLINE}` }}>
                    <WorkhorseRow story={story} onOpen={() => open(story)} engagement={engagementFor(story.id)} engagementAction={engagementAction(story)} />
                  </div>
                ))}
              </section>
            )}

            {competitions.length >= 2 && (
              <StoryChipRail
                id="news-competitions"
                heading={railBy === 'category' ? 'By category' : 'By competition'}
                chips={competitions.map(([name, count]) => ({ key: name, label: chipLabel(name), count }))}
                selected={competition}
                sentenceHeading
                allLabel={railBy === 'category' ? t('amateurNews.all', 'All') : 'All'}
                ariaLabel={railBy === 'category' ? t('amateurNews.filterAria', 'Filter amateur news') : undefined}
                onSelect={(key) => {
                  setCompetition(key);
                  setWireLimit(WIRE_PAGE_SIZE);
                  scrollPageToTop('auto');
                }}
              />
            )}

            {wire.length > 0 && (
              <section aria-labelledby="news-wire" style={{ marginTop: 26, borderRadius: r.md, overflow: 'hidden', background: A.PANEL, border: `1px solid ${A.BORDER}` }}>
                <div style={{ padding: '13px 13px 0' }}><DiscoverSectionHeading id="news-wire" title="The wire" /></div>
                {visibleWire.map((story) => (
                  <WireItem key={story.id} story={story} onOpen={() => open(story)} />
                ))}
                {visibleWire.length < wire.length && (
                  <LoadMoreRow onClick={() => setWireLimit((current) => current + WIRE_PAGE_SIZE)} />
                )}
              </section>
            )}
          </div>
          {viewerId && commentsStoryId && (
            <CommentsSheetV2
              isOpen
              onClose={() => setCommentsStoryId(null)}
              targetType="amateur_story"
              targetId={commentsStoryId}
            />
          )}
        </>
      )}
    </Frame>
  );
}
