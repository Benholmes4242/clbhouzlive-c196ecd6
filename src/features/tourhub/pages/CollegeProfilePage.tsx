import { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Menu, Swords, GitCompare, Crown, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
import { openTourNav } from '../contexts/TourNavContext';
import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { 
  FranchiseStoryStrip,
  AlumniDepthChart, 
  CollegeRivalsCarousel,
  CollegeCompareSheet,
} from '../components/college';

import { useCollegeStats, useCollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeRivalries } from '../hooks/useCollegeMovers';
import { getCollegeGradientCSS } from '../config/collegeBrandColors';



const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hideHeader, showHeader } = useHeader();

  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: rivalries } = useCollegeRivalries(collegeSlug);
  const { data: allSeasonStats } = useCollegeSeasonStats();
  const seasonYear = new Date().getFullYear();
  
  const [compareOpen, setCompareOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const [compareCollege2, setCompareCollege2] = useState<string | null>(null);
  
  const college = collegeSlug ? collegeMap?.get(collegeSlug) || null : null;
  const displayName = college?.short_name || college?.college_name || collegeSlug || 'College';
  const isLoading = statsLoading || mediaLoading;
  const rivalSlugs = rivalries?.map(r => r.rivalNormalizedName) ?? [];
  const firstRival = rivalSlugs[0] ?? null;
  const gradientCSS = collegeSlug ? getCollegeGradientCSS(collegeSlug) : null;
  const logoUrl = getCollegeLogoUrl(college?.college_name || collegeSlug);

  // Compute this college's rank by earnings
  const collegeRank = (() => {
    if (!allSeasonStats || !collegeSlug) return null;
    const sorted = [...allSeasonStats].sort((a, b) => b.earnings_total - a.earnings_total);
    const idx = sorted.findIndex(s => s.normalized_name === collegeSlug);
    return idx >= 0 ? idx + 1 : null;
  })();

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDistance(Math.min(delta, 100));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['college-stats', collegeSlug] }),
        queryClient.invalidateQueries({ queryKey: ['college-alumni', collegeSlug] }),
        queryClient.invalidateQueries({ queryKey: ['college-rivals', collegeSlug] }),
      ]);
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }
    isPulling.current = false;
  }, [pullDistance, isRefreshing, queryClient, collegeSlug]);
  
  useEffect(() => {
    hideHeader();
    return () => {
      showHeader();
    };
  }, [hideHeader, showHeader]);
  
  useEffect(() => {
    setCompareCollege2(null);
    setCompareOpen(false);
  }, [collegeSlug]);
  
  const handleCompareClick = () => {
    if (!compareCollege2 && firstRival) {
      setCompareCollege2(firstRival);
    }
    setCompareOpen(true);
  };
  
  const handleRivalCompare = (rivalSlug: string) => {
    setCompareCollege2(rivalSlug);
    setCompareOpen(true);
  };

  // Build descriptive subtitle
  const subtitleText = stats
    ? `${stats.player_count} alumni on the PGA Tour`
    : null;
  
  return (
    <PageRoot className="min-h-screen w-full bg-background" immersive immersiveStatusBar hasBottomNav
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex justify-center py-3 relative z-50">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : pullDistance * 3.6 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      )}
      {/* Immersive Brand Color Hero */}
      <div
        className="relative overflow-hidden"
        style={{ height: 'calc(35dvh + var(--sat, env(safe-area-inset-top, 0px)))' }}
      >
        {/* Brand gradient background with Ken Burns */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 15, ease: 'easeOut' }}
          style={{ background: gradientCSS || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--foreground)))' }}
        />
        
        {/* Texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)',
          }}
        />

        {/* Bottom fade — lighter gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.05) 65%, transparent 85%)',
          }}
        />

        {/* Burger menu — dark glass pill */}
        <button
          className="absolute z-20 flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{
            top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 52px)',
            left: 16,
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
          aria-label="Open tour menu"
        >
          <Menu className="w-[18px] h-[18px] text-white" strokeWidth={2} />
        </button>

        {/* Content — centered */}
        {isLoading ? (
          <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8" style={{ paddingTop: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 80px)' }}>
            <Skeleton className="w-[140px] h-[140px] bg-white/10 mb-4" style={{ borderRadius: '34%' }} />
            <Skeleton className="h-8 w-48 bg-white/10 mb-2" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
        ) : (college || stats) ? (
          <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8" style={{ paddingTop: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 80px)' }}>
            {/* Season label */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.55)',
                marginBottom: '4px',
              }}
            >
              {seasonYear} Season
            </motion.span>

            {/* Rank badge */}
            {collegeRank && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="flex items-center gap-1.5"
                style={{ marginTop: '4px', marginBottom: '12px' }}
              >
                <Crown className="w-4 h-4" style={{ color: 'hsl(var(--accent-amber) / 0.9)' }} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase' as const,
                  color: 'hsl(var(--accent-amber) / 0.9)',
                }}>
                  #{collegeRank} by Earnings
                </span>
              </motion.div>
            )}

            {/* Logo — 110×110px */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              style={{ marginBottom: '16px' }}
            >
              {logoUrl && !heroImgError ? (
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="object-contain"
                  style={{
                    width: '140px',
                    height: '140px',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                  }}
                  onError={() => setHeroImgError(true)}
                />
              ) : (
                <div className="w-[140px] h-[140px] bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl" style={{ borderRadius: '34%' }}>
                  <span className="text-4xl font-bold text-white/70">
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Name — 28px, weight 700, tracking -0.4px */}
            <motion.h1
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="text-center text-white"
              style={{
                fontSize: '34px',
                fontWeight: 700,
                letterSpacing: '-0.4px',
                marginBottom: '4px',
              }}
            >
              {displayName}
            </motion.h1>

            {/* Subtitle — 13px, weight 400, rgba(255,255,255,0.6) */}
            {subtitleText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {subtitleText}
              </motion.p>
            )}

          </div>
        ) : null}
      </div>

      {/* Stats Bar — 3-column glass overlay on hero */}
      {stats && (
        <div className="relative z-10 mx-5" style={{ marginTop: '-24px' }}>
          <motion.div
            className="flex items-stretch rounded-2xl border border-border/50 bg-card"
            style={{
              padding: '12px 0',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <GlassStatCell label="EARNINGS" value={formatCurrency(stats.earnings_total)} />
            <div style={{ width: 1 }} className="bg-border/50" />
            <GlassStatCell label="WINS" value={String(stats.wins_total)} highlight={stats.wins_total > 0} />
            <div style={{ width: 1 }} className="bg-border/50" />
            <GlassStatCell label="TOP 10s" value={String(stats.top10_total)} highlight={stats.top10_total > 0} />
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STICKY HEADER — ← College Golf | Compare
          ══════════════════════════════════════════════ */}
      <div
        className="-mx-5 sticky top-0 z-20"
        style={{
          background: 'hsl(var(--background) / 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid hsl(var(--border) / 0.10)',
          paddingTop: 10,
          marginTop: 8,
        }}
      >
        <div className="flex items-center gap-2 px-5 pt-2 pb-2.5">
          {/* ← College Golf */}
          <button
            type="button"
            onClick={() => navigate('/tourhub/college-golf')}
            className="-ml-1 flex items-center gap-0.5 text-[12px] font-medium active:opacity-50 transition-opacity shrink-0"
            style={{ color: 'hsl(var(--muted-foreground) / 0.70)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            College Golf
          </button>

          <div className="flex-1" />

          {/* Compare pill — only shown when rivalSlugs exist */}
          {stats && rivalSlugs.length > 0 && (
            <button
              onClick={handleCompareClick}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] shrink-0',
                'bg-card border border-border/50 shadow-sm',
                'transition-all duration-150 active:scale-[0.97]'
              )}
            >
              <GitCompare className="w-[13px] h-[13px] shrink-0" style={{ color: '#F59E0B' }} strokeWidth={2.5} />
              <span className="text-[12px] font-semibold text-foreground">Compare</span>
            </button>
          )}
        </div>
      </div>

      {/* Content sections */}
      <div className="w-full max-w-5xl mx-auto px-5" style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Story Strip — 20px from sticky header */}
        {stats && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            style={{ marginTop: '20px' }}
          >
            <FranchiseStoryStrip normalizedName={collegeSlug || ''} />
          </motion.div>
        )}

        {/* Rivalries — 28px from activity cards */}
        {stats && rivalSlugs.length > 0 && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            style={{ marginTop: '24px' }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
              <Swords className="w-4 h-4 text-muted-foreground" />
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }} className="text-foreground">
                {rivalries?.every(r => r.isFallback) ? 'Similar Programs' : 'Rivals'}
              </h2>
            </div>
            <CollegeRivalsCarousel 
              normalizedName={collegeSlug || ''} 
              onCompare={handleRivalCompare}
            />
          </motion.section>
        )}

        {/* Alumni on Tour — 28px from rivals */}
        {stats && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
             style={{ marginTop: '24px' }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }} className="text-foreground">
              Alumni on Tour
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 400, marginTop: '4px', marginBottom: '20px' }}>
              Every pro from this program
            </p>
            <AlumniDepthChart normalizedName={collegeSlug || ''} />
          </motion.section>
        )}

        {!isLoading && !stats && (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Couldn't load school data
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => refetchStats()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tap to Retry
            </button>
            <Link 
              to="/tourhub/college-golf" 
              className="block mt-4 text-primary hover:underline text-sm"
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
    </PageRoot>
  );
}

function GlassStatCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <span className="text-muted-foreground" style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
      }}>
        {label}
      </span>
      <span className="text-foreground" style={{
        fontSize: 18,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: highlight ? 'hsl(var(--accent-amber) / 0.9)' : undefined,
        marginTop: 2,
      }}>
        {value}
      </span>
    </div>
  );
}
