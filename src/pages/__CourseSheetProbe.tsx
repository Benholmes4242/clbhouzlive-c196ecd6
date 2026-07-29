// TEMPORARY verification probe. Remove after checking the course stats sheet.
import { useState } from 'react';
import { CourseStatsSheet } from '@/components/feed/CourseStatsSheet';

export default function CourseSheetProbe() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>
      <button data-testid="probe-open" onClick={() => setOpen(true)} style={{ color: '#fff', padding: 16 }}>
        open
      </button>
      <CourseStatsSheet
        open={open}
        onClose={() => setOpen(false)}
        courseId="84e8a638-87c6-48d8-9a4c-d6ae01992c8f"
        courseName="Sundridge Park (West Course)"
        courseLocation="Bromley, England"
        courseRating={7.4}
      />
    </div>
  );
}
