import React from 'react';
import { Button } from '@/components/ui/button';
import type { CourseListView } from './useCourseListView';
import './courseListView.css';
export function CourseListViewToggle({ view, onChange }: { view: CourseListView; onChange: (view: CourseListView) => void }) {
  return <div role="group" aria-label="List view" className="course-view-toggle">
    {(['cards', 'list'] as const).map(mode => <Button key={mode} variant="ghost" className="course-view-segment" aria-label={mode === 'cards' ? 'Cards' : 'List'} aria-pressed={view === mode} onClick={() => onChange(mode)}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        {mode === 'cards' ? <g stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="12" height="5" rx="1.5" /><rect x="2" y="9" width="12" height="5" rx="1.5" /></g> : <><g fill="currentColor"><circle cx="3" cy="4" r="1.2" /><circle cx="3" cy="8" r="1.2" /><circle cx="3" cy="12" r="1.2" /></g><path d="M6.5 4h7M6.5 8h7M6.5 12h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>}
      </svg>
    </Button>)}
  </div>;
}
