import { useState } from 'react';
import { ClbhouzTenSheet } from '@/components/courses/browse/ClbhouzTenSheet';
import { CourseTopTenAvatar } from './CourseTopTenAvatar';
import { CourseTopTenMembersSheet } from './CourseTopTenMembersSheet';
import {
  courseTenMembersCopy,
  courseTenMovementCopy,
  courseTenNumberOnesCopy,
  courseTenRecordCopy,
  type CourseTopTenStanding,
} from './courseTopTenRules';
import '@/styles/clbhouz-ten.css';
import './courseTopTenStanding.css';

/** Brief 33 mock A: null standing owns no wrapper, gap or sheet. */
export function CourseTopTenStandingCard({ courseId, courseName, standing }: {
  courseId: string;
  courseName: string;
  standing: CourseTopTenStanding | null;
}) {
  const [chartOpen, setChartOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  if (!standing) return null;

  const chart = standing.chart;
  const movement = chart ? courseTenMovementCopy(chart) : null;
  const record = chart ? courseTenRecordCopy(chart) : null;
  const numberOnes = courseTenNumberOnesCopy(standing.members);

  return <>
    <section className="course-ten-card" data-course-top-ten-standing aria-label="The clbhouz Ten standing">
      <div className="course-ten-card-head">
        <span className="course-ten-eyebrow">The clbhouz Ten</span>
        <button type="button" className="course-ten-chart-link" onClick={() => setChartOpen(true)}>See chart ›</button>
      </div>
      {chart ? <div className="course-ten-figures">
        <div className="course-ten-figure-main">
          <span className="course-ten-rank">#{chart.rank}</span>
          {movement && <span className="course-ten-movement" data-movement={chart.movement}>{movement}</span>}
        </div>
        {record && <span className="course-ten-record">{record}</span>}
      </div> : <p className="course-ten-joins">Joins the clbhouz Ten on Monday</p>}
      <button type="button" className="course-ten-members" onClick={() => setMembersOpen(true)}>
        <span className="course-ten-avatar-stack">
          {standing.members.slice(0, 4).map(member => <span className="course-ten-avatar-stack-item" key={member.user_id}>
            <CourseTopTenAvatar member={member} size={26} />
          </span>)}
        </span>
        <span className="course-ten-members-text">
          {courseTenMembersCopy(standing.in_tens)}{standing.number_ones >= 1 && numberOnes ? ` · #1 for ${numberOnes}` : ''}
        </span>
        <span className="course-ten-members-chevron" aria-hidden="true">›</span>
      </button>
    </section>
    <ClbhouzTenSheet cohort="everyone" highlightCourseId={courseId} open={chartOpen} onOpenChange={setChartOpen} />
    <CourseTopTenMembersSheet courseId={courseId} courseName={courseName} standing={standing} open={membersOpen} onOpenChange={setMembersOpen} />
  </>;
}
