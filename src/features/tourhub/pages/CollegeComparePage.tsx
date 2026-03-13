import { useSearchParams, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
      <div
        className="min-h-screen relative px-4 bg-background"
        style={{
          paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 47px)',
          paddingBottom: 'calc(var(--sab, 30px) + 16px)',
        }}
      >
        {/* Burger menu */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
          aria-label="Open tour menu"
          className="absolute z-30 flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 8px)',
            left: 16,
          }}
        >
          <Menu className="w-[24px] h-[24px] text-foreground" style={{ strokeWidth: 1.5 }} />
        </button>

        {/* Content */}
        <div style={{ paddingTop: 56 }}>
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
            <CollegeCompareHero data={data} onBack={() => navigate(-1)} />
          ) : null}
        </div>
      </div>
    </TourHubShell>
  );
}
