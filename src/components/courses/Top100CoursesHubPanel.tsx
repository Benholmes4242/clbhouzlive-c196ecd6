import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Globe } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { getRingLabel } from '@/lib/top100Prestige';
import GlobalTop100 from './GlobalTop100';

const Top100CoursesHubPanel = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { data: lists, isLoading: listsLoading } = useTop100Lists();
  const { data: progress } = useTop100ProgressForUser(session?.user?.id);

  const getRegionIcon = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return <Globe className="w-8 h-8" />;
      case 'gb-i-top-100':
        return <CountryFlag country="Britain & Ireland" size="lg" />;
      case 'usa-top-100':
        return <CountryFlag country="USA" size="lg" />;
      case 'europe-top-100':
        return <CountryFlag country="Continental Europe" size="lg" />;
      default:
        return <Globe className="w-8 h-8" />;
    }
  };

  const getRegionBackground = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return '/lovable-uploads/bd96819b-505e-4a35-b242-d106babe5179.png';
      case 'gb-i-top-100':
        return 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=800&fit=crop';
      case 'usa-top-100':
        return 'https://images.unsplash.com/photo-1629048821995-e30a7ba7f063?w=1200&h=800&fit=crop';
      case 'europe-top-100':
        return 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=800&fit=crop';
      default:
        return '';
    }
  };

  const getProgress = (listId: string) => {
    if (!progress || !progress.lists) return null;
    return progress.lists.find((p) => p.listId === listId);
  };

  if (listsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="max-w-md mx-auto">
        <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/top100?tab=my-progress')}>
          <CardContent className="p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-accent/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Top 100 Club</h3>
              {session && progress && progress.total_played_top100 > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You've played {progress.total_played_top100} Top 100 course{progress.total_played_top100 === 1 ? '' : 's'}
                  </p>
                  {progress.prestige_ring && (
                    <p className="text-xs text-muted-foreground">
                      {getRingLabel(progress.prestige_ring)}
                    </p>
                  )}
                  <div className="h-2 w-full max-w-xs mx-auto rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-primary-accent transition-all duration-300"
                      style={{ width: `${Math.min((progress.total_played_top100 / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Explore the most iconic golf courses in the world
                </p>
              )}
            </div>
            <Button variant="primary" fullWidth className="mt-2">
              Open Top 100 Journey
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Full Top 100 Course List with Search/Filters */}
      <GlobalTop100 />
    </div>
  );
};

export default Top100CoursesHubPanel;
