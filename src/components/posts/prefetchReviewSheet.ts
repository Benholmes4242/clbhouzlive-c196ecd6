import type { QueryClient } from '@tanstack/react-query';

import type { ReviewSheetPayload } from '@/stores/reviewSheetStore';
import { prefetchReviewFallback } from '@/hooks/useReviewFallback';
import { prefetchReviewMedia } from './useReviewMedia';

export function prefetchReviewSheet(queryClient: QueryClient, payload: ReviewSheetPayload | null) {
  if (!payload?.reviewId) return;
  const tasks: Promise<void>[] = [];
  if (!payload.reviewText || !payload.breakdown) tasks.push(prefetchReviewFallback(queryClient, payload.reviewId));
  tasks.push(prefetchReviewMedia(queryClient, payload.reviewId));
  void Promise.all(tasks);
}