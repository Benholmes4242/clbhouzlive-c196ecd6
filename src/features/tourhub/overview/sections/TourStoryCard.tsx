import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTourSelection } from '../../context/TourSelectionContext';
import { useTourStories } from '../../news/useTourStories';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { r } from '@/lib/radius';
import { relativeDay } from '@/features/explore-magazine/exploreCopy';
import { StdShell } from '@/features/explore-magazine/ExploreShells';

const NEWS_TOURS = new Set(['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv']);

export function TourStoryCard({ index, lead = false }: { index: number; lead?: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { selectedTourSlug } = useTourSelection();
  const active = selectedTourSlug ?? 'all';
  const { stories, isLoading } = useTourStories(NEWS_TOURS.has(active) ? active : null);
  const story = stories[index];

  if (isLoading && !story) return <div style={{ padding: '0 20px' }}><StdShell /></div>;
  if (!story) return null;

  return (
    <article style={{ padding: '0 20px', fontFamily: SANS, minWidth: 0 }}>
      <button
        type="button"
        onClick={() => navigate(`/tour/news/${story.slug}`)}
        style={{ width: '100%', padding: 0, border: 0, background: 'transparent', color: A.INK, textAlign: 'left', cursor: 'pointer', minWidth: 0 }}
      >
        <span style={{ display: 'block', height: lead ? 260 : 210, overflow: 'hidden', borderRadius: lead ? r.lg : r.md, background: A.PANEL }}>
          {story.image_url ? <img src={story.image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        </span>
        <span style={{ display: 'block', paddingInline: 4, marginTop: 8 }}>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[story.kicker || t('news.masthead'), relativeDay(story.published_at)].filter(Boolean).join(' · ')}
          </span>
          <span style={{ display: '-webkit-box', marginTop: 6, fontSize: lead ? 20 : 16, fontWeight: 700, lineHeight: 1.22, color: A.INK, WebkitLineClamp: lead ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'break-word' }}>
            {story.headline}
          </span>
          {lead && story.standfirst ? (
            <span style={{ display: '-webkit-box', marginTop: 7, fontSize: 13, lineHeight: 1.45, color: A.MUTE, WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {story.standfirst}
            </span>
          ) : null}
        </span>
      </button>
    </article>
  );
}
