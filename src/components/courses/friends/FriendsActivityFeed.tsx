import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ActivityFeedItem from './ActivityFeedItem';
import ActivityCluster from './ActivityCluster';
import FeedFilterChips, { type FeedFilter } from './FeedFilterChips';
import { UnifiedPagination } from '@/components/ui/UnifiedPagination';
import type { FriendCourseHit, CourseWithFriends } from '@/hooks/useFriendsCourses';

interface FriendsActivityFeedProps {
  recent: FriendCourseHit[];
  courses: CourseWithFriends[];
  trendingCourseIds: Set<string>;
  userPlayedCourseIds?: Set<string>;
}

type FeedItem =
  | { type: 'single'; hit: FriendCourseHit }
  | {
      type: 'cluster';
      courseId: string;
      courseName: string;
      thumbnailUrl: string | null;
      friends: FriendCourseHit[];
      mostRecentPlayedAt: string;
      communityRating: number | null;
    };

const PAGE_SIZE = 10;

const FriendsActivityFeed: React.FC<FriendsActivityFeedProps> = ({
  recent,
  courses,
  trendingCourseIds,
  userPlayedCourseIds,
}) => {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [page, setPage] = useState(0);

  // Build feed items based on filter
  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];

    if (activeFilter === 'rounds') {
      // Show individual rounds only (no clustering)
      const sortedRecent = [...recent].sort(
        (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
      );
      sortedRecent.forEach((hit) => {
        items.push({ type: 'single', hit });
      });
      return items;
    }

    // For other filters, build clusters for courses with 2+ friends
    const courseMap = new Map<string, CourseWithFriends>();
    courses.forEach((c) => courseMap.set(c.course_id, c));

    // Filter courses based on active filter
    let filteredCourses = [...courses];

    if (activeFilter === 'trending') {
      filteredCourses = courses.filter((c) => trendingCourseIds.has(c.course_id));
    } else if (activeFilter === 'new_for_you') {
      // Courses user hasn't played but friends did
      filteredCourses = courses.filter(
        (c) => !userPlayedCourseIds?.has(c.course_id)
      );
    }

    // Sort by most recent activity
    filteredCourses.sort(
      (a, b) =>
        new Date(b.most_recent_play).getTime() - new Date(a.most_recent_play).getTime()
    );

    // Create feed items
    filteredCourses.forEach((course) => {
      if (course.friends.length >= 2) {
        // Cluster for 2+ friends
        items.push({
          type: 'cluster',
          courseId: course.course_id,
          courseName: course.course_name,
          thumbnailUrl: course.thumbnail_url || null,
          friends: course.friends,
          mostRecentPlayedAt: course.most_recent_play,
          communityRating: course.community_rating ?? null,
        });
      } else {
        // Single activity
        items.push({
          type: 'single',
          hit: course.friends[0],
        });
      }
    });

    return items;
  }, [recent, courses, activeFilter, trendingCourseIds, userPlayedCourseIds]);

  // Pagination
  const totalItems = feedItems.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const paginatedItems = feedItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  React.useEffect(() => {
    setPage(0);
  }, [activeFilter]);

  if (feedItems.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          {activeFilter === 'new_for_you'
            ? "No new courses to discover – you've played them all!"
            : activeFilter === 'trending'
            ? 'No trending courses in this timeframe'
            : 'No activity to show'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <FeedFilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Feed Items */}
      <motion.div
        key={`${activeFilter}-${page}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="space-y-2.5"
      >
        {paginatedItems.map((item, idx) => {
          if (item.type === 'cluster') {
            return (
              <ActivityCluster
                key={`cluster-${item.courseId}`}
                courseId={item.courseId}
                courseName={item.courseName}
                thumbnailUrl={item.thumbnailUrl}
                friends={item.friends}
                mostRecentPlayedAt={item.mostRecentPlayedAt}
                communityRating={item.communityRating}
                index={idx}
              />
            );
          }
          return (
            <ActivityFeedItem
              key={`single-${item.hit.friend_id}-${item.hit.course_id}-${item.hit.played_at}`}
              hit={item.hit}
              isTrending={trendingCourseIds.has(item.hit.course_id)}
              index={idx}
            />
          );
        })}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <UnifiedPagination
          page={page}
          total={totalItems}
          pageSize={PAGE_SIZE}
          hasNextPage={page < totalPages - 1}
          onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          itemLabel="items"
          disabled={false}
        />
      )}
    </div>
  );
};

export default FriendsActivityFeed;
