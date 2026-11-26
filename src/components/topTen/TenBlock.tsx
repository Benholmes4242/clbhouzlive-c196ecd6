/** One position-based photograph block for profile, inline posts and permalinks.
 * Course comments stay separate from the post thread; all scores/facts are server-owned. */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { tenLocation, tenRowEnd, type TenBlockData, type TenCourse } from './topTenModel';

interface Props {
  block: TenBlockData;
  signedIn: boolean;
  profile?: boolean;
  onAdd?: () => void;
  initialCourseId?: string | null;
  initialCommentId?: string | null;
}
export function TenBlock({ block, signedIn, profile = false, onAdd, initialCourseId, initialCommentId }: Props) {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(initialCourseId ?? null);
  const [commentsId, setCommentsId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  useEffect(() => {
    if (!initialCourseId || !block.courses.some(c => c.course_id === initialCourseId)) return;
    setSelectedId(initialCourseId);
    if (initialCommentId) { setCommentsId(initialCourseId); setCommentsOpen(true); }
  }, [initialCourseId, initialCommentId, block.owner.user_id]);
  const selected = block.courses.find(c => c.course_id === selectedId);
  const byPosition = new Map(block.courses.map(c => [c.position, c]));
  const positions = Array.from({ length: 10 }, (_, i) => i + 1);
  return <>
    <div className="ten-block tabular-nums" data-ten-block>
      {positions.map(position => {
        const course = byPosition.get(position);
        const active = course?.course_id === selected?.course_id;
        const classes = `ten-tile ${position === 1 ? 'ten-tile-one' : ''} ${!course ? 'ten-empty' : ''}`;
        return <React.Fragment key={position}>
          {course ? <Button variant="ghost" className={classes} data-ten-position={position} data-dimmed={!!selected && !active} aria-label={`#${position} ${course.name}${course.member_score == null ? '' : `, ${course.member_score.toFixed(1)}`}`} aria-expanded={active} onClick={() => setSelectedId(active ? null : course.course_id)}>
            <div className="ten-photo"><CourseImageFallback flatWhenEmpty courseId={course.course_id} courseName={course.name} imageUrl={course.thumbnail_image} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
            <span className="ten-fade" aria-hidden />
            <span className="ten-rank">{position}</span>
            {course.member_score != null && <span className="ten-score ten-score-pill" data-ten-corner-score>{course.member_score.toFixed(1)}</span>}
            <span className="ten-bottom"><span className="ten-name">{course.name}</span><span className="ten-loc">{position === 1 ? tenLocation(course) : course.region || course.sub_country || course.country}</span></span>
          </Button> : profile && block.is_owner ? <Button variant="ghost" className={classes} data-ten-position={position} data-ten-empty={position} data-dimmed={!!selected} aria-label={`Add course at #${position}`} onClick={onAdd}><span className="ten-rank">{position}</span></Button>
            : <div className={classes} data-ten-position={position} data-ten-empty={position} data-dimmed={!!selected} aria-hidden><span className="ten-rank">{position}</span></div>}
          <AnimatePresence initial={false}>
            {selected && tenRowEnd(selected.position) === position && <motion.div key={selected.course_id} className="ten-band-wrap" data-ten-band-after={position} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .22, ease: 'easeOut' }}>
              <TenBand course={selected} block={block} signedIn={signedIn} onComments={() => { setCommentsId(selected.course_id); setCommentsOpen(true); }} />
            </motion.div>}
          </AnimatePresence>
        </React.Fragment>;
      })}
    </div>
    {commentsId && <CommentsSheetV2 isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} targetType="top_ten" targetId={block.owner.user_id} targetSecondaryId={commentsId} initialCommentId={commentsId === initialCourseId ? initialCommentId : null} />}
  </>;
}
/** Visitor comparison pills only; Brief 34 removed the owner's chart-count pill and moved Share into the rail hint. */
/** `ownProfile`/`onShare` are accepted but unused since Brief 34 (owner pills deleted); kept so existing callers still type-check until Ben rules on their tests. */
export function TenPills({ block, className = 'ten-pills' }: { block: TenBlockData; className?: string; ownProfile?: boolean; onShare?: () => void }) {
  const pills: React.ReactNode[] = [];
  if (block.played_count != null && block.played_count > 0) pills.push(<span className="ten-pill" key="played">You've played {block.played_count} of {block.count}</span>);
  if (block.shared_line != null) pills.push(<span className="ten-pill" key="shared">{block.shared_line}</span>);
  return pills.length ? <div className={className}>{pills}</div> : null;
}
/** The signed-off Brief 31 band, shared by the feed block and the profile rail. */
export function TenBand({ course, block, signedIn, onComments, className = 'ten-band' }: { course: TenCourse; block: TenBlockData; signedIn: boolean; onComments: () => void; className?: string }) {
  const navigate = useNavigate();
  const twoColumns = block.is_owner || !signedIn;
  const scores = twoColumns
    ? [{ label: 'You', value: course.member_score }, { label: 'Golfers', value: course.golfers_score }]
    : [{ label: block.owner.first_name, value: course.member_score }, { label: 'Golfers', value: course.golfers_score }, { label: 'You', value: course.viewer_score }];
  return <div className={className} data-ten-band>
    <div className="ten-band-header"><span className="ten-band-rank">{course.position}</span><div className="ten-band-title"><div className="ten-band-name">{course.name}</div><div className="ten-band-location">{tenLocation(course)}</div></div></div>
    <div className="ten-scores" data-columns={twoColumns ? 2 : 3}>{scores.map((score, i) => <div className="ten-score-column" key={i}><span className="ten-value" data-missing={score.value == null}>{score.value == null ? '–' : score.value.toFixed(1)}</span><span className="ten-label" title={score.label}>{score.label}</span></div>)}</div>
    {(course.chart_rank != null || course.in_tens > 0) && <div className="ten-facts">{course.chart_rank != null && <span><b>#{course.chart_rank}</b> on the clbhouz ten</span>}{course.in_tens > 0 && <span>In <b>{course.in_tens}</b> {course.in_tens === 1 ? "member's ten" : "members' tens"}</span>}</div>}
    <div className="ten-buttons"><Button variant="ghost" className="ten-comment" onClick={onComments}>Comments{course.comment_count > 0 ? ` · ${course.comment_count}` : ''}</Button><Button variant="ghost" className="ten-open" onClick={() => navigate(`/courses/${course.course_id}`)}>Open course</Button></div>
  </div>;
}
export function TenBlockSkeleton() {
  return <div className="ten-block ten-skeleton" data-ten-skeleton aria-busy="true" aria-label="Loading top ten">{Array.from({ length: 10 }, (_, i) => <div key={i} className={`ten-tile ${i === 0 ? 'ten-tile-one' : ''}`} />)}</div>;
}