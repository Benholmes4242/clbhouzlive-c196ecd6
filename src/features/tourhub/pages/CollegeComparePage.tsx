import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeCompareHero } from '../components/college/CollegeCompareHero';
import { useCollegeCompare } from '../hooks/useCollegeCompare';
import { openTourNav } from '../contexts/TourNavContext';

/**
 * College Compare Page - Side-by-side comparison of two colleges.
 * Route: /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 */
export function CollegeComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';
  
  const { data, isLoading, error } = useCollegeCompare(c1, c2);
  
  const hasValidParams = c1 && c2;
  
  return (
    <TourHubShell>
      <div className="min-h-screen relative" style={{ backgroundColor: '#F8FAFC' }}>
        {/* Burger menu */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
          aria-label="Open tour menu"
          className="absolute z-30 flex items-center justify-center"
          style={{ width: 44, height: 44, top: 16, left: 16 }}
        >
          <Menu className="w-[22px] h-[22px] text-foreground" style={{ strokeWidth: 2 }} />
        </button>

        {/* Back Link */}
        <div className="pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        
        {/* Content */}
        <div className="pb-8 pt-4">
          {!hasValidParams ? (
            <div className="text-center py-16">
              <p className="text-base text-muted-foreground mb-4">
                Select two colleges to compare
              </p>
              <button
                onClick={() => navigate('/tourhub/college-golf')}
                className="text-foreground font-medium hover:underline"
              >
                Browse colleges
              </button>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
              <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-base text-muted-foreground">
                Failed to load comparison data
              </p>
            </div>
          ) : data ? (
            <CollegeCompareHero data={data} />
          ) : null}
        </div>
      </div>
    </TourHubShell>
  );
}
