import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Trophy, DollarSign, Target, Scissors, Users, TrendingUp, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCollegeCompare } from '../hooks/useCollegeCompare';
import { useCollegeHeadToHead } from '../hooks/useCollegeStatus';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { getCollegeGradientCSS } from '../config/collegeBrandColors';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { useEffect } from 'react';
import type { CollegeAlumnus } from '../hooks/useCollegeAlumni';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

/**
 * College Compare Page - Full head-to-head comparison of two colleges.
 * Route: /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 */
export function CollegeComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hideHeader, showHeader, setVariant } = useHeader();
  useMedianStatusBar("dark", "transparent", true, false);

  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';

  const { data, isLoading, error } = useCollegeCompare(c1, c2);
  const h2h = useCollegeHeadToHead(c1 || undefined, c2 || undefined);
  const { data: collegeMap } = useCollegeMediaMap();

  const hasValidParams = c1 && c2;

  const media1 = collegeMap?.get(c1);
  const media2 = collegeMap?.get(c2);
  const name1 = media1?.short_name || media1?.college_name || c1;
  const name2 = media2?.short_name || media2?.college_name || c2;
  const gradient1 = getCollegeGradientCSS(c1);
  const gradient2 = getCollegeGradientCSS(c2);
  const logo1 = getCollegeLogoUrl(media1?.college_name || c1);
  const logo2 = getCollegeLogoUrl(media2?.college_name || c2);

  useEffect(() => {
    hideHeader();
    return () => { showHeader(); setVariant('solid-light'); };
  }, [hideHeader, showHeader, setVariant]);

  const stats1 = data?.college1?.stats;
  const stats2 = data?.college2?.stats;

  const categories = stats1 && stats2 ? [
    { label: 'Earnings', icon: DollarSign, v1: stats1.earnings_total, v2: stats2.earnings_total, fmt: formatCurrency },
    { label: 'Wins', icon: Trophy, v1: stats1.wins_total, v2: stats2.wins_total },
    { label: 'Top 10s', icon: TrendingUp, v1: stats1.top10_total, v2: stats2.top10_total },
    { label: 'Top 25s', icon: Target, v1: stats1.top25_total, v2: stats2.top25_total },
    { label: 'Cuts Made', icon: Scissors, v1: stats1.cuts_total, v2: stats2.cuts_total },
    { label: 'Alumni', icon: Users, v1: stats1.player_count, v2: stats2.player_count },
  ] : [];

  return (
    <PageRoot className="min-h-screen w-full bg-background" immersive immersiveStatusBar hasBottomNav>
      {/* Hero: Split gradient with logos */}
      <div className="relative overflow-hidden" style={{ height: '38dvh' }}>
        {/* Left gradient */}
        <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 55% 0, 45% 100%, 0 100%)' }}>
          <div className="absolute inset-0" style={{ background: gradient1 || 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--foreground)))' }} />
        </div>
        {/* Right gradient */}
        <div className="absolute inset-0" style={{ clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 45% 100%)' }}>
          <div className="absolute inset-0" style={{ background: gradient2 || 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--foreground)))' }} />
        </div>
        {/* Center divider line */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
          <div className="h-full" style={{ width: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, transparent 80%)' }} />

        {/* Logos + names */}
        <div className="relative z-10 flex items-end justify-around h-full px-6 pb-6">
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {logo1 ? (
              <img src={logo1} alt={name1} className="object-contain" style={{ width: 80, height: 80, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-white/70">{name1?.charAt(0)}</span>
              </div>
            )}
            <p className="text-white text-center font-bold mt-2" style={{ fontSize: 15 }}>{name1}</p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}
          >
            <span className="text-white/50 font-black" style={{ fontSize: 20, letterSpacing: 2 }}>VS</span>
          </motion.div>

          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {logo2 ? (
              <img src={logo2} alt={name2} className="object-contain" style={{ width: 80, height: 80, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-white/70">{name2?.charAt(0)}</span>
              </div>
            )}
            <p className="text-white text-center font-bold mt-2" style={{ fontSize: 15 }}>{name2}</p>
          </motion.div>
        </div>
      </div>

      {/* H2H Score Card */}
      {h2h && (
        <div className="relative z-10 mx-4" style={{ marginTop: -24 }}>
          <motion.div
            className="bg-card border border-border/50 rounded-2xl flex items-center"
            style={{ padding: '16px 20px' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex-1 text-center">
              <span className="text-foreground font-bold" style={{ fontSize: 28, fontVariantNumeric: 'tabular-nums', color: h2h.winner === 'A' ? 'rgba(245,158,11,0.9)' : undefined }}>
                {h2h.winsA}
              </span>
            </div>
            <div className="flex flex-col items-center px-3">
              <Crown className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                {h2h.winner === 'tie' ? 'Tied' : 'Categories Won'}
              </span>
            </div>
            <div className="flex-1 text-center">
              <span className="text-foreground font-bold" style={{ fontSize: 28, fontVariantNumeric: 'tabular-nums', color: h2h.winner === 'B' ? 'rgba(245,158,11,0.9)' : undefined }}>
                {h2h.winsB}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Back link */}
      <div className="px-4" style={{ marginTop: 12 }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground active:opacity-70 transition-opacity"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-8" style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
        {!hasValidParams ? (
          <div className="text-center py-16">
            <p className="text-base text-muted-foreground mb-4">Select two colleges to compare</p>
            <button onClick={() => navigate('/tourhub/college-golf')} className="text-foreground font-medium hover:underline">
              Browse colleges
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 mt-6">
            <div className="h-24 bg-card border border-border rounded-xl animate-pulse" />
            <div className="h-24 bg-card border border-border rounded-xl animate-pulse" />
            <div className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-base text-muted-foreground">Failed to load comparison data</p>
          </div>
        ) : data ? (
          <div style={{ marginTop: 20 }}>
            {/* Category-by-category comparison */}
            <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
              Category Breakdown
            </h2>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {categories.map((cat, i) => {
                const Icon = cat.icon;
                const v1 = cat.v1;
                const v2 = cat.v2;
                const total = v1 + v2 || 1;
                const pct1 = (v1 / total) * 100;
                const winner = v1 > v2 ? 'left' : v2 > v1 ? 'right' : 'tie';
                const fmtVal = cat.fmt || ((n: number) => String(n));

                return (
                  <motion.div
                    key={cat.label}
                    className="bg-card border border-border/30 rounded-2xl"
                    style={{ padding: '14px 16px' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground font-bold" style={{ fontSize: 14, color: winner === 'left' ? 'rgba(245,158,11,0.9)' : undefined }}>
                        {fmtVal(v1)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">{cat.label}</span>
                      </div>
                      <span className="text-foreground font-bold" style={{ fontSize: 14, color: winner === 'right' ? 'rgba(245,158,11,0.9)' : undefined }}>
                        {fmtVal(v2)}
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="flex rounded-full overflow-hidden" style={{ height: 6 }}>
                      <div
                        style={{
                          width: `${pct1}%`,
                          background: gradient1 || 'hsl(var(--primary))',
                          opacity: winner === 'left' ? 1 : 0.4,
                          transition: 'width 0.5s ease-out',
                        }}
                      />
                      <div
                        style={{
                          width: `${100 - pct1}%`,
                          background: gradient2 || 'hsl(var(--muted))',
                          opacity: winner === 'right' ? 1 : 0.4,
                          transition: 'width 0.5s ease-out',
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Top Earners comparison */}
            {(data.college1.topEarners.length > 0 || data.college2.topEarners.length > 0) && (
              <motion.section
                style={{ marginTop: 28 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
                  Top Earners
                </h2>
                <div className="grid grid-cols-2" style={{ gap: 12 }}>
                  <div className="flex flex-col" style={{ gap: 6 }}>
                    {data.college1.topEarners.map((p) => (
                      <CompactPlayerRow key={p.id} player={p} />
                    ))}
                  </div>
                  <div className="flex flex-col" style={{ gap: 6 }}>
                    {data.college2.topEarners.map((p) => (
                      <CompactPlayerRow key={p.id} player={p} />
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Top Ranked comparison */}
            {(data.college1.topRanked.length > 0 || data.college2.topRanked.length > 0) && (
              <motion.section
                style={{ marginTop: 28 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
                  Highest Ranked
                </h2>
                <div className="grid grid-cols-2" style={{ gap: 12 }}>
                  <div className="flex flex-col" style={{ gap: 6 }}>
                    {data.college1.topRanked.map((p) => (
                      <CompactPlayerRow key={p.id} player={p} showRank />
                    ))}
                  </div>
                  <div className="flex flex-col" style={{ gap: 6 }}>
                    {data.college2.topRanked.map((p) => (
                      <CompactPlayerRow key={p.id} player={p} showRank />
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </div>
        ) : null}
      </div>
    </PageRoot>
  );
}

function CompactPlayerRow({ player, showRank = false }: { player: CollegeAlumnus; showRank?: boolean }) {
  const tourCode = player.tour_codes?.[0] || 'pga';
  const headshotUrl = getPlayerHeadshotUrl(`${player.first_name} ${player.last_name}`, tourCode);

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className="flex items-center gap-2 bg-card border border-border/30 active:scale-[0.98] transition-transform"
      style={{ borderRadius: 12, padding: '8px 10px' }}
    >
      <img
        src={headshotUrl}
        alt={`${player.first_name} ${player.last_name}`}
        className="rounded-full object-cover flex-shrink-0 bg-muted"
        style={{ width: 30, height: 30 }}
        onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-foreground truncate" style={{ fontSize: 12, fontWeight: 600 }}>
          {player.first_name} {player.last_name}
        </p>
        <p className="text-muted-foreground" style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
          {showRank && player.world_ranking ? `#${player.world_ranking}` : formatCurrency(player.earnings || 0)}
        </p>
      </div>
    </Link>
  );
}
