import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Swords, GitCompare } from 'lucide-react';
import { TourHubShell } from '../components';
import { 
  FranchiseHero, 
  FranchiseStoryStrip,
  AlumniDepthChart, 
  CollegeRivalsCarousel,
  CollegeCompareSheet,
  FollowCollegeButton 
} from '../components/college';
import { useCollegeStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeRivalries } from '../hooks/useCollegeMovers';
import { getCollegeGradientCSS } from '../config/collegeBrandColors';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * College Profile Page - Premium alumni page with franchise identity
 * Route: /tourhub/college-golf/:collegeSlug
 */
export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const { data: stats, isLoading: statsLoading } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: rivalries } = useCollegeRivalries(collegeSlug);
  
  // Compare sheet state
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCollege2, setCompareCollege2] = useState<string | null>(null);
  
  const college = collegeSlug ? collegeMap?.get(collegeSlug) || null : null;
  const displayName = college?.short_name || college?.college_name || collegeSlug || 'College';
  
  const isLoading = statsLoading || mediaLoading;
  
  // Get rival slugs for the sheet
  const rivalSlugs = rivalries?.map(r => r.rivalNormalizedName) ?? [];
  const firstRival = rivalSlugs[0] ?? null;
  
  // Get college gradient for hero color bleed
  const gradientCSS = collegeSlug ? getCollegeGradientCSS(collegeSlug) : null;
  
  // Reset compareCollege2 when collegeSlug changes
  useEffect(() => {
    setCompareCollege2(null);
    setCompareOpen(false);
  }, [collegeSlug]);
  
  // Handler for Compare button
  const handleCompareClick = () => {
    if (!compareCollege2 && firstRival) {
      setCompareCollege2(firstRival);
    }
    setCompareOpen(true);
  };
  
  // Handler for rival tile click (from carousel)
  const handleRivalCompare = (rivalSlug: string) => {
    setCompareCollege2(rivalSlug);
    setCompareOpen(true);
  };
  
  return (
    <TourHubShell>
      {/* College brand color bleed — matches CollegeHeroBanner */}
      {gradientCSS && (
        <div
          className="absolute inset-x-0 top-0 h-[200px] z-0"
          style={{
            background: gradientCSS,
            maskImage: 'linear-gradient(180deg, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 100%)',
          }}
        />
      )}

      {/* Back Link */}
      <div className="pt-4 relative z-10">
        <Link 
          to="/tourhub/college-golf" 
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={gradientCSS ? { color: 'rgba(255,255,255,0.7)' } : undefined}
        >
          <ArrowLeft className="w-4 h-4" />
          College Rankings
        </Link>
      </div>
      
      {/* Content */}
      <div className="py-6 relative z-10">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={handleCompareClick}
                      disabled={!firstRival}
                    >
                      <GitCompare className="w-4 h-4" />
                      Compare
                    </Button>
                  </span>
                </TooltipTrigger>
                {!firstRival && (
                  <TooltipContent>
                    <p>No rivals to compare</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            
            {/* Rivalries */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Swords className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Rivals</h2>
              </div>
              <CollegeRivalsCarousel 
                normalizedName={collegeSlug || ''} 
                onCompare={handleRivalCompare}
              />
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
      
      {/* Compare Sheet */}
      {collegeSlug && (
        <CollegeCompareSheet
          isOpen={compareOpen}
          onClose={() => setCompareOpen(false)}
          college1={collegeSlug}
          college2={compareCollege2 ?? firstRival ?? ''}
          rivals={rivalSlugs}
          onCollegeChange={setCompareCollege2}
        />
      )}
    </TourHubShell>
  );
}