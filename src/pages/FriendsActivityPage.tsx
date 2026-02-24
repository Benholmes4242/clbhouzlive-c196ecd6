import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import FriendsCoursesPanel from '@/components/courses/FriendsCoursesPanel';
import FriendsCoursesSignedOutEmpty from '@/components/courses/FriendsCoursesSignedOutEmpty';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const FriendsActivityPage: React.FC = () => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();

  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)]">
      {/* Sticky header with back button */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 -ml-2 rounded-full active:scale-[0.97] transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Your Network</h1>
        </div>
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
