import React from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import FriendsCoursesPanel from '@/components/courses/FriendsCoursesPanel';
import FriendsCoursesSignedOutEmpty from '@/components/courses/FriendsCoursesSignedOutEmpty';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const FriendsActivityPage: React.FC = () => {
  const { user } = useSupabaseSession();

  if (!user) {
    return (
      <PageRoot className="min-h-screen" style={{ background: '#F8FAFC' }} hasBottomNav>
        <FriendsCoursesSignedOutEmpty />
        <ScrollToTopGlass />
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen" style={{ background: '#F8FAFC' }} hasBottomNav>
      <FriendsCoursesPanel />
      <ScrollToTopGlass />
    </PageRoot>
  );
};

export default FriendsActivityPage;
