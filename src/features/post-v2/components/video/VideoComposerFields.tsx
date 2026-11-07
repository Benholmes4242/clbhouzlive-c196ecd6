import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { StageMediaItem } from '../../hooks/useStageComposer';
import { extractPoster } from '../../lib/videoPoster';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { parseChapters, videoDescriptionMeta, videoDuration, type VideoDetails } from '../../lib/videoDetails';
import './videoCreator.css';

export function VideoTitleDescription({ details, description, duration, long, onChange, onDetails }: { details: VideoDetails; description: string; duration?: number; long: boolean; onChange: (patch: Partial<VideoDetails>) => void; onDetails: () => void }) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = titleRef.current; if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } }, [details.title]);
  const meta = videoDescriptionMeta(details, parseChapters(description, duration).length);
  return <div className="video-creator" data-video-composer>
    <div className="vc-title-head"><span className="vc-kicker">TITLE</span><span className="vc-kicker vc-title-type">{long ? 'LONG FORM' : 'SHORT'}</span></div>
    <textarea ref={titleRef} aria-label="Video title" className="vc-title" placeholder="What's this video?" maxLength={80} rows={1} value={details.title} onChange={e => onChange({ title: e.target.value.slice(0, 80) })} />
    <div className="vc-rule" /><div className="vc-count">{details.title.length}/80</div>
    <div className="vc-description-wrap"><Button variant="ghost" className="vc-description" onClick={onDetails}><span className="vc-grow"><b>Description</b><span className="vc-preview">{stripMentionMarkup(description) || 'Add the story, credits and links'}</span>{meta && <span className="vc-meta">{meta}</span>}</span><span className="vc-chevron">›</span></Button></div>
  </div>;
}
function CoverFrame({ item, time, selected, onPick }: { item: StageMediaItem; time: number; selected: boolean; onPick: () => void }) {
  const [poster, setPoster] = useState<string | null>(null);
  useEffect(() => { let cancelled = false; void extractPoster(`${item.id}:cover:${time}`, item.previewUrl, time).then(url => { if (!cancelled) setPoster(url); }); return () => { cancelled = true; }; }, [item.id, item.previewUrl, time]);
  return <Button variant="ghost" className="vc-frame" aria-label={`Cover frame at ${time.toFixed(1)} seconds`} aria-pressed={selected} onClick={onPick}>{poster && <img src={poster} alt="" />}</Button>;
}
export function VideoCoverChapters({ item, details, description, long, onChange, onFrame, onCover }: { item: StageMediaItem; details: VideoDetails; description: string; long: boolean; onChange: (patch: Partial<VideoDetails>) => void; onFrame: (time: number) => void; onCover: () => void }) {
  const duration = videoDuration(item);
  const chapters = parseChapters(description, duration);
  const times = [0.1, 0.35, 0.6, 0.85].map(part => (duration ?? 0) * part + (item.trimStart ?? 0));
  const portrait = (item.naturalHeight ?? 0) > (item.naturalWidth ?? 0);
  const selected = item.posterTimestamp ?? details.coverFrame;
  return <section className="video-creator vc-section" data-video-cover>
    <div className="vc-heading"><span className="vc-kicker">VIDEO</span>{long && <span className="vc-note">For Watch and your profile</span>}</div>
    <div className="vc-box"><div className="vc-part"><div className="vc-part-head">Cover<Button variant="ghost" className="vc-inline" onClick={onCover}>Pick a frame ›</Button></div>
      <div className="vc-frames" data-portrait={portrait}>{times.map((time, i) => <CoverFrame key={i} item={item} time={time} selected={selected == null ? i === 0 : Math.abs(selected - time) < 0.01} onPick={() => onFrame(time)} />)}</div>
      <div className="vc-toggle-row"><span>Put the title on the cover</span><Switch className="vc-switch" aria-label="Put the title on the cover" checked={!!details.title.trim() && details.titleOnCover} disabled={!details.title.trim()} onCheckedChange={titleOnCover => onChange({ titleOnCover })} /></div>
    </div>{long && <div className="vc-part" data-video-chapters><div className="vc-part-head">Chapters{chapters.length > 0 && <span className="vc-ok">{chapters.length} · from your timestamps</span>}</div>{chapters.length ? chapters.map(chapter => <div className="vc-chapter" key={chapter.seconds}><span className="vc-time">{chapter.time}</span><span className="vc-grow">{chapter.label}</span></div>) : <div className="vc-chapter-hint">Add timestamps starting at 0:00 to make chapters</div>}</div>}</div>
  </section>;
}