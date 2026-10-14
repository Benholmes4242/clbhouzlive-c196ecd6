import { useNavigate } from 'react-router-dom';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { GLASS_CHIP_CLASS } from '@/styles/glassChip';
import { useStatBrowseList } from '../useStatBrowse';
import { SectionHead, SECTION_WRAP } from './SectionHead';
import { fmtCount, fmtToPar, plural, RAIL_BLEED } from './format';

/**
 * SECTION 03 — MOST PLAYED (BRIEF_COURSES_PAGE_REBUILD §5). Replaces the
 * index-banded section, which is NOT to be built in any form: at today's sample
 * a per-course, per-index-band cell holds one member or none.
 */
export function MostPlayedSection() {
  const navigate = useNavigate();
  const { rows, isLoading } = useStatBrowseList({ lens: 'played', country: null, region: null, limit: 3 });
  if (isLoading || rows.length === 0) return null;

  return (
    <section style={SECTION_WRAP}>
      <SectionHead
        n="03"
        tone="amber"
        kicker="Where we actually play"
        title="The courses this community keeps going back to"
        subline="Ranked by rounds tracked, not by reputation."
      />
      <div className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: 2, marginTop: 14 }}>
        {rows.slice(0, 3).map((row) => {
          const par = fmtToPar(row.avg_to_par);
          const place = [row.region, row.sub_country].filter(Boolean).join(', ');
          const pill = [row.members > 0 ? plural(row.members, 'member', 'members') : null, par ? `plays to ${par}` : null]
            .filter(Boolean)
            .join(' \u00B7 ');
          return (
            <button
              key={row.course_id}
              type="button"
              onClick={() => navigate(`/courses/${row.course_id}`)}
              style={{ width: 300, height: 240, flex: 'none', padding: 0, border: 'none', textAlign: 'left', cursor: 'pointer', background: 'transparent' }}
            >
              <CourseImageFallback courseId={row.course_id} courseName={row.name} imageUrl={row.image_url} style={{ height: '100%' }}>
                <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
                <div style={{ position: 'absolute', top: 16, right: 16, textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      letterSpacing: '-0.05em',
                      color: '#FFFFFF',
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                      textShadow: '0 2px 10px rgba(0,0,0,0.6)',
                    }}
                  >
                    {fmtCount(row.rounds)}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.82)',
                    }}
                  >
                    {row.rounds === 1 ? 'Round tracked' : 'Rounds tracked'}
                  </div>
                </div>
                <div style={{ position: 'absolute', left: 16, right: 16, bottom: 15 }}>
                  <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.032em', color: '#FFFFFF', lineHeight: 1.08 }}>
                    {row.name}
                  </div>
                  {place ? (
                    <div style={{ marginTop: 5, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>{place}</div>
                  ) : null}
                  {pill ? (
                    <span
                      className={GLASS_CHIP_CLASS}
                      style={{
                        display: 'inline-block',
                        marginTop: 9,
                        padding: '4px 9px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {pill}
                    </span>
                  ) : null}
                </div>
              </CourseImageFallback>
            </button>
          );
        })}
      </div>
    </section>
  );
}
