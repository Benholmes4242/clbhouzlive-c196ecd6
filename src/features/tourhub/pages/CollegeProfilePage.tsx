import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Menu, Swords, GitCompare, Crown, RefreshCw, AlertCircle } from 'lucide-react';
import { openTourNav } from '../contexts/TourNavContext';
import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
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
import { useTourSeason } from '../hooks/useTourHubData';
import { Button } from '@/components/ui/button';



const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setVariant, hideHeader, showHeader } = useHeader();

  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: rivalries } = useCollegeRivalries(collegeSlug);
  const { data: allSeasonStats } = useCollegeSeasonStats();
  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();
  
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

  // Compute this college's rank by earnings
  const collegeRank = (() => {
    if (!allSeasonStats || !collegeSlug) return null;
    const sorted = [...allSeasonStats].sort((a, b) => b.earnings_total - a.earnings_total);
    const idx = sorted.findIndex(s => s.normalized_name === collegeSlug);
    return idx >= 0 ? idx + 1 : null;
  })();

  // Scroll position handled by centralized ScrollRestoration component

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
      setVariant('solid-light');
    };
  }, [hideHeader, showHeader, setVariant]);
  
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
        style={{ height: '50dvh' }}
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

        {/* Bottom fade — strong gradient for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 65%, transparent 85%)',
          }}
        />

        {/* Burger menu — matches Players/Leaders pages */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
          aria-label="Open tour menu"
          className="absolute z-30 flex items-center justify-center"
          style={{ width: 44, height: 44, top: 56, left: 16 }}
        >
          <Menu className="w-[22px] h-[22px] text-white" style={{ strokeWidth: 2, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
        </button>

        {/* Content — centered */}
        {isLoading ? (
          <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8 pt-20">
            <div className="w-[140px] h-[140px] rounded-full bg-white/10 animate-pulse mb-4" />
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        ) : college ? (
          <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8 pt-20">
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
                <Crown className="w-4 h-4" style={{ color: '#f59e0b' }} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase' as const,
                  color: '#f59e0b',
                }}>
                  #{collegeRank} This Season
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
              {getCollegeLogoUrl(college?.college_name || collegeSlug) && !heroImgError ? (
                <img
                  src={getCollegeLogoUrl(college?.college_name || collegeSlug)!}
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
        <div className="relative z-10 mx-4" style={{ marginTop: '-24px' }}>
          <motion.div
            className="flex items-stretch"
            style={{
              background: 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '12px 0',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <GlassStatCell label="EARNINGS" value={formatCurrency(stats.earnings_total)} />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <GlassStatCell label="WINS" value={String(stats.wins_total)} highlight={stats.wins_total > 0} />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <GlassStatCell label="ALUMNI" value={String(stats.player_count)} />
          </motion.div>
        </div>
      )}

      {/* Back link */}
      <div className="px-4" style={{ marginTop: 12 }}>
        <button
          onClick={() => navigate('/tourhub/college-golf', { replace: true })}
          className="text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
        >
          ← College Golf
        </button>
      </div>

      {/* Content sections */}
      <div className="w-full max-w-5xl mx-auto px-4" style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
        {/* Compare Button — 16px from stats bar */}
        {stats && firstRival && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center"
            style={{ marginTop: '16px' }}
          >
            <button 
              onClick={handleCompareClick}
              className="flex items-center rounded-xl border border-border/50 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-95 transition-all"
              style={{ padding: '10px 20px', gap: '6px' }}
            >
              <GitCompare className="w-4 h-4 text-muted-foreground" />
              <span style={{ fontSize: '14px', fontWeight: 600 }} className="text-foreground">Compare</span>
            </button>
          </motion.div>
        )}

        {/* Story Strip — 16px from compare button */}
        {stats && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            style={{ marginTop: '16px' }}
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
            style={{ marginTop: '28px' }}
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

        {/* Alumni Depth Chart — 28px from rivals */}
        {stats && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ marginTop: '28px' }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }} className="text-foreground">
              Alumni Depth Chart
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: '13px', fontWeight: 400, marginTop: '4px', marginBottom: '20px' }}>
              Current PGA Tour players ranked by contribution
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

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function GlassStatCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
        color: 'rgba(255,255,255,0.5)',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 18,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: highlight ? '#f59e0b' : 'white',
        marginTop: 2,
      }}>
        {value}
      </span>
    </div>
  );
}
