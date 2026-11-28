/** Compact rows share card formatting and names, never fetch or own navigation. */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getOptimizedImageUrl } from '@/utils/enhancedImageOptimization';
import { shortCoursePart } from '@/lib/courseMedia/memberShotPosts';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { courseListLead, courseListColumnLabel } from './courseListCardRules';
import type { StatBrowseRow, StatLens } from './useStatBrowse';
import './courseListView.css';
import { PlayedPill, PlayedTickButton, usePlayedTick, type PlayedTickSource } from '@/features/played/PlayedTick';
export function CourseListColumns({ lens }: { lens: StatLens }) {
  return <div className="course-list-columns"><span>#</span><span /><span>COURSE</span><span>{courseListColumnLabel(lens)}</span></div>;
}
export function CourseListRow({ row, lens, rank, top100 = false, onClick, playedTick }: { row: StatBrowseRow; lens: StatLens; rank?: number | null; top100?: boolean; onClick: () => void; playedTick?: PlayedTickSource }) {
  const tick = usePlayedTick(row.course_id, playedTick);
  const noRounds = top100 && row.rounds === 0;
  const figure = noRounds ? null : courseListLead(lens, row, false);
  const area = row.region || row.sub_country || row.country;
  const rowEl = <Button variant="ghost" className="course-list-row" aria-label={`View ${row.name}`} onClick={onClick} style={{ '--course-list-under': TOPAR_RED } as React.CSSProperties}>
    <span className="course-list-row-position">{rank ?? ''}</span>
    <span className="course-list-row-photo">{row.image_url ? <img alt="" loading="lazy" decoding="async" src={getOptimizedImageUrl(row.image_url, { width:96 })} srcSet={`${getOptimizedImageUrl(row.image_url, { width:144 })} 144w`} sizes="48px" /> : null}</span>
    <span className="course-list-row-name-block"><span className="course-list-row-name">{shortCoursePart(row.name)}</span>
      <span className="course-list-row-detail">
        {lens === 'lowest' ? <span className="course-list-row-record">{row.rounds} {row.rounds === 1 ? 'round' : 'rounds'}{area ? ' · ' : ''}</span> : null}
        <span className="course-list-row-area">{area}</span><PlayedPill status={tick.pill} />
      </span>
    </span>
    <span className="course-list-row-figure" data-tone={figure?.tone ?? 'missing'}>{figure?.value ?? '—'}</span>
  </Button>;
  if (!tick.on) return rowEl;
  return <div className="pl-wrap" data-row data-played-row>{rowEl}<PlayedTickButton courseId={row.course_id} name={row.name} variant="row" tick={tick} /></div>;
}
export function CourseListRowsShell({ count = 10 }: { count?: number }) {
  return <div aria-hidden>{Array.from({ length:count }, (_,i) => <div className="course-list-row-shell" key={i}><span /><Skeleton style={{ width:48, height:48, borderRadius:12 }} /><div className="course-list-row-shell-text"><Skeleton style={{ width:'100%', height:12 }} /><Skeleton style={{ width:'75%', height:10 }} /></div><span style={{ minWidth:40 }} /></div>)}</div>;
}
