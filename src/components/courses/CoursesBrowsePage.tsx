import React from 'react';
import StatBrowse from './StatBrowse';
import { SectionHead, SECTION_WRAP } from './browse/SectionHead';
import { useCourseBrowseTruth, useStatBrowseFacets } from './useStatBrowse';
import { GLASS_CHIP_CSS } from '@/styles/glassChip';
import { WhoPlayingSection } from './browse/WhoPlayingSection';
import { ByRegionSection, ALL_COURSES_ANCHOR } from './browse/ByRegionSection';
import { MostPlayedSection } from './browse/MostPlayedSection';

/**
 * CoursesBrowsePage — the Courses tab as eight stacked sections
 * (BRIEF_COURSES_PAGE_REBUILD). Holds no layout beyond stacking them.
 * Sections 01–07 are app-wide and never read the country/region URL params;
 * those belong to section 08 (StatBrowse) alone.
 *
 * PHASE 2: 01–03 built; 04–07 are still heading shells (Phase 3).
 */
interface Props {
  onOpenDirectory: React.ComponentProps<typeof StatBrowse>['onOpenDirectory'];
}

// The page sits inside CoursesContent's px-4 wrapper; sections carry their
// own 16px gutter, so they cancel it rather than doubling it.
const BLEED: React.CSSProperties = { marginLeft: -16, marginRight: -16 };

const SHELLS = [
  { n: '04', kicker: 'The hardest tests', title: 'Where the field loses most', subline: 'Average strokes over par across every tracked round.' },
  { n: '05', kicker: 'Highest rated', title: 'What members rate highest', subline: 'Three only. The rest are in the list at the bottom.' },
  { n: '06', kicker: 'Crowns', title: 'Records still unclaimed', subline: 'The lowest anyone has gone round. Some of these are soft.' },
  { n: '07', kicker: "In members' words", title: 'Latest reviews', subline: 'What members said after they played.' },
] as const;

export default function CoursesBrowsePage({ onOpenDirectory }: Props) {
  const { data: facets } = useStatBrowseFacets();
  const { data: truth } = useCourseBrowseTruth();
  const total = facets?.all_played_total;

  return (
    <div>
      <style>{GLASS_CHIP_CSS}</style>
      <div style={BLEED}>
        <WhoPlayingSection />
        <ByRegionSection />
        <MostPlayedSection />
        {SHELLS.map((s) => (
          <section key={s.n} style={SECTION_WRAP}>
            <SectionHead n={s.n} kicker={s.kicker} title={s.title} subline={s.subline} tone="amber" />
          </section>
        ))}
        <section id={ALL_COURSES_ANCHOR} style={SECTION_WRAP}>
          <SectionHead
            n="08"
            tone="quiet"
            kicker="Everything we track"
            title={total ? `All ${total.toLocaleString('en-GB')} courses` : 'All courses'}
            subline={
              truth
                ? `Filter and sort. ${truth.ratedTotal.toLocaleString('en-GB')} of the ${truth.allPlayedTotal.toLocaleString('en-GB')} carry a rating.`
                : 'Filter and sort.'
            }
          />
        </section>
      </div>
      <StatBrowse onOpenDirectory={onOpenDirectory} />
    </div>
  );
}
