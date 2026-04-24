import { create } from 'zustand';

export interface ReviewSheetBreakdown {
  design: number | null;
  conditions: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

export interface ReviewSheetReviewerStats {
  coursesRated: number;
  averageRating: number | null;
  memberSince: string | null;
}

export interface ReviewSheetPayload {
  user: { id: string; name: string; username?: string; avatar?: string | null };
  courseId: string;
  courseName: string;
  rating: number;
  reviewId?: string | null;
  courseCountry?: string | null;
  courseRegion?: string | null;
  courseSubCountry?: string | null;
  reviewText?: string | null;
  /** Optional breakdown sub-scores. Each may be null if the user skipped that breakdown. */
  breakdown?: ReviewSheetBreakdown | null;
  /** Optional reviewer aggregate stats — surfaced in the author card. */
  reviewerStats?: ReviewSheetReviewerStats | null;
}

interface ReviewSheetState {
  isOpen: boolean;
  payload: ReviewSheetPayload | null;
  /**
   * Opens the sheet with a snapshot of the review data. Snapshot is intentionally
   * copied, so subsequent feed navigation doesn't mutate what the user is reading.
   */
  open: (payload: ReviewSheetPayload) => void;
  close: () => void;
}

export const useReviewSheetStore = create<ReviewSheetState>((set) => ({
  isOpen: false,
  payload: null,
  open: (payload) => set({ isOpen: true, payload: { ...payload } }),
  close: () => set({ isOpen: false }),
}));
