import { useState } from 'react';
import { MatchRequestSheet } from '@/components/profile/handicap/whs/gam/trophy-room/parts/MatchRequestSheet';

export default function __TestMatchRequest() {
  const [open, setOpen] = useState(true);
  if (!open) return <div data-testid="closed">Closed</div>;
  return (
    <MatchRequestSheet
      courseId="test-course-id"
      courseName="Test Course"
      onClose={() => setOpen(false)}
    />
  );
}
