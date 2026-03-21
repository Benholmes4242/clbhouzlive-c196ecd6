// ReviewBottomPanel — NUKED. Cinema rebuild coming in Phase 2.
import React from 'react';

export interface ReviewBottomPanelProps {
  user: { id: string; name: string; username?: string; avatar?: string };
  courseId: string;
  courseName?: string;
  rating: number;
  reviewId?: string;
  sourceReviewId?: string;
  courseCountry?: string | null;
  courseRegion?: string | null;
  courseSubCountry?: string | null;
  reviewText?: string | null;
  onClose?: () => void;
  isOpen?: boolean;
}

export const ReviewBottomPanel: React.FC<ReviewBottomPanelProps> = () => null;
export default ReviewBottomPanel;
