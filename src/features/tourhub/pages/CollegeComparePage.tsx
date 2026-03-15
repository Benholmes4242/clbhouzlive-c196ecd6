import { useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, ChevronLeft } from 'lucide-react';
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
          paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)',
        }}
      >
        {/* Burger menu */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
          aria-label="Open tour menu"
          className="absolute z-30 flex items-center justify-center"
          style={{ width: 44, height: 44, top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 12px)', left: 16 }}
        >
          <Menu className="w-[24px] h-[24px] text-foreground" style={{ strokeWidth: 1.5 }} />
        </button>

        {/* Back CTA */}
        <div>
          <button
            onClick={() => navigate('/tourhub/college-golf')}
            className="inline-flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
          >
            <ChevronLeft size={14} />
            College Golf
          </button>
        </div>

        {/* Content */}
        <div style={{ paddingTop: 8 }}>
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
            <div>
              {/* VS header skeleton */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-xl bg-muted animate-pulse" />
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                </div>
                <div className="w-16 flex justify-center">
                  <div className="h-5 w-8 rounded bg-muted animate-pulse" />
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-xl bg-muted animate-pulse" />
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                </div>
              </div>
              {/* Summary card skeleton */}
              <div className="h-24 rounded-2xl bg-muted animate-pulse mb-4" />
              {/* Stats skeleton */}
              <div className="h-48 rounded-2xl bg-muted animate-pulse" />
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