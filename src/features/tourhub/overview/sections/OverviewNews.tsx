import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTourSelection } from '../../context/TourSelectionContext';
import { useTourStories, type TourStory } from '../../news/useTourStories';
import { FONT, INK, INK_MUTE, SURFACE, WHITE_ALPHA_06 } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

const NEWS_TOURS = new Set(['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv']);
function relativeTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value); if (Number.isNaN(date.getTime())) return '';
  const hours = Math.floor((Date.now() - date.getTime()) / 3_600_000);
  if (hours < 24) return `${Math.max(0, hours)}H AGO`;
  if (hours < 48) return 'YESTERDAY';
  if (hours < 24 * 7) return new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date).toUpperCase();
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(date).toUpperCase();
}
function StoryMeta({ story }: { story: TourStory }) { return <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_MUTE }}>{[story.kicker, relativeTime(story.published_at)].filter(Boolean).join(' · ')}</span>; }
function NewsRow({ story, last, onOpen }: { story: TourStory; last: boolean; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  return <button type="button" onClick={onOpen} style={{ width: '100%', minHeight: 72, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, border: 0, borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: 'pointer' }}>{story.image_url && !failed ? <img src={story.image_url} alt="" loading="lazy" onError={() => setFailed(true)} style={{ width: 72, height: 56, flex: 'none', borderRadius: 10, objectFit: 'cover' }} /> : null}<span style={{ minWidth: 0, flex: 1 }}><StoryMeta story={story} /><span style={{ display: '-webkit-box', marginTop: 4, overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, fontSize: 14, lineHeight: 1.25, fontWeight: 700 }}>{story.headline}</span></span></button>;
}
export function OverviewNews() {
  const navigate = useNavigate(); const { t } = useTranslation('tourhub'); const { selectedTourSlug } = useTourSelection();
  const active = selectedTourSlug ?? 'all'; const { stories } = useTourStories(NEWS_TOURS.has(active) ? active : null); const visible = stories.slice(0, 4); if (visible.length === 0) return null;
  const [lead, ...rows] = visible;
  return <section><OverviewSectionHead title={t('overview.news.title')} action={t('overview.news.all')} onAction={() => navigate('/tourhub?tab=news')} /><article style={{ margin: '0 10px', overflow: 'hidden', borderRadius: 16, background: SURFACE, fontFamily: FONT }}><button type="button" onClick={() => navigate(`/tour/news/${lead.slug}`)} style={{ width: '100%', padding: 0, border: 0, background: 'transparent', color: INK, textAlign: 'left', cursor: 'pointer' }}>{lead.image_url ? <img src={lead.image_url} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: 190, objectFit: 'cover' }} /> : null}<span style={{ display: 'block', padding: '12px 14px 14px' }}><StoryMeta story={lead} /><span style={{ display: '-webkit-box', marginTop: 6, overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, fontSize: 18, lineHeight: 1.22, fontWeight: 800 }}>{lead.headline}</span></span></button>{rows.map((story, index) => <NewsRow key={story.id} story={story} last={index === rows.length - 1} onOpen={() => navigate(`/tour/news/${story.slug}`)} />)}</article></section>;
}