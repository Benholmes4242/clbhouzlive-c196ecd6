import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Swords, GitCompare, Globe, Crown, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { 
  FranchiseStoryStrip,
  AlumniDepthChart, 
  CollegeRivalsCarousel,
  CollegeCompareSheet,
} from '../components/college';
import { FollowCollegeButton } from '../components/college/FollowCollegeButton';
import { useCollegeStats, useCollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeRivalries } from '../hooks/useCollegeMovers';
import { getCollegeGradientCSS } from '../config/collegeBrandColors';
import { useTourSeason } from '../hooks/useTourHubData';
import { Button } from '@/components/ui/button';

const SCROLL_KEY = 'college-detail-scroll';

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setVariant, hideHeader, showHeader } = useHeader();
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

  // Scroll restoration
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
      sessionStorage.removeItem(SCROLL_KEY);
    } else {
      window.scrollTo(0, 0);
    }
  }, [collegeSlug]);

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
  
  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/tourhub/college-golf');
    }
  };
  
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
        style={{ height: 'clamp(282px, 53vh, 422px)' }}
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
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
          }}
        />

        {/* Back Button — plain arrow, 44×44px, matching Players/Leaders */}
        <button
          onClick={handleBack}
          className="absolute z-20 flex items-center justify-center active:scale-95 transition-all"
          style={{
            top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
            left: '16px',
            width: '44px',
            height: '44px',
          }}
        >
          <ArrowLeft 
            className="text-white" 
            style={{ 
              width: '22px', 
              height: '22px',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
            }} 
          />
        </button>

        {/* Content — centered */}
        {isLoading ? (
          <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8 pt-20">
            <div className="w-[110px] h-[110px] rounded-full bg-white/10 animate-pulse mb-4" />
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
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.45)',
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
                style={{ marginTop: '4px', marginBottom: '20px' }}
              >
                <Crown className="w-4 h-4" style={{ color: '#f59e0b' }} />
                <span style={{
                  fontSize: '11px',
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
              {college?.logo_url && !heroImgError ? (
                <img
                  src={college.logo_url}
                  alt={displayName}
                  className="object-contain"
                  style={{
                    width: '110px',
                    height: '110px',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                  }}
                  onError={() => setHeroImgError(true)}
                />
              ) : (
                <div className="w-[110px] h-[110px] bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl" style={{ borderRadius: '34%' }}>
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
                fontSize: '28px',
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
                  fontSize: '13px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {subtitleText}
              </motion.p>
            )}

            {/* Follow button */}
            {collegeSlug && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                style={{ marginTop: '12px' }}
              >
                <FollowCollegeButton
                  normalizedName={collegeSlug}
                  className="bg-white/15 border-white/20 text-white hover:bg-white/25"
                />
              </motion.div>
            )}
          </div>
        ) : null}
      </div>

      {/* Stats Bar — 5-column, overlaps hero by -24px */}
      {stats && (
        <div className="relative z-10 mx-4" style={{ marginTop: '-24px' }}>
          <motion.div
            className="rounded-2xl border border-border/50 bg-card"
            style={{
              padding: '14px 8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <StatPill label="WINS" value={String(stats.wins_total)} highlight={stats.wins_total > 0} />
            <StatDivider />
            <StatPill label="EARNINGS" value={formatCurrency(stats.earnings_total)} />
            <StatDivider />
            <StatPill label="CUTS" value={String(stats.cuts_total)} />
            <StatDivider />
            <StatPill label="TOP 10" value={String(stats.top10_total)} />
            <StatDivider />
            <StatPill label="PLAYERS" value={String(stats.player_count)} />
          </motion.div>
        </div>
      )}

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
              className="flex items-center rounded-xl border border-border/50 bg-card active:scale-95 transition-all"
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

        {/* Rivalries — 24px from activity cards */}
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
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }} className="text-foreground">Rivals</h2>
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

        {/* Footer */}
        <div style={{ marginTop: '24px' }}>
          <div className="flex items-center gap-2 justify-center">
            <Globe className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground) / 0.2)' }} />
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'hsl(var(--muted-foreground) / 0.3)' }}>
              Powered by SportsRadar
            </span>
          </div>
        </div>
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

function StatDivider() {
  return <div className="w-px self-stretch bg-border/10" />;
}

function StatPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <span style={{
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
      }} className="text-muted-foreground/50 block mb-0.5">
        {label}
      </span>
      <span style={{
        fontSize: '15px',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: highlight ? '#f59e0b' : undefined,
      }} className={highlight ? '' : 'text-foreground'}>
        {value}
      </span>
    </div>
  );
}
