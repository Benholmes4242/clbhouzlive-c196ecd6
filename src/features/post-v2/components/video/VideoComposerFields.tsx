import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { StageMediaItem } from '../../hooks/useStageComposer';
import { extractPoster } from '../../lib/videoPoster';
import { extractMentions, MENTION_REGEX, stripMentionMarkup } from '@/lib/mentions/format';
import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import { parseChapters, videoDescriptionMeta, videoDuration, videoCoverSelection, type VideoDetails } from '../../lib/videoDetails';
import './videoCreator.css';
import { RoundVideoFields, type RoundVideoContext } from './RoundVideoFields';

// Map visible selection to storage offsets without cutting through a mention token.
function titleOffset(markup: string, position: number, end = false): number {
  let delta = 0;
  for (const m of markup.matchAll(new RegExp(MENTION_REGEX.source, 'g'))) {
    const start = m.index - delta;
    const length = m[1].length + 1;
    if (position <= start) break;
    if (position < start + length) return end ? m.index + m[0].length : m.index;
    delta += m[0].length - length;
  }
  return position + delta;
}

export function VideoTitleDescription({ details, description, duration, long, currentUserId, onChange, onDetails }: { details: VideoDetails; description: string; duration?: number; long: boolean; currentUserId?: string | null; onChange: (patch: Partial<VideoDetails>) => void; onDetails: () => void }) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const markup = details.titleMarkup ?? details.title;
  const updateTitle = (value: string) => {
    let next = value.replace(/[\r\n]+/g, '');
    const plain = stripMentionMarkup(next);
    if (plain.length > 80) {
      const previous = new Set(extractMentions(markup).map(m => `${m.entityType}:${m.entityId}`));
      if (extractMentions(next).some(m => !previous.has(`${m.entityType}:${m.entityId}`))) return;
      next = next.slice(0, titleOffset(next, 80));
    }
    onChange({ titleMarkup: next, title: stripMentionMarkup(next) });
  };
  const meta = videoDescriptionMeta(details, parseChapters(description, duration).length);
  return <div className="video-creator" data-video-composer>
    <div className="vc-title-head"><span className="vc-kicker">TITLE</span><span className="vc-kicker vc-title-type">{long ? 'LONG FORM' : 'SHORT'}</span></div>
    <div className="vc-title-input" onKeyDownCapture={e => { if (e.key === 'Enter') e.preventDefault(); }} onPasteCapture={e => {
      const text = e.clipboardData.getData('text/plain');
      if (!/[\r\n]/.test(text)) return;
      e.preventDefault();
      const input = titleRef.current;
      if (!input) return;
      updateTitle(markup.slice(0, titleOffset(markup, input.selectionStart)) + text.replace(/[\r\n]+/g, '') + markup.slice(titleOffset(markup, input.selectionEnd, true)));
    }}>
      <style>{`.vc-title-input{padding:6px 16px 0;min-width:0}.vc-title-input .mentions-composer textarea,.vc-title-input .mentions-composer__highlighter{font-weight:700!important}`}</style>
      <MentionsComposerInput value={markup} onChange={updateTitle} placeholder="What's this video?" maxLength={80} currentUserId={currentUserId} inputRef={el => { titleRef.current = el; el?.setAttribute('aria-label', 'Video title'); }} textStyle={{ fontSize: 21, lineHeight: 1.25, padding: '0', minHeight: 27, color: 'var(--video-ink)', caretColor: 'var(--video-ink)', placeholderColor: 'var(--video-dim)' }} />
    </div>
    <div className="vc-rule" /><div className="vc-count">{details.title.length}/80</div>
    <div className="vc-description-wrap"><Button variant="ghost" className="vc-description" onClick={onDetails}><span className="vc-grow"><b>Description</b><span className="vc-preview">{stripMentionMarkup(description) || 'Add the story, credits and links'}</span>{meta && <span className="vc-meta">{meta}</span>}</span><span className="vc-chevron">›</span></Button></div>
  </div>;
}
function CoverFrame({ item, time, selected, onPick }: { item: StageMediaItem; time: number; selected: boolean; onPick: () => void }) {
  const [poster, setPoster] = useState<string | null>(null);
  useEffect(() => { let cancelled = false; void extractPoster(`${item.id}:cover:${time}`, item.previewUrl, time).then(url => { if (!cancelled) setPoster(url); }); return () => { cancelled = true; }; }, [item.id, item.previewUrl, time]);
  return <Button variant="ghost" className="vc-frame" aria-label={`Cover frame at ${time.toFixed(1)} seconds`} aria-pressed={selected} onClick={onPick}>{poster && <img src={poster} alt="" />}</Button>;
}
export function VideoCoverChapters({ item, details, description, long, onChange, onFrame, onCover, round, onMark }: { item: StageMediaItem; details: VideoDetails; description: string; long: boolean; onChange: (patch: Partial<VideoDetails>) => void; onFrame: (time: number) => void; onCover: () => void; round?: RoundVideoContext | null; onMark?: () => void }) {
  const duration = videoDuration(item);
  const chapters = parseChapters(description, duration);
  const { times, selectedIndex } = videoCoverSelection(item, details.coverFrame);
  const portrait = (item.naturalHeight ?? 0) > (item.naturalWidth ?? 0);
  return <section className="video-creator vc-section" data-video-cover>
    <div className="vc-heading"><span className="vc-kicker">VIDEO</span>{long && <span className="vc-note">For Watch and your profile</span>}</div>
    <div className="vc-box"><div className="vc-part"><div className="vc-part-head">Cover<Button variant="ghost" className="vc-inline" onClick={onCover}>Pick a frame ›</Button></div>
      <div className="vc-frames" data-portrait={portrait}>{times.map((time, i) => <CoverFrame key={i} item={item} time={time} selected={i === selectedIndex} onPick={() => onFrame(time)} />)}</div>
      <div className="vc-toggle-row"><span>Put the title on the cover</span><Switch className="vc-switch" aria-label="Put the title on the cover" checked={!!details.title.trim() && details.titleOnCover} disabled={!details.title.trim()} onCheckedChange={titleOnCover => onChange({ titleOnCover })} /></div>
    </div>{long && round && onMark ? <RoundVideoFields details={details} duration={duration ?? 0} round={round} onChange={onChange} onMark={onMark} /> : long && <div className="vc-part" data-video-chapters><div className="vc-part-head">Chapters{chapters.length > 0 && <span className="vc-ok">{chapters.length} · from your timestamps</span>}</div>{chapters.length ? chapters.map(chapter => <div className="vc-chapter" key={chapter.seconds}><span className="vc-time">{chapter.time}</span><span className="vc-grow">{chapter.label}</span></div>) : <div className="vc-chapter-hint">Add timestamps starting at 0:00 to make chapters</div>}</div>}</div>
  </section>;
}