import { useSearchParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu, ChevronLeft } from 'lucide-react';
import { TourHubShell } from '../components';
import { CollegeCompareHero } from '../components/college/CollegeCompareHero';
import { useCollegeCompare } from '../hooks/useCollegeCompare';
import { openTourNav } from '../contexts/TourNavContext';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getCollegeGradientCSS } from '../config/collegeBrandColors';

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

  // Derive gradient from first college for hero background
  const gradientCSS = c1 ? getCollegeGradientCSS(c1) : null;
  
  return (
    <TourHubShell immersive>
      <div className="relative min-h-screen bg-background">
        {/* Immersive Hero — matches CollegeProfilePage pattern */}
        <div
          className="relative overflow-hidden"
          style={{ height: 'calc(45dvh + var(--sat, env(safe-area-inset-top, 0px)))' }}
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{ background: gradientCSS || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--foreground)))' }}
          />

          {/* Texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)',
            }}
          />

          {/* Bottom fade */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 65%, transparent 85%)',
            }}
          />

          {/* Burger menu — absolute inside hero, white with drop shadow */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
            aria-label="Open tour menu"
            className="absolute z-30 flex items-center justify-center"
            style={{ width: 44, height: 44, top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 12px)', left: 16 }}
          >
            <Menu className="w-[24px] h-[24px]" strokeWidth={1.5} style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
          </button>

          {/* Hero content — VS logos centered */}
          <div
            className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8"
            style={{ paddingTop: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 80px)' }}
          >
            {!hasValidParams ? (
              <p className="text-white/70" style={{ fontSize: 15, fontWeight: 500 }}>
                Select two colleges to compare
              </p>
            ) : isLoading ? (
              /* Skeleton VS header inside hero */
              <div className="flex items-center w-full max-w-xs">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton className="w-20 h-20 rounded-xl bg-white/10" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </div>
                <div className="w-16 flex justify-center">
                  <span className="text-white/30" style={{ fontSize: 16, fontWeight: 800 }}>VS</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-xl bg-white/10 animate-pulse" />
                  <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            ) : data ? (
              /* VS logos in hero */
              <div className="flex items-center w-full max-w-xs">
                <div className="flex-1 flex flex-col items-center min-w-0">
                  <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden mb-2">
                    {(() => {
                      const logo = getCollegeLogoUrl(data.college1.media?.college_name || '');
                      return logo ? (
                        <img src={logo} alt="" className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-xl font-bold text-white/60">
                          {(data.college1.media?.short_name || 'C1').charAt(0)}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="text-white text-center truncate max-w-full" style={{ fontSize: 14, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                    {data.college1.media?.short_name || data.college1.media?.college_name || 'College 1'}
                  </span>
                </div>
                <div className="shrink-0 w-16 flex items-center justify-center" style={{ height: 80 }}>
                  <span className="text-white/40" style={{ fontSize: 16, fontWeight: 800 }}>VS</span>
                </div>
                <div className="flex-1 flex flex-col items-center min-w-0">
                  <div className="w-20 h-20 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden mb-2">
                    {(() => {
                      const logo = getCollegeLogoUrl(data.college2.media?.college_name || '');
                      return logo ? (
                        <img src={logo} alt="" className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span className="text-xl font-bold text-white/60">
                          {(data.college2.media?.short_name || 'C2').charAt(0)}
                        </span>
                      );
                    })()}
                  </div>
                  <span className="text-white text-center truncate max-w-full" style={{ fontSize: 14, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                    {data.college2.media?.short_name || data.college2.media?.college_name || 'College 2'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Content below hero */}
        <div
          className="relative px-4"
          style={{
            marginTop: -24,
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          }}
        >
          {/* Back CTA */}
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => navigate('/tourhub/college-golf')}
              className="inline-flex items-center gap-0.5 text-muted-foreground active:opacity-70 transition-opacity"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              <ChevronLeft size={14} />
              College Golf
            </button>
          </div>

          {!hasValidParams ? (
            <div className="text-center py-16">
              <button
                onClick={() => navigate('/tourhub/college-golf')}
                className="text-foreground font-medium hover:underline"
              >
                Browse colleges
              </button>
            </div>
          ) : isLoading ? (
            <div style={{ paddingTop: 16 }}>
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
            <div style={{ paddingTop: 8 }}>
              <CollegeCompareHero data={data} onBack={() => navigate(-1)} />
            </div>
          ) : null}
        </div>
      </div>
    </TourHubShell>
  );
}
