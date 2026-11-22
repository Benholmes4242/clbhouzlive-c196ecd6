import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MENTION_REGEX, parseMentionSegments, stripMentionMarkup } from '@/lib/mentions/format';
import { MentionText } from '@/components/mentions/MentionText';
import type { VideoChapter } from '@/features/post-v2/lib/videoDetails';
import './video-viewer.css';
export function VideoTeaser({ title, description, hasMore, chapter, chapterLabel, onOpen, feed = false }: { title: string; description: string; hasMore: boolean; chapter?: VideoChapter | null; chapterLabel?: string; onOpen: () => void; feed?: boolean }) {
  const markupLine = description.split(/\r?\n/)[0].replace(/\s+/g, ' ').trim();
  const line = stripMentionMarkup(markupLine);
  const hasMention = new RegExp(MENTION_REGEX.source).test(markupLine);
  const ref = useRef<HTMLDivElement>(null);
  const mirror = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState<string | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current, probe = mirror.current;
      if (!el || !probe || el.clientWidth === 0) return;
      probe.textContent = line;
      if (probe.getBoundingClientRect().width <= el.clientWidth - (hasMore ? 38 : 0)) { setCut(null); return; }
      const words = line.split(' '); let keep = '';
      for (const word of words) { const next = keep ? `${keep} ${word}` : word; probe.textContent = `${next}… more`; if (probe.getBoundingClientRect().width > el.clientWidth) break; keep = next; }
      setCut(keep);
    };
    measure(); let raf = 0;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); }) : null;
    if (ref.current) ro?.observe(ref.current);
    return () => { ro?.disconnect(); cancelAnimationFrame(raf); };
  }, [line, hasMore]);
  const more = hasMore || cut !== null || /\r?\n/.test(description);
  return <div data-video-teaser className={`video-teaser${feed ? ' video-teaser-feed' : ''}`} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
    {title && <Button variant="ghost" className="video-title" onClick={onOpen}>{title}</Button>}
    <div ref={ref} className="video-teaser-description">{hasMention ? <MentionText text={markupPrefix(markupLine, (cut ?? line).length)} /> : cut ?? line}{cut !== null && '…'}{more && <>{' '}<Button variant="ghost" className="video-more" onClick={onOpen}>more</Button></>}</div>
    <span ref={mirror} className="video-teaser-mirror" aria-hidden />
    {chapter && <Button variant="ghost" className="video-chapter" onClick={onOpen}>● {chapterLabel ?? `${chapter.time} ${chapter.label}`}</Button>}
  </div>;
}

/** FOLLOW-UP RULINGS §2(4): the teaser renders mentions through MentionText
 *  (bold, deep-linked, tap stops propagation). The measured cut is in plain
 *  characters; this keeps the markup whose plain text fits, dropping a mention
 *  the cut would split. */
export function markupPrefix(markup: string, plainLength: number): string {
  let out = '', used = 0;
  for (const seg of parseMentionSegments(markup)) {
    if (seg.kind === 'text') { const take = seg.text.slice(0, Math.max(0, plainLength - used)); out += take; used += take.length; if (take.length < seg.text.length) break; continue; }
    const shown = `@${seg.text}`;
    if (used + shown.length > plainLength) break;
    out += `@[${seg.text}](${seg.entityType === 'business' ? 'b' : 'u'}:${seg.entityId})`; used += shown.length;
  }
  return out.trimEnd();
}
