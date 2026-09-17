import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TourStory } from '../../news/useTourStories';
import { storyTime } from '../../news/storyTime';
import { FONT, INK, INK_MUTE, WHITE_ALPHA_06 } from '../../_shared/tokens';
import { OverviewSectionHead } from './OverviewSectionHead';

function StoryMeta({ story }: { story: TourStory }) { return <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_MUTE }}>{[story.kicker, storyTime(story.published_at)].filter(Boolean).join(' · ')}</span>; }
function NewsRow({ story, last, onOpen }: { story: TourStory; last: boolean; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  return <button type="button" onClick={onOpen} style={{ width: '100%', minHeight: 72, padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12, border: 0, borderBottom: last ? 'none' : `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', color: INK, textAlign: 'left', fontFamily: FONT, cursor: 'pointer' }}>{story.image_url && !failed ? <img src={story.image_url} alt="" loading="lazy" onError={() => setFailed(true)} style={{ width: 72, height: 56, flex: 'none', borderRadius: 10, objectFit: 'cover' }} /> : null}<span style={{ minWidth: 0, flex: 1 }}><StoryMeta story={story} /><span style={{ display: '-webkit-box', marginTop: 4, overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, fontSize: 14, lineHeight: 1.25, fontWeight: 700 }}>{story.headline}</span></span></button>;
}
export function selectOverviewNews(stories: TourStory[], excludeId?: string | null): { lead: TourStory | null; rows: TourStory[] } {
  const visible = stories.filter((story) => story.id !== excludeId).slice(0, 4);
  if (visible.length === 0) return { lead: null, rows: [] };
  const [newest, ...rest] = visible;
  return newest.image_url ? { lead: newest, rows: rest } : { lead: null, rows: visible };
}

export function OverviewNews({ stories, excludeId }: { stories: TourStory[]; excludeId?: string | null }) {
  const navigate = useNavigate(); const { t } = useTranslation('tourhub');
  const { lead, rows } = selectOverviewNews(stories, excludeId); if (!lead && rows.length === 0) return null;
  return <section data-overview-news-lead={lead?.id ?? ''}><OverviewSectionHead title={t('overview.news.title')} action={t('overview.news.all')} onAction={() => navigate('/tourhub?tab=news')} /><article style={{ fontFamily: FONT }}>{lead ? <button type="button" onClick={() => navigate(`/tour/news/${lead.slug}`)} style={{ width: '100%', padding: 0, border: 0, borderBottom: `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', color: INK, textAlign: 'left', cursor: 'pointer' }}><img src={lead.image_url ?? ''} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: 190, objectFit: 'cover' }} /><span style={{ display: 'block', padding: '12px 24px 14px' }}><StoryMeta story={lead} /><span style={{ display: '-webkit-box', marginTop: 6, overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, fontSize: 18, lineHeight: 1.22, fontWeight: 800 }}>{lead.headline}</span></span></button> : null}{rows.map((story, index) => <NewsRow key={story.id} story={story} last={index === rows.length - 1} onOpen={() => navigate(`/tour/news/${story.slug}`)} />)}</article></section>;
}