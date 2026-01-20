import React from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import FriendsCoursesPanel from '@/components/courses/FriendsCoursesPanel';
import FriendsCoursesSignedOutEmpty from '@/components/courses/FriendsCoursesSignedOutEmpty';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const FriendsActivityPage: React.FC = () => {
  const { user } = useSupabaseSession();

  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)]">
      <div className="min-h-screen pb-20">
        {user ? (
          <FriendsCoursesPanel />
        ) : (
          <FriendsCoursesSignedOutEmpty />
        )}
      </div>
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default FriendsActivityPage;
