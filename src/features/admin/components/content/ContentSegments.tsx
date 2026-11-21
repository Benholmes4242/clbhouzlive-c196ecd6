/** BRIEF_CONTENT_DESK — the four-segment Content control (one column per visible segment). */
import React from 'react';
import { CC3 } from '../InboxPanels';

export type ContentSection = 'newsroom' | 'courses' | 'tour' | 'pages';
export const SECTION_LABEL: Record<ContentSection, string> = { newsroom: 'Newsroom', courses: 'Courses', tour: 'Tour data', pages: 'Pages' };

export default function ContentSegments({ sections, active, onChange }: { sections: ContentSection[]; active: ContentSection; onChange: (s: ContentSection) => void }) {
  return (
    <nav aria-label="Content sections" style={{ display: 'grid', gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))`, gap: 4, padding: 4, borderRadius: 999, background: CC3.surface }}>
      {sections.map((s) => {
        const on = s === active;
        return (
          <button key={s} type="button" aria-current={on ? 'page' : undefined} onClick={() => onChange(s)} style={{
            height: 32, borderRadius: 999, border: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap', minWidth: 0, background: on ? CC3.ink : 'transparent', color: on ? CC3.canvas : CC3.mute,
          }}>{SECTION_LABEL[s]}</button>
        );
      })}
    </nav>
  );
}
