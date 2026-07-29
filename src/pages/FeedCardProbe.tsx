/**
 * TEMPORARY measurement probe for the FeedCard media height cap.
 * Renders the real FeedCard with mock data so the assembled chrome
 * (header + caption + course band + actions row) can be measured.
 * Delete after measurement.
 */
import React from 'react';
import { FeedCard } from '@/components/feed/FeedCard';
import type { FeedPost } from '@/components/media-system/types/media';

const post = {
  id: 'probe-post',
  userId: 'probe-user',
  actorType: 'personal',
  actorId: 'probe-user',
  username: 'probe',
  displayName: 'Alex Morgan',
  avatarUrl: '',
  isVerified: false,
  creatorRelation: 'following',
  caption: 'Best round of the year out at the West Course, greens were rapid.',
  mediaItems: [
    {
      id: 'm1',
      type: 'image',
      url: 'https://picsum.photos/800/1000',
      imageUrl: 'https://picsum.photos/800/1000',
      thumbnailUrl: 'https://picsum.photos/80/100',
      width: 800,
      height: 1000,
      aspectRatio: 0.8,
    },
  ],
  createdAt: new Date().toISOString(),
  likeCount: 12,
  commentCount: 3,
  shareCount: 1,
  review: null,
  isReview: false,
  isLikedByMe: false,
  isFollowedByMe: true,
  courseName: 'Sundridge Park Golf Club (East Course)',
  courseId: 'probe-course',
  courseRating: 9,
} as unknown as FeedPost;

const noop = () => {};

const FeedCardProbe: React.FC = () => (
  <div
    id="probe-root"
    style={{ background: '#15171F', minHeight: '100vh', paddingBottom: 'var(--bottom-nav-height, 88px)' }}
  >
    <FeedCard
      post={post}
      liked={false}
      likeCount={12}
      commentCount={3}
      onLike={noop}
      onComment={noop}
      onShare={noop}
      onOpenMedia={noop}
      onProfile={noop}
      onCourse={noop}
      isActive={false}
      mountVideo={false}
      feedIndex={0}
      courseContext={{
        course_id: 'probe-course',
        rounds_tracked: 12,
        avg_over_par: 7.8,
        your_rounds: 4,
        your_best: 74,
      }}
    />
  </div>
);

export default FeedCardProbe;
