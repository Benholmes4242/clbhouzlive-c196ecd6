import React from 'react';
import { PendingPostCard } from '@/components/posts-tab/PendingPostCard';
import type { PendingPost } from '@/uploads/pendingPostsStore';

const mockEntry: PendingPost = {
  jobId: 'test-job-1',
  postId: null,
  actorType: 'personal',
  actorId: 'test-user-id',
  userId: 'test-user-id',
  viewerActorType: 'personal',
  viewerActorId: 'test-user-id',
  authorName: 'Test User',
  authorAvatarUrl: null,
  authorUsername: null,
  caption:
    'long video test @[Thomas Holmes](u:314366da-1111-2222-3333-000000000001) and this caption keeps going so we can confirm the three-line clamp still works after swapping to MentionText. Here is even more text to make sure it definitely overflows the third line.',
  media: [],
  totalFiles: 0,
  fileProgress: {},
  status: 'uploading',
  files: [],
  createdAt: new Date().toISOString(),
};

export default function PendingPostTestPage() {
  return (
    <div style={{ maxWidth: 430, margin: '0 auto', paddingTop: 40 }}>
      <PendingPostCard entry={mockEntry} theme="light" />
    </div>
  );
}
