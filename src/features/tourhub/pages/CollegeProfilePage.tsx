import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Swords, GitCompare } from 'lucide-react';
import { TourHubShell } from '../components';
import { 
  FranchiseHero, 
  FranchiseStoryStrip,
  AlumniDepthChart, 
  CollegeRivalsCarousel,
  FollowCollegeButton 
} from '../components/college';
import { useCollegeStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { Button } from '@/components/ui/button';

/**
 * College Profile Page - Premium alumni page with franchise identity
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
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          College Rankings
        </Link>
      </div>
      
      {/* Content */}
      <div className="py-6">
        {isLoading ? (
          <div className="space-y-6">
            {/* Hero skeleton */}
            <div className="flex flex-col items-center">
              <div className="w-[120px] h-[120px] rounded-full bg-muted animate-pulse mb-4" />
              <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
            {/* List skeleton */}
            <div className="space-y-2 mt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[72px] bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Franchise Hero */}
            <FranchiseHero stats={stats} college={college} className="mb-6" />
            
            {/* Franchise Story Strip - This week's activity */}
            <FranchiseStoryStrip normalizedName={collegeSlug || ''} className="mb-8" />
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <FollowCollegeButton normalizedName={collegeSlug || ''} />
              <Link to={`/tourhub/college-golf/compare?c1=${collegeSlug}&c2=`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <GitCompare className="w-4 h-4" />
                  Compare
                </Button>
              </Link>
            </div>
            
            {/* Rivalries */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Swords className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Rivals</h2>
              </div>
              <CollegeRivalsCarousel normalizedName={collegeSlug || ''} />
            </section>
            
            {/* Alumni Depth Chart */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Alumni Depth Chart
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Current PGA Tour players ranked by contribution
              </p>
              <AlumniDepthChart normalizedName={collegeSlug || ''} />
            </section>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">
              No stats found for "{displayName}"
            </p>
            <Link 
              to="/tourhub/college-golf" 
              className="inline-block mt-4 text-primary hover:underline text-sm"
            >
              Browse all colleges
            </Link>
          </div>
        )}
      </div>
    </TourHubShell>
  );
}
