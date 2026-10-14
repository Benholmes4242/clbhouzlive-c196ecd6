import { useNavigate } from 'react-router-dom';
import { BrowseCourseCard } from '../BrowseCourseCard';
import { useStatBrowseList, useCourseBrowseTruth } from '../useStatBrowse';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';

/** SECTION 05 — HIGHEST RATED (§7). BrowseCourseCard unchanged, three times. */
export function HighestRatedSection() {
  const navigate = useNavigate();
  const { rows, isLoading } = useStatBrowseList({ lens: 'rated', country: null, region: null, limit: 3 });
  const { data: truth } = useCourseBrowseTruth();
  if (isLoading || rows.length === 0) return null;
  const top = rows.slice(0, 3);
  return (
    <section style={SECTION_WRAP}>
      <SectionHead n="05" tone="amber" kicker="Highest rated" title="What members rate highest" subline="Three only. The rest are in the list at the bottom." />
      <div style={{ marginLeft: -16, marginRight: -16, marginTop: HEAD_GAP }}>
        {top.map((row, i) => (
          <div key={row.course_id}>
            <BrowseCourseCard row={row} difficultyPercentile={truth?.difficultyPercentiles.get(row.course_id)} onClick={() => navigate(`/courses/${row.course_id}`)} />
            {i < top.length - 1 ? <div aria-hidden="true" style={{ height: 5, background: 'rgba(255,255,255,0.06)' }} /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
