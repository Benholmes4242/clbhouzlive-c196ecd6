import React from 'react';
import type { PostCounts } from './hooks/useProfilePosts';
import { Skeleton } from '@/components/ui/skeleton';

interface PostsCountSummaryProps {
  counts: PostCounts;
  isLoading: boolean;
  hideReviews?: boolean;
}

export const PostsCountSummary: React.FC<PostsCountSummaryProps> = ({ counts, isLoading, hideReviews = false }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center px-4 py-2">
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }
  if (counts.total === 0) return null;

  const parts: string[] = [];
  parts.push(`${counts.total} post${counts.total !== 1 ? 's' : ''}`);
  if (counts.videos > 0) parts.push(`${counts.videos} video${counts.videos !== 1 ? 's' : ''}`);
  if (counts.photos > 0) parts.push(`${counts.photos} photo${counts.photos !== 1 ? 's' : ''}`);
  if (!hideReviews && counts.reviews > 0) parts.push(`${counts.reviews} review${counts.reviews !== 1 ? 's' : ''}`);

  return (
    <div className="text-xs text-muted-foreground px-4 py-2 text-center">
      {parts.join(' · ')}
    </div>
  );
};
