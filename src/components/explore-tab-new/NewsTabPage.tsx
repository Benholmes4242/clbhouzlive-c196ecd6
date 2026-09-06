import { useNavigate } from 'react-router-dom';

import { useAmateurStories } from '@/features/amateur/news/useAmateurStories';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { StoryRowEngagement } from '@/features/stories/StoryRowEngagement';
import { LeadStory, StoryRow } from '@/features/tourhub/news/NewsTab';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { ListTerminalRow } from './courseled/ListTerminalRow';

const GUTTER = 14;

/**
 * NEWS is editorial only. It mounts no media query: Clips, From the reviews,
 * From the rounds, Moments and Videos all live on GALLERY.
 */
export function NewsTabPage() {
  const navigate = useNavigate();
  const { stories = [] } = useAmateurStories(null);
  const visibleStories = stories.slice(0, 5);
  const { engagementFor } = useStoryEngagement('amateur_story', visibleStories.map((story) => story.id));
  const lead = visibleStories[0];
  const remaining = visibleStories.slice(1);

  return (
    <main style={{ paddingTop: 'var(--discover-header-h)', minHeight: '100dvh', background: A.CANVAS, color: A.INK, fontFamily: SANS }}>
      <section style={{ position: 'relative', minHeight: 216, overflow: 'hidden', borderBottom: `1px solid ${A.BORDER}` }}>
        {lead?.image_url && <img src={lead.image_url} alt="" loading="eager" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(21,23,31,.10) 0%, rgba(21,23,31,.94) 100%)' }} />
        <div style={{ position: 'relative', minHeight: 216, padding: '34px 20px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0, color: A.BODY, marginBottom: 9 }}>THE AMATEUR GAME</div>
          <div style={{ fontSize: 31, lineHeight: 1.02, fontWeight: 700, letterSpacing: 0, maxWidth: 320 }}>News, reporting and the game in motion</div>
          <div style={{ display: 'flex', gap: 22, marginTop: 20, color: A.BODY, fontSize: 12, fontWeight: 700 }}>
            <span>{stories.length} stories</span>
          </div>
        </div>
      </section>

      <div style={{ padding: `28px ${GUTTER}px 110px` }}>
        <section>
          {lead && (
            <>
              <LeadStory story={lead} compact={false} immersiveHero={false} onOpen={() => navigate(`/discover/news/${lead.slug}`)} engagement={engagementFor(lead.id)} />
              <p style={{ margin: '10px 0 8px', color: A.BODY, fontSize: 13, lineHeight: 1.45 }}>{lead.standfirst}</p>
              <StoryRowEngagement engagement={engagementFor(lead.id)} />
            </>
          )}
          <div style={{ marginTop: 14 }}>
            {remaining.map((story) => (
              <StoryRow key={story.id} story={story} onOpen={() => navigate(`/discover/news/${story.slug}`)} engagement={engagementFor(story.id)} />
            ))}
          </div>
          <ListTerminalRow label="All stories" onPress={() => navigate('/discover/news')} />
        </section>
      </div>
    </main>
  );
}
