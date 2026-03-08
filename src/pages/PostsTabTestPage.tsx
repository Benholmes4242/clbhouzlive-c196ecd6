import React from 'react';
import { useParams } from 'react-router-dom';
import PostsTabContent from '@/components/posts-tab/PostsTabContent';
import { PageRoot } from '@/components/layout/PageRoot';

export default function PostsTabTestPage() {
  const { actorType, actorId } = useParams<{ actorType: string; actorId: string }>();
  if (!actorType || !actorId) return null;

  return (
    <PageRoot>
      <div className="pt-2">
        <PostsTabContent
          actorType={actorType as 'personal' | 'business'}
          actorId={actorId}
          actorName="Test Profile"
          isOwnProfile={false}
        />
      </div>
    </PageRoot>
  );
}
