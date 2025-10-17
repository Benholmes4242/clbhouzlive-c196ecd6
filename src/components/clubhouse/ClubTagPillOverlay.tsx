import React from 'react';
import { createPortal } from 'react-dom';
import ClubTagPill from '@/components/clubhouse/ClubTagPill';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

export default function ClubTagPillOverlay({ course }: { course: GolfCourse | null | undefined }) {
  if (!course) return null;

  return createPortal(
    <div className="clubtag-overlay chrome-follow-top" data-test="clubtag-overlay">
      <ClubTagPill course={course} />
    </div>,
    document.body
  );
}
