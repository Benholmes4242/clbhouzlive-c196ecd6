import React, { useState, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfilePosts } from './hooks/useProfilePosts';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { HybridPostsFeed } from './HybridPostsFeed';
import { PostsAutoplay } from './PostsAutoplay';

type PostsFilter = 'all' | 'videos' | 'shorts' | 'images' | 'reviews';

const LONGFORM_THRESHOLD = 180; // 3 min — matches classifyPost in HybridPostsFeed

const FILTER_OPTIONS: { value: PostsFilter; label: string }[] = [
  { value: 'all', label: 'All Posts' },
  { value: 'videos', label: 'Videos' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'images', label: 'Images' },
  { value: 'reviews', label: 'Reviews' },
];

interface PostsTabContentProps {
  actorType: 'personal' | 'business';
  actorId: string;
  actorName?: string;
  isOwnProfile?: boolean;
  hideReviewsCount?: boolean;
}

const PostsTabContent: React.FC<PostsTabContentProps> = ({
  actorType,
  actorId,
  actorName,
  isOwnProfile = false,
  hideReviewsCount = false,
}) => {
  const { user } = useSupabaseSession();
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<PostsFilter>('all');

  const {
    posts,
    postCounts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useProfilePosts({
    userId: user?.id,
    actorType,
    actorId,
  });

  const currentFilterLabel = FILTER_OPTIONS.find(o => o.value === activeFilter)?.label || 'All Posts';

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    return posts.filter(post => {
      const firstMedia = post.mediaItems?.[0];
      switch (activeFilter) {
        case 'reviews':
          return post.isReview && !!post.review;
        case 'videos':
          return firstMedia?.type === 'video' && (firstMedia?.duration ?? 0) > LONGFORM_THRESHOLD;
        case 'shorts':
          return firstMedia?.type === 'video' && (firstMedia?.duration ?? 0) > 0 && (firstMedia?.duration ?? 0) <= LONGFORM_THRESHOLD;
        case 'images':
          return firstMedia?.type === 'image';
        default:
          return true;
      }
    });
  }, [posts, activeFilter]);

  return (
    <div className="flex flex-col min-h-0">
      {/* Filter dropdown — right-aligned, matching courses tab sort dropdown */}
      {posts.length > 0 && (
        <div className="flex justify-end px-4 pt-3 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground min-h-[36px] whitespace-nowrap shrink-0">
                {currentFilterLabel}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {FILTER_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={cn(
                    "text-sm",
                    activeFilter === opt.value && "font-semibold"
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <HybridPostsFeed
        posts={filteredPosts}
        userId={user?.id}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        isOwnProfile={isOwnProfile}
        actorName={actorName}
        gridRef={gridRef}
      />
      <PostsAutoplay posts={filteredPosts} gridRef={gridRef} />
    </div>
  );
};

export default PostsTabContent;
