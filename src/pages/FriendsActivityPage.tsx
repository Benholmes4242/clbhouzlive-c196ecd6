import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import FriendsCoursesPanel from '@/components/courses/FriendsCoursesPanel';
import FriendsCoursesSignedOutEmpty from '@/components/courses/FriendsCoursesSignedOutEmpty';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const FriendsActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)]">
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/60">
          <div className="px-4 py-3 flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Friends Activity</h1>
              <p className="text-xs text-muted-foreground">See where your network has been playing</p>
            </div>
          </div>
        </div>

        <div className="pb-20">
          {user ? (
            <FriendsCoursesPanel />
          ) : (
            <FriendsCoursesSignedOutEmpty />
          )}
        </div>

        <ScrollToTopGlass />
      </div>
    </PageRoot>
  );
};

export default FriendsActivityPage;
