import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeHero, CollegeAlumniList } from '../components/college';
import { useCollegeStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';

/**
 * College Profile Page - Shows detailed stats and alumni for a specific college.
 * Route: /tourhub/college-golf/:collegeSlug
 */
export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { data: stats, isLoading: statsLoading } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  
  const college = collegeSlug ? collegeMap?.get(collegeSlug) || null : null;
  const displayName = college?.short_name || college?.college_name || collegeSlug || 'College';
  
  const isLoading = statsLoading || mediaLoading;
  
  return (
    <TourHubShell>
      {/* Back Link */}
      <div className="pt-4">
        <Link 
          to="/tourhub/college-golf" 
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          College Golf
        </Link>
      </div>
      
      {/* Content */}
      <div className="py-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-surface-card border border-border-subtle rounded-sq-lg animate-pulse" />
            <div className="h-24 bg-surface-card border border-border-subtle rounded-sq-lg animate-pulse" />
          </div>
        ) : stats ? (
          <>
            {/* Hero Section */}
            <CollegeHero stats={stats} college={college} className="mb-8" />
            
            {/* Top Alumni */}
            <section>
              <h2 className="text-heading-md font-semibold text-text-primary flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-text-tertiary" />
                Top Alumni
              </h2>
              <p className="text-body-sm text-text-secondary mb-4">
                Current PGA Tour players ranked by 2025 earnings
              </p>
              <CollegeAlumniList normalizedName={collegeSlug || ''} limit={15} />
            </section>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-body-md text-text-secondary">
              No stats found for "{displayName}"
            </p>
            <Link 
              to="/tourhub/college-golf" 
              className="inline-block mt-4 text-primary hover:underline"
            >
              Browse all colleges
            </Link>
          </div>
        )}
      </div>
    </TourHubShell>
  );
}
