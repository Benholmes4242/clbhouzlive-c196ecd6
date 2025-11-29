import React from 'react';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useTop100SharedJourney } from '@/hooks/useTop100SharedJourney';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';

interface Top100PublicJourneyPanelProps {
  profileUserId: string;
  profileName?: string;
}

const Top100PublicJourneyPanel: React.FC<Top100PublicJourneyPanelProps> = ({ 
  profileUserId,
  profileName = 'This golfer'
}) => {
  const { session } = useSupabaseSession();
  const myUserId = session?.user?.id;
  const navigate = useNavigate();
  
  const { data: progress, isLoading } = useTop100ProgressForUser(profileUserId);
  const { data: shared } = useTop100SharedJourney(myUserId, profileUserId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!progress) return null;

  const activeLists = progress.lists.filter(list => list.played > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 pb-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-primary-accent" />
          <h1 className="text-3xl font-bold text-foreground">{profileName}'s Top 100 Journey</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          See where their pilgrimage has taken them.
        </p>
        <div className="text-sm text-foreground">
          Has played{' '}
          <span className="font-semibold">{progress.total_played_top100}</span> Top 100 courses
          across <span className="font-semibold">{progress.regions_count}</span>{' '}
          {progress.regions_count === 1 ? 'region' : 'regions'}.
        </div>
      </div>

      {/* Lists in Progress */}
      {activeLists.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Lists in progress</h2>
          <div className="grid grid-cols-1 gap-3">
            {activeLists.map((list) => (
              <div
                key={list.listId}
                className="p-4 rounded-xl bg-card border border-border/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{list.listName}</h3>
                  <span className="text-sm font-medium text-foreground">
                    {list.played} / {list.total}
                  </span>
                </div>
                <Progress
                  value={(list.played / list.total) * 100}
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Journey */}
      {session && shared && shared.shared_count > 0 && (
        <div className="p-6 rounded-xl bg-primary-accent/10 border border-primary-accent/20 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-accent" />
            <h2 className="text-lg font-semibold text-foreground">Shared Journey</h2>
          </div>
          
          <p className="text-sm text-foreground">
            You share <span className="font-semibold">{shared.shared_count}</span>{' '}
            Top 100 {shared.shared_count === 1 ? 'course' : 'courses'}
          </p>

          {/* Shared courses sample */}
          {shared.shared_courses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Courses you both played
              </p>
              <div className="space-y-2">
                {shared.shared_courses.slice(0, 5).map((course) => (
                  <div
                    key={course.course_id}
                    className="p-3 rounded-xl bg-card/50 border border-border/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {course.course_name}
                        </p>
                        {course.country && (
                          <div className="flex items-center gap-2 mt-1">
                            <CountryFlag country={course.country} size="sm" />
                            <span className="text-xs text-muted-foreground">
                              {course.country}
                              {course.sub_country && `, ${course.sub_country}`}
                            </span>
                          </div>
                        )}
                      </div>
                      {course.lists.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {course.lists.map((list) => (
                            <Badge
                              key={list.slug}
                              variant="outline"
                              className="text-xs bg-primary-accent/10 border-primary-accent/20"
                            >
                              {list.slug.replace('-top-100', '').toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {shared.shared_courses.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    And {shared.shared_courses.length - 5} more…
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/top100`)}
              className="w-full"
            >
              Explore Top 100 lists
            </Button>
          </div>
        </div>
      )}

      {session && shared && shared.shared_count === 0 && (
        <div className="p-6 rounded-xl bg-muted/50 border border-border text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            You haven't played any Top 100 courses in common yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/top100`)}
          >
            Explore Top 100 lists
          </Button>
        </div>
      )}
    </div>
  );
};

export default Top100PublicJourneyPanel;
