import { useNavigate } from 'react-router-dom';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { useStatBrowseList } from '../useStatBrowse';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { fmtToPar } from './format';

/** SECTION 04 — THE HARDEST TESTS (BRIEF_COURSES_PAGE_REBUILD §6). */
export function HardestSection() {
  const navigate = useNavigate();
  const { rows, isLoading } = useStatBrowseList({ lens: 'toughest', country: null, region: null, limit: 4 });
  if (isLoading || rows.length === 0) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="Over par on average" title="Toughest tracks" subline="Average strokes over par across every tracked round." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginLeft: -16, marginRight: -16, marginTop: HEAD_GAP }}>
        {rows.slice(0, 4).map((row, i) => (
          <button key={row.course_id} type="button" onClick={() => navigate(`/courses/${row.course_id}`)}
            style={{ height: 150, padding: 0, border: 'none', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}>
            <CourseImageFallback courseId={row.course_id} courseName={row.name} imageUrl={row.image_url} style={{ height: '100%' }}>
              <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
              <div style={{ position: 'absolute', left: 11, top: 10, fontSize: 23, fontWeight: 700, letterSpacing: '-0.045em', color: '#FFFFFF', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                {fmtToPar(row.avg_to_par) ?? '-'}
              </div>
              <div style={{ position: 'absolute', left: 11, top: 35, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>Avg over par</div>
              <div style={{ position: 'absolute', right: 10, top: 9, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ position: 'absolute', left: 11, right: 11, bottom: 10, fontSize: 13, fontWeight: 700, letterSpacing: '-0.018em', color: '#FFFFFF', lineHeight: 1.14, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{row.name}</div>
            </CourseImageFallback>
          </button>
        ))}
      </div>
    </section>
  );
}
