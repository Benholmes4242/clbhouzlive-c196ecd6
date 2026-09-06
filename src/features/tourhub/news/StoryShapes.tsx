/**
 * SHARED NEWS SHAPES (BRIEF_WIRE_REDESIGN S1).
 *
 * FOUR SHAPES, each denser than the last: hero, two-up, row, wire item. They
 * live here, beside LeadStory and StoryRow, and are imported by BOTH the
 * amateur News tab (src/components/explore-tab-new/NewsTabPage.tsx) and The
 * Wire (NewsTab.tsx). Two copies of a news card is how the two pages drift.
 *
 * Only CONTENT and the rail's heading differ between the surfaces; the shapes
 * are identical. Amber is never used here — amber means the viewing member.
 */
import React from 'react';

import { Button } from '@/components/ui/button';
import { categoriesLine } from '@/features/amateur/news/categories';
import { StoryRowEngagement } from '@/features/stories/StoryRowEngagement';
import type { StoryEngagement } from '@/features/stories/useStoryEngagement';
import { storyTime } from '@/features/tourhub/news/storyTime';
import type { TourStory } from '@/features/tourhub/news/useTourStories';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';

/** A tour story, or an amateur story (which extends it with two extra fields). */
export interface NewsStory extends TourStory {
  tournament_name?: string | null;
  categories?: string[];
}

export const GUTTER = 14;

export const COLUMN: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

export const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

export const tapReset: React.CSSProperties = {
  width: '100%',
  height: 'auto',
  whiteSpace: 'normal',
  textAlign: 'left',
  justifyContent: 'initial',
  background: 'none',
  border: 0,
  padding: 0,
  color: 'inherit',
  fontFamily: SANS,
};

export function tagFor(story: NewsStory) {
  return (
    story.tournament_name?.trim() ||
    story.kicker?.trim() ||
    categoriesLine(story.categories) ||
    'Golf'
  );
}

export function relativeDate(story: NewsStory) {
  return storyTime(story.published_at) || '';
}

export function wireDate(at: string | null) {
  if (!at) return '';
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date);
}

export interface StoryShapeProps {
  story: NewsStory;
  onOpen: () => void;
  engagement?: StoryEngagement | null;
  /** Live controls supplied by an index page; kept outside navigation buttons. */
  engagementAction?: React.ReactNode;
}

/**
 * THE HERO. The most recent story, full bleed, 340px fixed — a story with no
 * standfirst does not shrink the block. `topOffset` exists only for the
 * immersive route, where the fixed island floats over the photograph.
 */
export function HeroStory({
  story,
  onOpen,
  engagement,
  topOffset = 13,
  showEngagement = true,
  engagementAction,
  attachedContent,
}: StoryShapeProps & {
  topOffset?: number | string;
  showEngagement?: boolean;
  /** Live controls render outside the story button, so presses never navigate. */
  engagementAction?: React.ReactNode;
  /** Story-owned context, such as its tournament ticker, attaches to the hero. */
  attachedContent?: React.ReactNode;
}) {
  return (
    <>
      <Button variant="ghost" onClick={onOpen} style={{ ...tapReset, display: 'block' }} aria-label={`Read ${story.headline}`}>
        <article style={{ position: 'relative', height: 340, overflow: 'hidden', background: A.PANEL }}>
          {story.image_url && (
            <img src={story.image_url} alt="" loading="eager" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.30), rgba(0,0,0,.05) 34%, rgba(0,0,0,.86))' }} />
          <div style={{ ...COLUMN, position: 'absolute', top: topOffset, left: GUTTER, right: GUTTER, color: 'rgba(248,250,252,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tagFor(story)}{relativeDate(story) ? ` · ${relativeDate(story)}` : ''}
          </div>
          <div style={{ position: 'absolute', left: GUTTER, right: GUTTER, bottom: 14 }}>
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, lineHeight: 1.13, letterSpacing: '-0.01em', color: A.INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden', overflowWrap: 'anywhere' }}>
              {story.headline}
            </h1>
            {story.standfirst && (
              <p style={{ margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.48, color: 'rgba(248,250,252,0.80)', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
                {story.standfirst}
              </p>
            )}
          </div>
        </article>
      </Button>
      {attachedContent}
      {showEngagement && (
        <div style={{ margin: `11px ${GUTTER}px 0` }}>
          {engagementAction ?? <StoryRowEngagement engagement={engagement} inkColor={A.DIM} />}
        </div>
      )}
    </>
  );
}

/** THE TWO-UP. Needs exactly two; one remainder falls through to the rows. */
export function FeatureStory({ story, onOpen, engagement, engagementAction }: StoryShapeProps) {
  return (
    <article style={{ height: 199 }}>
      <Button variant="ghost" onClick={onOpen} style={{ ...tapReset, display: 'block' }} aria-label={`Read ${story.headline}`}>
        <div style={{ position: 'relative', width: '100%', height: 112, minHeight: 112, maxHeight: 112, flex: 'none', borderRadius: r.sm, overflow: 'hidden', background: A.PANEL }}>
          {story.image_url && <img src={story.image_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: 112, minHeight: 112, maxHeight: 112, objectFit: 'cover', display: 'block', flex: 'none' }} />}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.76))' }} />
          <div style={{ ...COLUMN, position: 'absolute', left: 9, right: 9, bottom: 8, color: 'rgba(248,250,252,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagFor(story)}</div>
        </div>
        <h2 style={{ margin: '9px 0 0', height: '53.76px', fontSize: 14, fontWeight: 700, lineHeight: 1.28, letterSpacing: 0, color: A.INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden', textOverflow: 'ellipsis', overflowWrap: 'anywhere' }}>{story.headline}</h2>
      </Button>
      <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ ...COLUMN, color: A.DIM, letterSpacing: 0, whiteSpace: 'nowrap' }}>{relativeDate(story)}</span>
        {engagementAction ?? <StoryRowEngagement engagement={engagement} inkColor={A.DIM} size={13} />}
      </div>
    </article>
  );
}

/** THE ROW. The workhorse: kicker and date, 14.5 headline, 74px thumbnail. */
export function WorkhorseRow({ story, onOpen, engagement, engagementAction }: StoryShapeProps) {
  return (
    <article style={{ position: 'relative', width: '100%', height: 119, boxSizing: 'border-box', padding: '13px 0' }}>
      <Button variant="ghost" onClick={onOpen} style={{ ...tapReset, display: 'flex', gap: 12 }} aria-label={`Read ${story.headline}`}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...COLUMN, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagFor(story)}{relativeDate(story) ? ` · ${relativeDate(story)}` : ''}</div>
          <h2 style={{ margin: '5px 0 0', height: '56.55px', fontSize: 14.5, fontWeight: 700, lineHeight: 1.3, letterSpacing: 0, color: A.INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden', textOverflow: 'ellipsis', overflowWrap: 'anywhere' }}>{story.headline}</h2>
        </div>
        {story.image_url && <img src={story.image_url} alt="" loading="lazy" decoding="async" style={{ width: 74, height: 74, borderRadius: r.sm, objectFit: 'cover', flexShrink: 0, background: A.PANEL }} />}
      </Button>
      <div style={{ position: 'absolute', left: 0, bottom: 13 }}>
        {engagementAction ?? <StoryRowEngagement engagement={engagement} inkColor={A.DIM} size={13} />}
      </div>
    </article>
  );
}

/** THE WIRE ITEM. The densest shape: no image, date in a fixed 26px column. */
export function WireItem({ story, onOpen }: StoryShapeProps) {
  return (
    <Button variant="ghost" onClick={onOpen} style={{ ...tapReset, borderTop: `1px solid ${A.HAIRLINE}` }} aria-label={`Read ${story.headline}`}>
      <article style={{ display: 'grid', gridTemplateColumns: '26px minmax(0, 1fr)', gap: 10, padding: '12px 13px' }}>
        <time dateTime={story.published_at ?? undefined} className="tabular-nums" style={{ ...COLUMN, color: A.DIM, letterSpacing: 0 }}>{wireDate(story.published_at)}</time>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, letterSpacing: 0, color: A.INK, overflowWrap: 'anywhere' }}>{story.headline}</h3>
          <div style={{ ...COLUMN, marginTop: 5, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagFor(story)}</div>
        </div>
      </article>
    </Button>
  );
}

/** THE CHIP RAIL. One scrolling row, never wrapping, no right-hand action. */
export function StoryChipRail({ heading, id, chips, selected, onSelect }: {
  heading: string;
  id: string;
  chips: Array<{ key: string; label: string; count: number }>;
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <section aria-labelledby={id} style={{ marginTop: 24 }}>
      <h2 id={id} style={{ ...KICKER, margin: '0 0 10px', color: A.INK }}>{heading}</h2>
      <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', willChange: 'transform', paddingBottom: 1 }}>
        {chips.map((chip) => (
          <Button
            key={chip.key}
            variant="outline"
            aria-pressed={selected === chip.key}
            onClick={() => onSelect(selected === chip.key ? null : chip.key)}
            style={{ flex: 'none', height: 'auto', padding: '9px 14px', borderRadius: r.sm, border: `1px solid ${selected === chip.key ? A.INK : A.BORDER}`, background: A.PANEL, color: A.INK, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, letterSpacing: 0 }}
          >
            {chip.label}<span className="tabular-nums" style={{ marginLeft: 7, fontSize: 11, color: A.DIM }}>{chip.count}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}

/** LOAD MORE, in place. No pagination and no infinite scroll. */
export function LoadMoreRow({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} style={{ width: '100%', height: 44, borderRadius: 0, borderTop: `1px solid ${A.HAIRLINE}`, color: A.INK, fontFamily: SANS, fontSize: 12.5, fontWeight: 700 }}>
      Load more
    </Button>
  );
}
