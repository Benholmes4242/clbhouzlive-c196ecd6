import React from 'react';
import StatBrowse from './StatBrowse';
import { SectionHead, SECTION_WRAP } from './browse/SectionHead';
import { useStatBrowseFacets } from './useStatBrowse';

/**
 * CoursesBrowsePage — the Courses tab as eight stacked sections
 * (BRIEF_COURSES_PAGE_REBUILD). Holds no layout beyond stacking them.
 * Sections 01–07 are app-wide and never read the country/region URL params;
 * those belong to section 08 (StatBrowse) alone.
 *
 * PHASE 1: sections 01–07 are heading shells only.
 */
interface Props {
  onOpenDirectory: React.ComponentProps<typeof StatBrowse>['onOpenDirectory'];
}

// The page sits inside CoursesContent's px-4 wrapper; sections carry their
// own 16px gutter, so they cancel it rather than doubling it.
const BLEED: React.CSSProperties = { marginLeft: -16, marginRight: -16 };

const SHELLS = [
  { n: '01', kicker: 'This week', title: "Who's been playing", subline: 'Every card is a real round, posted by a member, with what they went round in.' },
  { n: '02', kicker: 'Where to go', title: 'By region', subline: 'Twenty-four places members have played.' },
  { n: '03', kicker: 'Where we actually play', title: 'The courses this community keeps going back to', subline: 'Ranked by rounds tracked, not by reputation.' },
  { n: '04', kicker: 'The hardest tests', title: 'Where the field loses most', subline: 'Average strokes over par across every tracked round.' },
  { n: '05', kicker: 'Highest rated', title: 'What members rate highest', subline: 'Three only. The rest are in the list at the bottom.' },
  { n: '06', kicker: 'Crowns', title: 'Records still unclaimed', subline: 'The lowest anyone has gone round. Some of these are soft.' },
  { n: '07', kicker: "In members' words", title: 'Latest reviews', subline: 'What members said after they played.' },
] as const;

export default function CoursesBrowsePage({ onOpenDirectory }: Props) {
  const { data: facets } = useStatBrowseFacets();
  const total = facets?.all_played_total;

  return (
    <div>
      {SHELLS.map((s) => (
        <section key={s.n} style={{ ...BLEED, ...SECTION_WRAP }}>
          <SectionHead n={s.n} kicker={s.kicker} title={s.title} subline={s.subline} tone="amber" />
        </section>
      ))}
      <section style={{ ...BLEED, ...SECTION_WRAP }}>
        <SectionHead
          n="08"
          tone="quiet"
          kicker="Everything we track"
          title={total ? `All ${total.toLocaleString('en-GB')} courses` : 'All courses'}
          subline="Filter and sort."
        />
      </section>
      <StatBrowse onOpenDirectory={onOpenDirectory} />
    </div>
  );
}
