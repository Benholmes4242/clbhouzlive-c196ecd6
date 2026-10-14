/** BRIEF_CONTENT_DESK — the four-segment Content control (one column per visible segment). */
import React from 'react';
import { adminTheme as t } from '../../theme';

export type ContentSection = 'newsroom' | 'courses' | 'tour' | 'pages';
export const SECTION_LABEL: Record<ContentSection, string> = { newsroom: 'Newsroom', courses: 'Courses', tour: 'Tour data', pages: 'Pages' };

export default function ContentSegments({ sections, active, onChange }: { sections: ContentSection[]; active: ContentSection; onChange: (s: ContentSection) => void }) {
  return (
    <nav aria-label="Content sections" style={{ display: 'grid', gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))`, gap: 4, padding: 4, borderRadius: 999, background: t.surface }}>
      {sections.map((s) => {
        const on = s === active;
        return (
          <button key={s} type="button" aria-current={on ? 'page' : undefined} onClick={() => onChange(s)} style={{
            height: 34, borderRadius: 999, border: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: on ? t.ink : 'transparent', color: on ? t.canvas : t.inkMuted,
          }}>{SECTION_LABEL[s]}</button>
        );
      })}
    </nav>
  );
}
