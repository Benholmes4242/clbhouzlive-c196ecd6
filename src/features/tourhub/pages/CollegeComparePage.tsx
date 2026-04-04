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
            style={{ width: 44, height: 44, top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 52px)', left: 16 }}
          >
            <Menu className="w-[24px] h-[24px]" strokeWidth={1.5} style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
          </button>

          {/* Hero content — VS logos centered */}
          <div
            className="relative z-10 flex items-center justify-center h-full px-5"
            style={{
              paddingTop: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 80px)',
              paddingBottom: 28,
            }}
          >
            {!hasValidParams ? (
              <p className="text-white/70" style={{ fontSize: 15, fontWeight: 500 }}>
                Select two colleges to compare
              </p>
            ) : isLoading ? (
              <div className="flex items-center w-full max-w-xs">
                <div className="flex-1 flex flex-col items-center gap-3">
                  <Skeleton className="w-[130px] h-[130px] rounded-[24px] bg-white/10" />
                  <Skeleton className="h-5 w-28 bg-white/10" />
                </div>
                <div className="w-12 flex justify-center mb-10">
                  <span className="text-white/25" style={{ fontSize: 14, fontWeight: 900 }}>VS</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3">
                  <Skeleton className="w-[130px] h-[130px] rounded-[24px] bg-white/10" />
                  <Skeleton className="h-5 w-28 bg-white/10" />
                </div>
              </div>
            ) : data ? (
              <div className="flex items-center w-full">
                {/* College 1 */}
                <div className="flex-1 flex flex-col items-center gap-3.5 min-w-0">
                  <div
                    className="flex items-center justify-center overflow-hidden"
                    style={{
                      width: 130, height: 130,
                      borderRadius: 24,
                      background: 'rgba(255,255,255,0.14)',
                      border: '1.5px solid rgba(255,255,255,0.20)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
                    }}
                  >
                    {(() => {
                      const logo = getCollegeLogoUrl(data.college1.media?.college_name || '');
                      return logo ? (
                        <img
                          src={logo}
                          alt=""
                          className="object-contain"
                          style={{ width: 100, height: 100 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="font-bold text-white/60" style={{ fontSize: 40 }}>
                          {(data.college1.media?.short_name || 'C1').charAt(0)}
                        </span>
                      );
                    })()}
                  </div>
                  <span
                    className="text-white text-center"
                    style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
                  >
                    {data.college1.media?.short_name || data.college1.media?.college_name || 'College 1'}
                  </span>
                </div>

                {/* VS */}
                <div className="shrink-0 w-12 flex items-center justify-center" style={{ marginBottom: 42 }}>
                  <span className="text-white/28" style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.05em' }}>VS</span>
                </div>

                {/* College 2 */}
                <div className="flex-1 flex flex-col items-center gap-3.5 min-w-0">
                  <div
                    className="flex items-center justify-center overflow-hidden"
                    style={{
                      width: 130, height: 130,
                      borderRadius: 24,
                      background: 'rgba(255,255,255,0.14)',
                      border: '1.5px solid rgba(255,255,255,0.20)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
                    }}
                  >
                    {(() => {
                      const logo = getCollegeLogoUrl(data.college2.media?.college_name || '');
                      return logo ? (
                        <img
                          src={logo}
                          alt=""
                          className="object-contain"
                          style={{ width: 100, height: 100 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="font-bold text-white/60" style={{ fontSize: 40 }}>
                          {(data.college2.media?.short_name || 'C2').charAt(0)}
                        </span>
                      );
                    })()}
                  </div>
                  <span
                    className="text-white text-center"
                    style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}
                  >
                    {data.college2.media?.short_name || data.college2.media?.college_name || 'College 2'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            STICKY HEADER — ← College Golf
            ══════════════════════════════════════════════ */}
        <div
          className="-mx-0 sticky top-0 z-20"
          style={{
            background: 'hsl(var(--background) / 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid hsl(var(--border) / 0.10)',
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          }}
        >
          <div className="flex items-center px-4 pt-2.5 pb-3">
            <button
              onClick={() => navigate('/tourhub/college-golf')}
              className="flex items-center gap-0.5 text-[12px] font-medium active:opacity-50 transition-opacity"
              style={{ color: 'hsl(var(--muted-foreground) / 0.70)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              College Golf
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="relative px-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
        >
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
              <Skeleton className="h-24 rounded-2xl mb-4" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-base text-muted-foreground">
                Failed to load comparison data
              </p>
            </div>
          ) : data ? (
            <div style={{ paddingTop: 16 }}>
              <CollegeCompareHero data={data} />
            </div>
          ) : null}
        </div>
      </div>
    </TourHubShell>
  );
}
