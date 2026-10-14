import { GLASS_CHIP_CLASS } from '@/styles/glassChip';
import { useStatBrowseList } from '../useStatBrowse';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { fmtCount, playsToPar, plural, RAIL_BLEED } from './format';
import { PhotoFigureCard } from './PhotoFigureCard';

/**
 * SECTION 03 — MOST PLAYED (BRIEF_COURSES_PAGE_REBUILD §5). Replaces the
 * index-banded section, which is NOT to be built in any form: at today's sample
 * a per-course, per-index-band cell holds one member or none.
 */
export function MostPlayedSection() {
  const { rows, isLoading } = useStatBrowseList({ lens: 'played', country: null, region: null, limit: 3 });
  if (isLoading || rows.length === 0) return null;

  return (
    <section style={SECTION_WRAP}>
      <SectionHead tone="amber" kicker="Most played" title="The regulars" />
      <div className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: 2, marginTop: HEAD_GAP }}>
        {rows.slice(0, 3).map((row) => {
          const pill = [row.members > 0 ? plural(row.members, 'member', 'members') : null, playsToPar(row.avg_to_par)]
            .filter(Boolean)
            .join(' \u00B7 ');
          return (
            <PhotoFigureCard
              key={row.course_id}
              row={row}
              figure={fmtCount(row.rounds)}
              figureLabel={row.rounds === 1 ? 'Round tracked' : 'Rounds tracked'}
              nameBottom={pill ? 44 : 15}
              footer={pill ? (
                <span className={GLASS_CHIP_CLASS} style={{ position: 'absolute', left: 16, bottom: 15, padding: '4px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                  {pill}
                </span>
              ) : null}
            />
          );
        })}
      </div>
    </section>
  );
}
