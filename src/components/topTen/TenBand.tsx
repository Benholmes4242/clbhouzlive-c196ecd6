/** The Brief 31 band and visitor pills, shared by every ten rail (Brief 38A removed the old photo block). */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { tenLocation, type TenBlockData, type TenCourse } from './topTenModel';

/** Visitor comparison pills only; Brief 34 removed the owner's chart-count pill and moved Share into the rail hint. */
/** `ownProfile`/`onShare` are accepted but unused since Brief 34 (owner pills deleted); kept so existing callers still type-check until Ben rules on their tests. */
export function TenPills({ block, className = 'ten-pills' }: { block: TenBlockData; className?: string; ownProfile?: boolean; onShare?: () => void }) {
  const pills: React.ReactNode[] = [];
  if (block.played_count != null && block.played_count > 0) pills.push(<span className="ten-pill" key="played">You've played {block.played_count} of {block.count}</span>);
  if (block.shared_line != null) pills.push(<span className="ten-pill" key="shared">{block.shared_line}</span>);
  return pills.length ? <div className={className}>{pills}</div> : null;
}
/** The signed-off Brief 31 band, shared by every ten rail. */
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
