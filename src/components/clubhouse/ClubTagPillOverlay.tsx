import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ClubTagPill from './ClubTagPill';

interface ClubTagPillOverlayProps {
  activePost: {
    golfCourse?: {
      id: string;
      name: string;
      country: string;
      region?: string;
    } | null;
  } | null;
}

export function ClubTagPillOverlay({ activePost }: ClubTagPillOverlayProps) {
  useEffect(() => {
    console.log('[ClubTagPillOverlay] activePost:', activePost);
    console.log('[ClubTagPillOverlay] golfCourse:', activePost?.golfCourse);
  }, [activePost]);

  if (!activePost?.golfCourse) return null;

  return createPortal(
    <div className="clubtag-overlay chrome-follow-top" data-test="clubtag-overlay">
      <ClubTagPill course={activePost.golfCourse} />
    </div>,
    document.body
  );
}
