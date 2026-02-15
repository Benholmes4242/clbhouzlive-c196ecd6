import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Swords, GitCompare, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { 
  FranchiseHero, 
  FranchiseStoryStrip,
  AlumniDepthChart, 
  CollegeRivalsCarousel,
  CollegeCompareSheet,
} from '../components/college';
import { useCollegeStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeRivalries } from '../hooks/useCollegeMovers';
import { getCollegeGradientCSS } from '../config/collegeBrandColors';
import { Button } from '@/components/ui/button';

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/**
 * College Profile Page - Immersive profile with brand color hero,
 * glass back button, and magazine-quality sections.
 */
export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setVariant, hideHeader, showHeader } = useHeader();
  const { data: stats, isLoading: statsLoading } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: rivalries } = useCollegeRivalries(collegeSlug);
  
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareCollege2, setCompareCollege2] = useState<string | null>(null);
  
  const college = collegeSlug ? collegeMap?.get(collegeSlug) || null : null;
  const displayName = college?.short_name || college?.college_name || collegeSlug || 'College';
  const isLoading = statsLoading || mediaLoading;
  const rivalSlugs = rivalries?.map(r => r.rivalNormalizedName) ?? [];
  const firstRival = rivalSlugs[0] ?? null;
  const gradientCSS = collegeSlug ? getCollegeGradientCSS(collegeSlug) : null;
  
  // Immersive mode: hide header
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
  
  return (
    <PageRoot className="min-h-screen w-full bg-background" immersive immersiveStatusBar hasBottomNav>
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

        {/* Bottom fade */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)',
          }}
        />

        {/* Glass Back Button — matches Players page (44px squircle) */}
        <button
          onClick={handleBack}
          className="absolute z-20 h-11 w-11 rounded-md flex items-center justify-center bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all"
          style={{
            top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
            left: '16px',
          }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
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
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mb-4"
            >
              {college?.logo_url ? (
                <img
                  src={college.logo_url}
                  alt={displayName}
                  className="object-contain"
                  style={{
                    width: '110px',
                    height: '110px',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                  }}
                />
              ) : (
                <div className="w-[110px] h-[110px] bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl" style={{ borderRadius: '34%' }}>
                  <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" style={{ borderRadius: '34%' }} />
                </div>
              )}
            </motion.div>

            {/* Name */}
            <motion.h1
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="text-2xl md:text-3xl font-bold text-white text-center tracking-tight mb-2"
            >
              {displayName}
            </motion.h1>

            {/* Subtitle */}
            {stats && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-sm text-white/70"
              >
                {stats.player_count} PGA Tour {stats.player_count === 1 ? 'player' : 'players'}
              </motion.p>
            )}
          </div>
        ) : null}
      </div>

      {/* Stat Ribbon — overlaps hero, compact to fit all stats */}
      {stats && (
        <div className="relative z-10 -mt-5 mx-4">
          <motion.div
            className="flex gap-1.5 px-3 py-2.5 rounded-2xl border border-border/40 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <StatPill label="WINS" value={String(stats.wins_total)} highlight={stats.wins_total > 0} />
            <StatPill label="EARNINGS" value={formatCurrency(stats.earnings_total)} />
            <StatPill label="CUTS" value={String(stats.cuts_total)} />
            <StatPill label="TOP 10" value={String(stats.top10_total)} />
            <StatPill label="PLAYERS" value={String(stats.player_count)} />
          </motion.div>
        </div>
      )}

      {/* Content sections */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-8 mt-6 space-y-section">
        {/* Action Buttons — Compare only (follow removed) */}
        {stats && firstRival && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-3"
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleCompareClick}
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </Button>
          </motion.div>
        )}

        {/* Story Strip */}
        {stats && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
          >
            <FranchiseStoryStrip normalizedName={collegeSlug || ''} />
          </motion.div>
        )}

        {/* Rivalries */}
        {stats && rivalSlugs.length > 0 && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Swords className="w-4 h-4 text-[hsl(var(--tab-orange))]" />
              <h2 className="text-[16px] font-semibold text-foreground tracking-tight">Rivals</h2>
            </div>
            <CollegeRivalsCarousel 
              normalizedName={collegeSlug || ''} 
              onCompare={handleRivalCompare}
            />
          </motion.section>
        )}

        {/* Alumni Depth Chart */}
        {stats && (
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className="text-[16px] font-semibold text-foreground mb-2 tracking-tight">
              Alumni Depth Chart
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Current PGA Tour players ranked by contribution
            </p>
            <AlumniDepthChart normalizedName={collegeSlug || ''} />
          </motion.section>
        )}

        {!isLoading && !stats && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">
              No stats found for "{displayName}"
            </p>
            <Link 
              to="/tourhub/college-golf" 
              className="inline-block mt-4 text-primary hover:underline text-sm"
            >
              Browse all colleges
            </Link>
          </div>
        )}

        {/* Data Source */}
        <div className="py-3 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-2 px-4 text-[11px] text-muted-foreground/50">
            <Globe className="w-3.5 h-3.5" />
            <span>Powered by SportsRadar</span>
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

function StatPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex-1 text-center px-1.5 py-2 rounded-lg ${highlight ? 'bg-amber-500/8 border border-amber-500/15' : 'bg-card/60 border border-border/30'}`}>
      <span className="text-[8px] font-semibold tracking-wider uppercase text-muted-foreground/60 block mb-0.5">
        {label}
      </span>
      <span className={`text-[13px] font-bold font-mono tabular-nums block ${highlight ? 'text-amber-500' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}
