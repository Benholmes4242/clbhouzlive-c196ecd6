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
  const navigate = useNavigate();
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
  const twoColumns = block.is_owner || !signedIn;
  const scoreColumns = (course: TenCourse) => twoColumns
    ? [{ label: 'You', value: course.member_score }, { label: 'Golfers', value: course.golfers_score }]
    : [{ label: block.owner.first_name, value: course.member_score }, { label: 'Golfers', value: course.golfers_score }, { label: 'You', value: course.viewer_score }];
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
            {course.member_score != null && <span className="ten-score" data-ten-corner-score>{course.member_score.toFixed(1)}</span>}
            <span className="ten-bottom"><span className="ten-name">{course.name}</span><span className="ten-loc">{position === 1 ? tenLocation(course) : course.region || course.sub_country || course.country}</span></span>
          </Button> : profile && block.is_owner ? <Button variant="ghost" className={classes} data-ten-position={position} data-ten-empty={position} data-dimmed={!!selected} aria-label={`Add course at #${position}`} onClick={onAdd}><span className="ten-rank">{position}</span></Button>
            : <div className={classes} data-ten-position={position} data-ten-empty={position} data-dimmed={!!selected} aria-hidden><span className="ten-rank">{position}</span></div>}
          <AnimatePresence initial={false}>
            {selected && tenRowEnd(selected.position) === position && <motion.div key={selected.course_id} className="ten-band-wrap" data-ten-band-after={position} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .22, ease: 'easeOut' }}>
              <div className="ten-band">
                <div className="ten-band-header"><span className="ten-band-rank">{selected.position}</span><div className="ten-band-title"><div className="ten-band-name">{selected.name}</div><div className="ten-band-location">{tenLocation(selected)}</div></div></div>
                <div className="ten-scores" data-columns={twoColumns ? 2 : 3}>{scoreColumns(selected).map((score, i) => <div className="ten-score-column" key={i}><span className="ten-value" data-missing={score.value == null}>{score.value == null ? '–' : score.value.toFixed(1)}</span><span className="ten-label" title={score.label}>{score.label}</span></div>)}</div>
                {(selected.chart_rank != null || selected.in_tens > 0) && <div className="ten-facts">{selected.chart_rank != null && <span><b>#{selected.chart_rank}</b> on the clbhouz Ten</span>}{selected.in_tens > 0 && <span>In <b>{selected.in_tens}</b> {selected.in_tens === 1 ? "member's ten" : "members' tens"}</span>}</div>}
                <div className="ten-buttons"><Button variant="ghost" className="ten-comment" onClick={() => { setCommentsId(selected.course_id); setCommentsOpen(true); }}>Comments{selected.comment_count > 0 ? ` · ${selected.comment_count}` : ''}</Button><Button variant="ghost" className="ten-open" onClick={() => navigate(`/courses/${selected.course_id}`)}>Open course</Button></div>
              </div>
            </motion.div>}
          </AnimatePresence>
        </React.Fragment>;
      })}
    </div>
    {commentsId && <CommentsSheetV2 isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} targetType="top_ten" targetId={block.owner.user_id} targetSecondaryId={commentsId} initialCommentId={commentsId === initialCourseId ? initialCommentId : null} />}
  </>;
}
export function TenPills({ block, ownProfile = false, onShare }: { block: TenBlockData; ownProfile?: boolean; onShare?: () => void }) {
  const pills: React.ReactNode[] = [];
  if (ownProfile) {
    if (block.on_chart_count > 0) pills.push(<span className="ten-pill" key="chart">{block.on_chart_count} of yours {block.on_chart_count === 1 ? 'is' : 'are'} on the clbhouz Ten</span>);
    pills.push(<Button key="share" variant="ghost" className="ten-pill" onClick={onShare}>Share your ten</Button>);
  } else {
    if (block.played_count != null && block.played_count > 0) pills.push(<span className="ten-pill" key="played">You've played {block.played_count} of {block.count}</span>);
    if (block.shared_line != null) pills.push(<span className="ten-pill" key="shared">{block.shared_line}</span>);
  }
  return pills.length ? <div className="ten-pills">{pills}</div> : null;
}
export function TenBlockSkeleton() {
  return <div className="ten-block ten-skeleton" data-ten-skeleton aria-busy="true" aria-label="Loading top ten">{Array.from({ length: 10 }, (_, i) => <div key={i} className={`ten-tile ${i === 0 ? 'ten-tile-one' : ''}`} />)}</div>;
}