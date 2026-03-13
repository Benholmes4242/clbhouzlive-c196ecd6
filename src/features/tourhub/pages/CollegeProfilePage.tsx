import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Menu, Crown, RefreshCw, AlertCircle, ChevronLeft, TrendingUp, Trophy } from 'lucide-react';
import { openTourNav } from '../contexts/TourNavContext';
import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

import { useCollegeStats, useCollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeAlumni, type CollegeAlumnus } from '../hooks/useCollegeAlumni';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeHeadToHead } from '../hooks/useCollegeStatus';
import { getCollegeGradientCSS } from '../config/collegeBrandColors';
import { useTourSeason } from '../hooks/useTourHubData';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { useCollegeRivals } from '../hooks/useCollegeRivals';

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setVariant, hideHeader, showHeader } = useHeader();

  useMedianStatusBar("dark", "transparent", true, false);
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: allSeasonStats } = useCollegeSeasonStats();
  const { data: season } = useTourSeason();
  const { data: alumni, isLoading: alumniLoading } = useCollegeAlumni(collegeSlug, { limit: 30 });
  const { data: rivals } = useCollegeRivals(collegeSlug);
  const topRival = rivals?.[0];
  const h2h = useCollegeHeadToHead(collegeSlug, topRival?.normalized_name);
  const seasonYear = season?.year || new Date().getFullYear();
  
  const [heroImgError, setHeroImgError] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  
  const college = collegeSlug ? collegeMap?.get(collegeSlug) || null : null;
  const displayName = college?.short_name || college?.college_name || collegeSlug || 'College';
  const isLoading = statsLoading || mediaLoading;
  const gradientCSS = collegeSlug ? getCollegeGradientCSS(collegeSlug) : null;

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
        style={{ height: '45dvh' }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 15, ease: 'easeOut' }}
          style={{ background: gradientCSS || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--foreground)))' }}
        />
        
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)',
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 65%, transparent 85%)',
          }}
        />

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
          aria-label="Open tour menu"
          className="absolute z-30 flex items-center justify-center"
          style={{ width: 44, height: 44, top: 56, left: 16 }}
        >
          <Menu className="w-[24px] h-[24px] text-white" style={{ strokeWidth: 1.5, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
        </button>

        {isLoading ? (
          <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8 pt-20">
            <div className="w-[140px] h-[140px] rounded-full bg-white/10 animate-pulse mb-4" />
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        ) : college ? (
          <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-8 pt-20">
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

            {collegeRank && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="flex items-center gap-1.5"
                style={{ marginTop: '4px', marginBottom: '12px' }}
              >
                <Crown className="w-4 h-4" style={{ color: 'rgba(245, 158, 11, 0.9)' }} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase' as const,
                  color: 'rgba(245, 158, 11, 0.9)',
                }}>
                  #{collegeRank} This Season
                </span>
              </motion.div>
            )}

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

      {/* Stats Bar */}
      {stats && (
        <div className="relative z-10 mx-4" style={{ marginTop: '-24px' }}>
          <motion.div
            className="flex items-stretch rounded-2xl border border-border/50 bg-card"
            style={{ padding: '12px 0' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <GlassStatCell label="EARNINGS" value={formatCurrency(stats.earnings_total)} />
            <div style={{ width: 1 }} className="bg-border/50" />
            <GlassStatCell label="WINS" value={String(stats.wins_total)} highlight={stats.wins_total > 0} />
            <div style={{ width: 1 }} className="bg-border/50" />
            <GlassStatCell label="ALUMNI" value={String(stats.player_count)} />
          </motion.div>
        </div>
      )}

      {/* Back link */}
      <div className="px-4" style={{ marginTop: 12 }}>
        <button
          onClick={() => navigate('/tourhub/college-golf', { replace: true })}
          className="flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
        >
          <ChevronLeft size={14} />
          College Golf
        </button>
      </div>

      {/* Content sections */}
      <div className="w-full max-w-5xl mx-auto px-4" style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
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

        {/* Alumni Roster */}
        {stats && (
          <motion.section
            style={{ marginTop: 20 }}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
              PGA Tour Alumni
            </h2>

            {alumniLoading ? (
              <div className="flex flex-col" style={{ gap: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border/30 animate-pulse" style={{ height: 64, borderRadius: 14 }} />
                ))}
              </div>
            ) : alumni && alumni.length > 0 ? (
              <div className="flex flex-col" style={{ gap: 6 }}>
                {alumni.map((player, idx) => (
                  <AlumniRow key={player.id} player={player} rank={idx + 1} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No alumni data available for this season.
              </p>
            )}
          </motion.section>
        )}

        {/* Season Performance Summary */}
        {stats && (
          <motion.section
            style={{ marginTop: 28 }}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
              Season Performance
            </h2>
            <div className="grid grid-cols-2" style={{ gap: 8 }}>
              <StatTile label="Total Earnings" value={formatCurrency(stats.earnings_total)} />
              <StatTile label="Wins" value={String(stats.wins_total)} highlight={stats.wins_total > 0} />
              <StatTile label="Top 10s" value={String(stats.top10_total)} />
              <StatTile label="Cuts Made" value={String(stats.cuts_total)} />
              <StatTile label="Top 25s" value={String(stats.top25_total)} />
              <StatTile label="Events Played" value={String(stats.events_total)} />
            </div>
          </motion.section>
        )}
      </div>
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
        color: highlight ? 'rgba(245, 158, 11, 0.9)' : undefined,
        marginTop: 2,
      }}>
        {value}
      </span>
    </div>
  );
}

function AlumniRow({ player, rank }: { player: CollegeAlumnus; rank: number }) {
  const tourCode = player.tour_codes?.[0] || 'pga';
  const headshotUrl = getPlayerHeadshotUrl(
    `${player.first_name} ${player.last_name}`,
    tourCode
  );

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="flex items-center gap-3 bg-card border border-border/30 active:scale-[0.98] transition-transform"
      style={{ borderRadius: 14, padding: '10px 14px' }}
    >
      {/* Rank */}
      <span
        className="text-muted-foreground flex-shrink-0"
        style={{ fontSize: 12, fontWeight: 600, width: 20, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
      >
        {rank}
      </span>

      {/* Headshot */}
      <img
        src={headshotUrl}
        alt={`${player.first_name} ${player.last_name}`}
        className="rounded-full object-cover flex-shrink-0 bg-muted"
        style={{ width: 38, height: 38 }}
        onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
      />

      {/* Name + country */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground truncate" style={{ fontSize: 14, fontWeight: 600 }}>
          {player.first_name} {player.last_name}
        </p>
        <div className="flex items-center gap-2">
          {player.world_ranking && (
            <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
              #{player.world_ranking}
            </span>
          )}
          {player.country && (
            <span className="text-muted-foreground/60" style={{ fontSize: 12 }}>
              {player.country}
            </span>
          )}
        </div>
      </div>

      {/* Earnings */}
      <span
        className="text-foreground flex-shrink-0"
        style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
      >
        {formatCurrency(player.earnings || 0)}
      </span>
    </Link>
  );
}

function StatTile({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="bg-card border border-border/30 flex flex-col items-center justify-center"
      style={{ borderRadius: 14, padding: '14px 8px' }}
    >
      <span className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span
        className="text-foreground"
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          marginTop: 4,
          color: highlight ? 'rgba(245, 158, 11, 0.9)' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
