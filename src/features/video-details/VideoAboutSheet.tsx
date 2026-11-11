/** PF3B: one sheet for feed and fullscreen; callers own seek/open and navigation.
 * The existing composer sheet supplies history/lifecycle; its opt-in material
 * leaves all composer defaults unchanged. This reader never fetches per post. */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { parseMentionSegments } from '@/lib/mentions/format';
import BottomSheet from '@/features/post-v2/components/BottomSheet';
import { CREDIT_ROLES, detectVideoLink, type VideoChapter } from '@/features/post-v2/lib/videoDetails';
import { formatCountKilo } from '@/i18n/format';
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostVideoDetails } from './videoDetailsModel';
import './video-viewer.css';
import { RoundVideoScorecard } from './RoundVideoScore';
import type { VideoRound } from './roundVideoModel';
export function VideoAboutSheet({ open, post, details, chapters, likes, onClose, onTime, onNavigate, round, chapter, onScorecard }: { open: boolean; post: FeedPost; details?: PostVideoDetails | null; chapters: VideoChapter[]; likes: number; onClose: () => void; onTime: (seconds: number) => void; onNavigate: (path: string) => void; round?: VideoRound | null; chapter?: VideoChapter | null; onScorecard?: () => void }) {
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setShowAll(false); }, [post.id, open]);
  useEffect(() => { if (!open) return; const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose(); } }; window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true); }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  const go = (path: string) => { onClose(); onNavigate(path); };
  const seek = (seconds: number) => { onTime(seconds); onClose(); };
  const date = new Date(post.createdAt);
  const posted = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const segments = parseMentionSegments(post.caption);
  const section = (name: string, body: React.ReactNode) => <section className="video-about-section" data-video-section={name}><h3 className="video-about-kicker">{name}</h3>{body}</section>;
  return createPortal(<BottomSheet open title={undefined} onClose={onClose} surfaceClassName="video-about-surface">
    <div className="video-about" role="dialog" aria-modal="true" aria-label="About this video">
      <h2>{details?.title || 'About this video'}</h2>
      <div className="video-about-stats"><span><b>{formatCountKilo(likes)}</b> likes</span>{posted && <span>{posted}</span>}</div>
      {post.caption && <div className="video-about-description">{segments.map((segment, index) => {
        if (segment.kind === 'mention' && segment.entityId) return <Button key={index} variant="ghost" className="video-inline" onClick={() => go(segment.entityType === 'business' ? `/business/${segment.entityId}` : `/profile/${segment.entityId}`)}>{segment.text}</Button>;
        return <span key={index}>{segment.text.split(/(https:\/\/[^\s]+|\b\d+:\d{2}(?::\d{2})?\b)/g).map((part, i) => {
        if (/^https:\/\//.test(part)) { const link = detectVideoLink(part); return link ? <a key={i} className="video-inline" href={link.url} target="_blank" rel="noopener noreferrer">{part}</a> : part; }
        if (/^\d+:\d{2}(?::\d{2})?$/.test(part)) { const n = part.split(':').map(Number); if (n.slice(1).every(v => v < 60)) { const seconds = n.reduce((s, v) => s * 60 + v, 0); return <Button key={i} variant="ghost" className="video-inline" onClick={() => seek(seconds)}>{part}</Button>; } }
        return part;
      })}</span>; })}</div>}
      {round && details?.scoreFollows !== false && onScorecard && <RoundVideoScorecard round={round} chapters={chapters} chapter={chapter} onTime={seek} onScorecard={() => { onClose(); onScorecard(); }} />}
      {chapters.length > 0 && section('Chapters', <>{(round && !showAll ? chapters.slice(0, 4) : chapters).map(c => { const hole = c.holeNo ? round?.shape?.holes.find(h => h.holeNo === c.holeNo) : null; return <Button key={c.seconds} variant="ghost" className="video-about-row video-about-chapter" onClick={() => seek(c.seconds)}><span className="video-about-time">{c.time}</span><span className="video-about-grow">{c.label}{hole?.par != null && <span className="round-video-chapter-par"> · Par {hole.par}</span>}</span>{hole?.strokes != null && <b className="round-video-chapter-score" data-under={hole.par != null && hole.strokes < hole.par}>{hole.strokes}</b>}</Button>; })}{round && chapters.length > 4 && !showAll && <Button variant="ghost" className="round-video-show-all" onClick={() => setShowAll(true)}>Show all {chapters.length}</Button>}</>)}
      {post.courseId && post.courseName && section('Filmed at', <Button variant="ghost" className="video-about-row" onClick={() => go(`/courses/${post.courseId}`)}><SquircleAvatar size={28} src={post.courseThumbnailImage} alt={post.courseName} hairlineRing /><span className="video-about-grow"><b>{post.courseName}</b><small>{post.courseRegion || post.courseSubCountry}{(post.courseRegion || post.courseSubCountry) && ' · '}Course page ›</small></span></Button>)}
      {!!details?.credits.length && section('In this video', <div className="video-about-people">{details.credits.map(c => <Button key={c.profileId} variant="ghost" className="video-about-person" onClick={() => go(`/profile/${c.profileId}`)}><SquircleAvatar size={44} src={c.avatarUrl} alt={c.name} hairlineRing /><b>{c.name}</b><small>{CREDIT_ROLES.find(([r]) => r === c.role)?.[1]}</small></Button>)}</div>)}
      {!!details?.links.length && section('Links', details.links.map((l, i) => { const link = detectVideoLink(l.url); return link ? <a key={i} className="video-about-row video-about-link" href={link.url} target="_blank" rel="noopener noreferrer"><span className="video-about-glyph">{link.glyph}</span><span className="video-about-grow">{l.label || link.label}<small>{link.url}</small></span></a> : null; }))}
      {!!details?.thanks.length && section('Thanks to', details.thanks.map(b => <Button key={b.businessId} variant="ghost" className="video-about-row" onClick={() => go(`/business/${b.businessId}`)}><SquircleAvatar size={28} src={b.logoUrl} alt={b.name} hairlineRing /><span className="video-about-grow"><b>{b.name}</b><small>{b.category}</small></span></Button>))}
      {!!details?.gear.length && section('Gear in this video', details.gear.map((g, i) => <div key={i} className="video-about-gear">{g}</div>))}
    </div>
  </BottomSheet>, document.body);
}