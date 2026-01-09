import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { useTourSeason, useTourTournaments } from '../../hooks/useTourHubData';
import { useMemo } from 'react';

// Gradient backgrounds for course cards (since we don't have images)
const gradients = [
  'from-emerald-500/20 to-teal-600/10',
  'from-blue-500/20 to-indigo-600/10',
  'from-amber-500/20 to-orange-600/10',
  'from-purple-500/20 to-pink-600/10',
];

export function CoursesSpotlight() {
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);

  // Get unique courses from recent/upcoming tournaments
  const featuredCourses = useMemo(() => {
    if (!tournaments) return [];

    // Get tournaments with course info
    const withCourseInfo = tournaments
      .filter(t => t.venue_name && t.venue_par)
      .slice(0, 4)
      .map((t, idx) => ({
        id: t.id,
        name: t.venue_course_name || t.venue_name || 'Unknown Course',
        location: [t.venue_city, t.venue_country].filter(Boolean).join(', '),
        par: t.venue_par,
        yardage: t.venue_yardage,
        tournamentName: t.name,
        gradient: gradients[idx % gradients.length],
      }));

    return withCourseInfo;
  }, [tournaments]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!featuredCourses.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">Featured Courses</h3>
        <Link 
          to="/tourhub?tab=schedule"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {featuredCourses.map((course) => (
          <Link
            key={course.id}
            to={`/tourhub/tournament/${course.id}`}
            className="group relative overflow-hidden rounded-xl border border-border hover:border-primary/40 transition-all"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${course.gradient}`} />
            
            <div className="relative p-4">
              <h4 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {course.name}
              </h4>
              
              {course.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{course.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {course.par && <span>Par {course.par}</span>}
                {course.par && course.yardage && <span>•</span>}
                {course.yardage && <span>{course.yardage.toLocaleString()} yds</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
