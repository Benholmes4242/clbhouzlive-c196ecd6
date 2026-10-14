import { useNavigate } from 'react-router-dom';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { GLASS_CHIP_CLASS } from '@/styles/glassChip';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { useStatBrowseList } from '../useStatBrowse';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { plural } from './format';

/**
 * SECTION 06 — RECORDS STILL UNCLAIMED (§7). Renders NOTHING AT ALL — no
 * heading — when the chase row has no course_record: an unclaimed-records
 * section with no record in it is a false claim about the data.
 * The row carries no par field, so the fact line omits "par N".
 */
export function UnclaimedSection() {
  const navigate = useNavigate();
  const { rows, isLoading } = useStatBrowseList({ lens: 'chase', country: null, region: null, limit: 1 });
  const row = rows[0];
  if (isLoading || !row || row.course_record == null) return null;
  return (
    <section style={SECTION_WRAP}>
      <SectionHead n="06" tone="amber" kicker="Crowns" title="Records still unclaimed" subline="The lowest anyone has gone round. Some of these are soft." />
      <button type="button" onClick={() => navigate(`/courses/${row.course_id}`)}
        style={{ display: 'block', width: 'calc(100% + 32px)', height: 166, marginLeft: -16, marginTop: HEAD_GAP, padding: 0, border: 'none', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}>
        <CourseImageFallback courseId={row.course_id} courseName={row.name} imageUrl={row.image_url} style={{ height: '100%' }}>
          <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
          <div style={{ position: 'absolute', left: 16, top: 15, right: 110, fontSize: 16, fontWeight: 700, letterSpacing: '-0.025em', color: '#FFFFFF' }}>{row.name}</div>
          <span className={GLASS_CHIP_CLASS} style={{ position: 'absolute', right: 14, top: 14, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: MEDAL_GOLD }}>Unclaimed</span>
          <div style={{ position: 'absolute', left: 16, bottom: 14 }}>
            <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.05em', color: '#FFFFFF', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{row.course_record}</div>
            {row.rounds > 0 ? (
              <div style={{ marginTop: 5, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums' }}>Best of {plural(row.rounds, 'round', 'rounds')}</div>
            ) : null}
          </div>
        </CourseImageFallback>
      </button>
    </section>
  );
}
