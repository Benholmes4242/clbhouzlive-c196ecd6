/** Brief 38: the one countdown rail body shared by the profile Top 10 and the Clubhouse ten post.
 * Owns measured card size, scroller, TenRailCard list, ticks, active index, the Brief 31 band,
 * hint row, visitor pills and the course comments sheet. Figures are decided by the block
 * (owner or signed out: Golfers/Tens; signed-in visitor: Golfers/You), never by the page.
 * Callers own headings, invitations, Manage, deep-link sourcing and the share sheet. */
import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TenBand, TenPills } from '@/components/topTen/TenBand';
import { TenRailCard } from '@/components/topTen/TenRailCard';
import { tenLocation, type TenBlockData, type TenCourse } from '@/components/topTen/topTenModel';
import { chartCardSize } from '@/components/courses/browse/clbhouzTenRules';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import '@/styles/clbhouz-ten.css';
import '@/styles/top-ten.css';

export const RAIL_GAP = 10;
export const railFigures = (c: TenCourse, block: TenBlockData, signedIn: boolean) => [
  { label: 'Golfers', value: c.golfers_score == null ? '–' : c.golfers_score.toFixed(1), missing: c.golfers_score == null },
  !block.is_owner && signedIn
    ? { label: 'You', value: c.viewer_score == null ? '–' : c.viewer_score.toFixed(1), missing: c.viewer_score == null }
    : { label: 'Tens', value: c.in_tens },
];

/** Measures the element's width as chart card geometry (Brief 32 rule). */
export function useRailCardSize(ref: React.RefObject<HTMLElement>, enabled = true) {
  const [size, setSize] = React.useState(() => chartCardSize(document.documentElement.clientWidth));
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const measure = () => { const width = element.getBoundingClientRect().width; if (width > 32) setSize(chartCardSize(width)); };
    measure(); const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, ref]);
  return size;
}

export interface TenRailProps {
  block: TenBlockData;
  signedIn: boolean;
  /** Scroll to this card on mount, no animation, band closed. */
  openOnCourseId?: string | null;
  /** Profile deep link: scroll to the card, open its band, then its comment. */
  openBandOnCourseId?: string | null;
  initialCommentId?: string | null;
  storyOverride?: { courseId: string; text: string } | null;
  hintText: string;
  hintAction?: React.ReactNode;
  pills?: boolean;
  className?: string;
}

export function TenRail({ block, signedIn, openOnCourseId = null, openBandOnCourseId = null, initialCommentId = null, storyOverride = null, hintText, hintAction, pills = false, className = 'ten-rail-body' }: TenRailProps) {
  const reduceMotion = useReducedMotion();
  const container = React.useRef<HTMLDivElement>(null);
  const rail = React.useRef<HTMLDivElement>(null);
  const size = useRailCardSize(container);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [commentsId, setCommentsId] = React.useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const touched = React.useRef(false);
  const topTen = React.useMemo(() => [...block.courses].sort((a, b) => a.position - b.position), [block]);
  const scrollTo = React.useCallback((index: number, smooth = true) => rail.current?.scrollTo?.({ left: index * (size.width + RAIL_GAP), behavior: smooth && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' }), [size.width]);
  const ownerId = block.owner.user_id;
  // Deep link: scroll to the course, open its band, then its comment.
  React.useEffect(() => {
    if (!openBandOnCourseId) return;
    const index = topTen.findIndex(c => c.course_id === openBandOnCourseId);
    if (index < 0) return;
    setSelectedId(openBandOnCourseId); setActive(index); scrollTo(index, false);
    if (initialCommentId) { setCommentsId(openBandOnCourseId); setCommentsOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openBandOnCourseId, initialCommentId, ownerId]);
  // Opening card: re-applied as the measured size settles, until the member touches the rail.
  const openIndex = openOnCourseId ? topTen.findIndex(c => c.course_id === openOnCourseId) : -1;
  React.useLayoutEffect(() => {
    if (openIndex <= 0 || touched.current) return;
    setActive(openIndex); scrollTo(openIndex, false);
  }, [openIndex, scrollTo]);
  const selected = topTen.find(c => c.course_id === selectedId) ?? null;
  const styles = { '--ten-card-w': `${size.width}px`, '--ten-card-h': `${size.height}px` } as React.CSSProperties;
  return <div ref={container} className={className} style={styles} data-ten-rail>
    <div className="clb-ten-rail" ref={rail} data-open={!!selected} onPointerDown={() => { touched.current = true; }} onTouchStart={() => { touched.current = true; }}
      onScroll={event => setActive(Math.max(0, Math.min(topTen.length - 1, Math.round(event.currentTarget.scrollLeft / (size.width + RAIL_GAP)))))}>
      {topTen.map(c => <TenRailCard key={c.course_id} rank={c.position} courseId={c.course_id} name={c.name} imageUrl={c.thumbnail_image} place={tenLocation(c)}
        ariaLabel={`#${c.position} ${c.name}${c.member_score == null ? '' : `, ${c.member_score.toFixed(1)}`}`}
        corner={c.member_score != null && <span className="ten-score-pill ten-rail-score" data-ten-corner-score>{c.member_score.toFixed(1)}</span>}
        figures={railFigures(c, block, signedIn)}
        story={storyOverride?.courseId === c.course_id ? storyOverride.text : c.chart_rank != null ? `#${c.chart_rank} on the clbhouz ten` : null}
        selected={selectedId === c.course_id} dimmed={!!selected && selectedId !== c.course_id}
        onClick={() => setSelectedId(selectedId === c.course_id ? null : c.course_id)} />)}
    </div>
    <div className="clb-ten-ticks">{topTen.map((c, index) => <Button variant="ghost" key={c.course_id} className="clb-ten-tick" aria-label={`Go to card ${index + 1}`} aria-current={active === index} onClick={() => { touched.current = true; scrollTo(index); }} />)}</div>
    <AnimatePresence initial={false}>
      {selected && <motion.div key={selected.course_id} className="ten-rail-band-wrap" data-ten-rail-band initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .22, ease: 'easeOut' }}>
        <TenBand className="ten-band ten-rail-band" course={selected} block={block} signedIn={signedIn} onComments={() => { setCommentsId(selected.course_id); setCommentsOpen(true); }} />
      </motion.div>}
    </AnimatePresence>
    <div className="clb-ten-hint" data-band-open={!!selected || undefined}><span>{hintText}</span>{hintAction}</div>
    {pills && <TenPills block={block} />}
    {commentsId && <CommentsSheetV2 isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} targetType="top_ten" targetId={block.owner.user_id} targetSecondaryId={commentsId} initialCommentId={commentsId === openBandOnCourseId ? initialCommentId : null} />}
  </div>;
}

/** Feed post opening rules (Brief 38): a new_course post whose course is still in the ten opens on it. */
export function tenPostOpening(post: { kind: string; courseId?: string | null; pronoun?: string | null; block: TenBlockData }) {
  const n = post.block.courses.length;
  const joined = post.kind === 'new_course' && !!post.courseId && post.block.courses.some(c => c.course_id === post.courseId);
  if (!joined) return { openOnCourseId: null, storyOverride: null, hintText: `Swipe for 2 to ${n}` };
  return {
    openOnCourseId: post.courseId!,
    storyOverride: { courseId: post.courseId!, text: 'Just joined' },
    hintText: post.pronoun ? `Swipe for the rest of ${post.pronoun} ten` : 'Swipe for the rest of the ten',
  };
}

/** Rail-shaped loading shell: two cards at the measured size and ten ticks, no text. */
export function TenRailSkeleton() {
  const container = React.useRef<HTMLDivElement>(null);
  const size = useRailCardSize(container);
  const styles = { '--ten-card-w': `${size.width}px`, '--ten-card-h': `${size.height}px` } as React.CSSProperties;
  return <div ref={container} className="ten-rail-body" style={styles} data-ten-rail-skeleton aria-busy="true" aria-label="Loading top ten">
    <div className="clb-ten-rail" style={{ overflow: 'hidden' }}>{[0, 1].map(i => <div key={i} className="ten-rail-skeleton-card" data-ten-skeleton-card />)}</div>
    <div className="clb-ten-ticks">{Array.from({ length: 10 }, (_, i) => <span key={i} className="ten-rail-skeleton-tick" data-ten-skeleton-tick />)}</div>
    <div className="clb-ten-hint" aria-hidden><span className="ten-rail-skeleton-hint" /></div>
  </div>;
}
