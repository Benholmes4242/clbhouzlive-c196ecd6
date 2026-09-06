import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesLine } from '@/features/amateur/news/categories';
import { type AmateurStory, useAmateurStories } from '@/features/amateur/news/useAmateurStories';
import { StoryRowEngagement } from '@/features/stories/StoryRowEngagement';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { storyTime } from '@/features/tourhub/news/storyTime';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';

const GUTTER = 14;
const WIRE_PAGE_SIZE = 10;
const COLUMN: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};
const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};
const tapReset: React.CSSProperties = {
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

function tagFor(story: AmateurStory) {
  return story.tournament_name?.trim() || story.kicker?.trim() || categoriesLine(story.categories) || 'Amateur golf';
}

function relativeDate(story: AmateurStory) {
  return storyTime(story.published_at) || '';
}

function HeroStory({ story, onOpen, engagement }: StoryShapeProps) {
  return (
    <>
      <Button variant="ghost" onClick={onOpen} style={{ ...tapReset, display: 'block' }} aria-label={`Read ${story.headline}`}>
        <article style={{ position: 'relative', height: 340, overflow: 'hidden', background: A.PANEL }}>
          {story.image_url && (
            <img src={story.image_url} alt="" loading="eager" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.30), rgba(0,0,0,.05) 34%, rgba(0,0,0,.86))' }} />
          <div style={{ ...COLUMN, position: 'absolute', top: 13, left: GUTTER, right: GUTTER, color: 'rgba(248,250,252,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      <div style={{ margin: `11px ${GUTTER}px 0` }}>
        <StoryRowEngagement engagement={engagement} inkColor={A.DIM} />
      </div>
    </>
  );
}

interface StoryShapeProps {
  story: AmateurStory;
  onOpen: () => void;
  engagement: ReturnType<ReturnType<typeof useStoryEngagement>['engagementFor']>;
}

function FeatureStory({ story, onOpen, engagement }: StoryShapeProps) {
  return (
    <Button variant="ghost" onClick={onOpen} style={{ ...tapReset, display: 'block' }} aria-label={`Read ${story.headline}`}>
      <article>
        <div style={{ position: 'relative', height: 112, borderRadius: r.sm, overflow: 'hidden', background: A.PANEL }}>
          {story.image_url && <img src={story.image_url} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.76))' }} />
          <div style={{ ...COLUMN, position: 'absolute', left: 9, right: 9, bottom: 8, color: 'rgba(248,250,252,0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagFor(story)}</div>
        </div>
        <h2 style={{ margin: '9px 0 0', fontSize: 14, fontWeight: 700, lineHeight: 1.28, letterSpacing: 0, color: A.INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden', overflowWrap: 'anywhere' }}>{story.headline}</h2>
        <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ ...COLUMN, color: A.DIM, letterSpacing: 0, whiteSpace: 'nowrap' }}>{relativeDate(story)}</span>
          <StoryRowEngagement engagement={engagement} inkColor={A.DIM} size={13} />
        </div>
      </article>
    </Button>
  );
}

function WorkhorseRow({ story, onOpen, engagement }: StoryShapeProps) {
  return (
    <Button variant="ghost" onClick={onOpen} style={tapReset} aria-label={`Read ${story.headline}`}>
      <article style={{ display: 'flex', gap: 12, width: '100%', padding: '13px 0' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...COLUMN, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagFor(story)}{relativeDate(story) ? ` · ${relativeDate(story)}` : ''}</div>
          <h2 style={{ margin: '5px 0 0', fontSize: 14.5, fontWeight: 700, lineHeight: 1.3, letterSpacing: 0, color: A.INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden', overflowWrap: 'anywhere' }}>{story.headline}</h2>
          <div style={{ marginTop: 7 }}><StoryRowEngagement engagement={engagement} inkColor={A.DIM} size={13} /></div>
        </div>
        {story.image_url && <img src={story.image_url} alt="" loading="lazy" decoding="async" style={{ width: 74, height: 74, borderRadius: r.sm, objectFit: 'cover', flexShrink: 0, background: A.PANEL }} />}
      </article>
    </Button>
  );
}

function wireDate(at: string | null) {
  if (!at) return '';
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date);
}

/** NEWS is editorial only and deliberately mounts no Discover media query. */
export function NewsTabPage() {
  const navigate = useNavigate();
  const { stories = [], isPending } = useAmateurStories(null);
  const [wireLimit, setWireLimit] = useState(WIRE_PAGE_SIZE);
  const { engagementFor } = useStoryEngagement('amateur_story', useMemo(() => stories.map((story) => story.id), [stories]));

  const lead = stories[0];
  const afterLead = stories.slice(1);
  const twoUp = afterLead.length >= 2 ? afterLead.slice(0, 2) : [];
  const afterFeatures = afterLead.slice(twoUp.length);
  const rows = afterFeatures.slice(0, 3);
  const wire = afterFeatures.slice(3);
  const visibleWire = wire.slice(0, wireLimit);

  const competitions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const story of stories) {
      const name = story.tournament_name?.trim();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  }, [stories]);

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
              <section aria-labelledby="news-competitions" style={{ marginTop: 24 }}>
                <h2 id="news-competitions" style={{ ...KICKER, margin: '0 0 10px', color: A.INK }}>By competition</h2>
                <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', willChange: 'transform', paddingBottom: 1 }}>
                  {competitions.map(([name, count]) => (
                    <Button key={name} variant="outline" onClick={() => navigate(`/discover/news?competition=${encodeURIComponent(name)}`)} style={{ flex: 'none', height: 'auto', padding: '9px 14px', borderRadius: r.sm, border: `1px solid ${A.BORDER}`, background: A.PANEL, color: A.INK, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, letterSpacing: 0 }}>
                      {name}<span className="tabular-nums" style={{ marginLeft: 7, fontSize: 11, color: A.DIM }}>{count}</span>
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {wire.length > 0 && (
              <section aria-labelledby="news-wire" style={{ marginTop: 26, borderRadius: r.md, overflow: 'hidden', background: A.PANEL, border: `1px solid ${A.BORDER}` }}>
                <h2 id="news-wire" style={{ ...KICKER, margin: 0, padding: '13px 13px 9px', color: A.INK }}>The wire</h2>
                {visibleWire.map((story, index) => (
                  <Button key={story.id} variant="ghost" onClick={() => open(story)} style={{ ...tapReset, borderTop: `1px solid ${A.HAIRLINE}` }} aria-label={`Read ${story.headline}`}>
                    <article style={{ display: 'grid', gridTemplateColumns: '26px minmax(0, 1fr)', gap: 10, padding: '12px 13px' }}>
                      <time dateTime={story.published_at ?? undefined} className="tabular-nums" style={{ ...COLUMN, color: A.DIM, letterSpacing: 0 }}>{wireDate(story.published_at)}</time>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, letterSpacing: 0, color: A.INK, overflowWrap: 'anywhere' }}>{story.headline}</h3>
                        <div style={{ ...COLUMN, marginTop: 5, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagFor(story)}</div>
                      </div>
                    </article>
                  </Button>
                ))}
                {visibleWire.length < wire.length && (
                  <Button variant="ghost" onClick={() => setWireLimit((current) => current + WIRE_PAGE_SIZE)} style={{ width: '100%', height: 44, borderRadius: 0, borderTop: `1px solid ${A.HAIRLINE}`, color: A.INK, fontFamily: SANS, fontSize: 12.5, fontWeight: 700 }}>
                    Load more
                  </Button>
                )}
              </section>
            )}
          </div>
        </>
      )}
    </main>
  );
}