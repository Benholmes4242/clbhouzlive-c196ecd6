import React from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import FriendsCoursesPanel from '@/components/courses/FriendsCoursesPanel';
import FriendsCoursesSignedOutEmpty from '@/components/courses/FriendsCoursesSignedOutEmpty';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const FriendsActivityPage: React.FC = () => {
  const { user } = useSupabaseSession();

  return (
    <PageRoot className="min-h-screen bg-background" hasBottomNav>
      {/* Page title below global CompactHeader */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-[22px] font-bold text-foreground" style={{ letterSpacing: '-0.3px' }}>
          Your Network
        </h1>
      </div>

      <div className="min-h-screen">
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
