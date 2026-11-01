/** Opt-in rendering for the three shared StoryShapes; only OverviewNews passes
 * this presentation. Shared defaults, engagement and storyTime stay frozen. */
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { TourStory } from '../../news/useTourStories';
import { newsDetails, type NewsPresentation, type NewsPlayer } from './overviewNewsRules';

export function NewsPlayerChip({ player }: { player: NewsPlayer }) {
  const { t } = useTranslation('tourhub');
  return <span className={player.live ? 'overview-news-player' : 'overview-news-yours'} data-followed={player.followed} data-player-id={player.id}>
    {player.followed && <span>★</span>}{player.surname}
    {player.live && <><b className="tabular-nums">{player.position}</b><em className="tabular-nums" style={{ color: player.color }}>{player.score}</em>{player.thru && <small className="tabular-nums">{player.thru === 'F' ? 'F' : t('overview.news.thru', { count: Number(player.thru) })}</small>}</>}
  </span>;
}
export function NewsDetails({ story, presentation, short }: { story: TourStory; presentation: NewsPresentation; short: boolean }) {
  const { t } = useTranslation('tourhub');
  const details = newsDetails(story, presentation.liveRound, short, presentation.now);
  /* OPT-IN (BRIEF_TOUR_NEWS_PAGE §6): the News page appends like/comment
   * counts, only above zero. The overview passes no engagement and renders
   * exactly as before. */
  const engagement = presentation.engagement;
  const parts = [presentation.liveRound != null ? <span className="overview-news-live"><i aria-hidden />{t('overview.news.liveRound', { round: presentation.liveRound })}</span> : null,
    details.tour || null, details.minutes != null ? t(short ? 'overview.news.minutesShort' : 'overview.news.minutes', { count: details.minutes }) : null, details.age || null,
    engagement && engagement.likes > 0 ? t('overview.news.likes', { count: engagement.likes }) : null,
    engagement && engagement.comments > 0 ? t('overview.news.comments', { count: engagement.comments }) : null].filter(Boolean);
  return <div className="overview-news-details">{parts.map((part, index) => <Fragment key={index}>{index > 0 && <span className="overview-news-separator" aria-hidden>·</span>}<span>{part}</span></Fragment>)}</div>;
}
export function OverviewNewsStory({ story, onOpen, presentation, shape }: { story: TourStory; onOpen: () => void; presentation: NewsPresentation; shape: 'hero' | 'pair' | 'row' }) {
  const followedPlayer = presentation.followedPlayer ?? presentation.players.find(player => player.followed);
  const kicker = <div className="overview-news-kicker">{presentation.isNew && <i className="overview-news-dot" aria-hidden />}<span>{story.kicker}</span></div>;
  const photo = <div className="overview-news-photo">{story.image_url && <img src={story.image_url} alt="" loading={shape === 'hero' ? 'eager' : 'lazy'} decoding="async" />}{shape === 'pair' && followedPlayer && <div className="overview-news-photo-follow"><NewsPlayerChip player={{ ...followedPlayer, live: false }} /></div>}</div>;
  const chips = shape !== 'pair' && presentation.players.length > 0 ? <div className="overview-news-players">{presentation.players.map(player => <NewsPlayerChip key={player.id} player={player} />)}</div> : null;
  return <Button variant="ghost" className={`overview-news-story overview-news-${shape}`} onClick={onOpen} aria-label={`Read ${story.headline}`} data-news-shape={shape}>
    {shape !== 'row' && photo}
    <div className="overview-news-copy">{kicker}<h3>{story.headline}</h3>{shape === 'hero' && story.standfirst && <p>{story.standfirst}</p>}<NewsDetails story={story} presentation={presentation} short={shape === 'pair'} />{chips}</div>
    {shape === 'row' && photo}
  </Button>;
}