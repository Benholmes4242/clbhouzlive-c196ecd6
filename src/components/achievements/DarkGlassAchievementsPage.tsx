/**
 * Dark Glass Achievements Page
 * 
 * Premium dark glass redesign matching Profile and Quest aesthetic.
 * One page, two systems: Milestone Clubs + Top 100 List Completions.
 */

import React from 'react';
import { ChevronLeft, Trophy, MapPin, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { 
  MILESTONE_ACHIEVEMENTS, 
  LIST_ACHIEVEMENTS,
} from '@/lib/achievementDefinitions';
import { getTop100Club, getNextTop100Club } from '@/lib/top100Club';
import { 
  MILESTONE_THEMES,
  REGION_THEMES,
  MilestoneTier,
  RegionKey,
} from '@/lib/globalAchievementMilestoneSystem';
import { DEBUG_UNLOCK_ALL_ACHIEVEMENTS, DEBUG_ACHIEVEMENTS_USER_EMAIL } from '@/utils/featureFlags';
import { cn } from '@/lib/utils';
import { PageRoot } from '@/components/layout/PageRoot';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DARK GLASS STYLES
// ═══════════════════════════════════════════════════════════════════════════════════════════

const DARK_GLASS_BG = 'rgba(0, 0, 0, 0.65)';
const DARK_GLASS_CARD = 'rgba(255, 255, 255, 0.06)';
const DARK_GLASS_CARD_HOVER = 'rgba(255, 255, 255, 0.10)';
const DARK_GLASS_BORDER = 'rgba(255, 255, 255, 0.08)';
const CALM_TRANSITION = 'all 220ms cubic-bezier(0.4, 0.0, 0.2, 1)';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HERO PROGRESS BLOCK
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface HeroProgressBlockProps {
  totalPlayed: number;
  totalCourses: number;
}

const HeroProgressBlock: React.FC<HeroProgressBlockProps> = ({ totalPlayed, totalCourses }) => {
  return (
    <div 
      className="rounded-sq-lg p-6 md:p-8 relative overflow-hidden"
      style={{
        background: DARK_GLASS_CARD,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${DARK_GLASS_BORDER}`,
      }}
    >
      {/* Soft gold glow behind trophy */}
      <div 
        className="absolute top-4 left-4 w-16 h-16 rounded-full opacity-30 blur-xl"
        style={{ background: 'radial-gradient(circle, #D4A857 0%, transparent 70%)' }}
      />
      
      <div className="flex items-center gap-4">
        {/* Trophy icon with soft glow */}
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center relative"
          style={{ 
            background: 'rgba(212, 168, 87, 0.15)',
            boxShadow: '0 0 24px rgba(212, 168, 87, 0.25)',
          }}
        >
          <Trophy className="w-7 h-7 text-amber-400/90" strokeWidth={1.5} />
        </div>
        
        <div className="flex-1">
          {/* Large stat */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {totalPlayed}
            </span>
            <span className="text-lg text-white/50 font-medium">
              / {totalCourses}
            </span>
          </div>
          
          {/* Label */}
          <p className="text-sm text-white/60 mt-1">
            Top 100 Courses Played
          </p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// NEXT TARGET SECTION
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface NextTargetCardProps {
  nextClub: { threshold: number; tierName: string } | null;
  currentPlayed: number;
  hasClub: boolean;
}

const NextTargetCard: React.FC<NextTargetCardProps> = ({ nextClub, currentPlayed, hasClub }) => {
  if (!nextClub) return null;
  
  const remaining = nextClub.threshold - currentPlayed;
  const prevThreshold = hasClub ? getPreviousThreshold(nextClub.threshold) : 0;
  const gapSize = nextClub.threshold - prevThreshold;
  const progressInGap = currentPlayed - prevThreshold;
  const progressPercent = gapSize > 0 ? Math.min(100, (progressInGap / gapSize) * 100) : 0;
  
  const theme = MILESTONE_THEMES[nextClub.threshold as MilestoneTier];
  
  return (
    <div 
      className="rounded-sq-lg p-5 relative overflow-hidden"
      style={{
        background: DARK_GLASS_CARD,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${DARK_GLASS_BORDER}`,
      }}
    >
      {/* Label */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-3">
        Next Target
      </p>
      
      {/* Milestone name */}
      <h3 className="text-xl font-semibold text-white mb-1">
        {nextClub.tierName}
      </h3>
      
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-4 mb-3">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progressPercent}%`,
            background: theme 
              ? `linear-gradient(90deg, ${theme.bgLight}, ${theme.bgDark})`
              : 'linear-gradient(90deg, #22c55e, #16a34a)',
            boxShadow: '0 0 12px rgba(34, 197, 94, 0.4)',
          }}
        />
      </div>
      
      {/* Progress text */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">
          {currentPlayed} / {nextClub.threshold} courses
        </span>
        <span className="text-white/50">
          {remaining} to go
        </span>
      </div>
    </div>
  );
};

function getPreviousThreshold(current: number): number {
  const thresholds = [0, 5, 10, 20, 50, 100, 200, 300, 400];
  const idx = thresholds.indexOf(current);
  return idx > 0 ? thresholds[idx - 1] : 0;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE BADGE CARD (Dark Glass)
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface DarkMilestoneBadgeProps {
  threshold: number;
  label: string;
  shortLabel: string;
  unlocked: boolean;
  remaining?: number;
  isCurrent?: boolean;
}

const DarkMilestoneBadge: React.FC<DarkMilestoneBadgeProps> = ({
  threshold,
  label,
  shortLabel,
  unlocked,
  remaining,
  isCurrent,
}) => {
  const theme = MILESTONE_THEMES[threshold as MilestoneTier];
  
  return (
    <div
      className={cn(
        "rounded-sq-md p-4 relative overflow-hidden cursor-pointer",
        "transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        "active:scale-[0.98]"
      )}
      style={{
        background: unlocked 
          ? `linear-gradient(135deg, ${theme?.bgLight}20 0%, ${theme?.bgDark}15 100%)`
          : DARK_GLASS_CARD,
        backdropFilter: 'blur(8px)',
        border: unlocked 
          ? `1px solid ${theme?.bgLight}40`
          : `1px solid ${DARK_GLASS_BORDER}`,
        opacity: unlocked ? 1 : 0.35,
      }}
    >
      {/* Subtle glow for unlocked */}
      {unlocked && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top left, ${theme?.bgLight}40, transparent 60%)`,
          }}
        />
      )}
      
      {/* Trophy icon */}
      <div 
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mb-3",
        )}
        style={{ 
          background: unlocked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        }}
      >
        <Trophy 
          className="w-5 h-5"
          style={{ color: unlocked ? '#fff' : 'rgba(255,255,255,0.4)' }}
          strokeWidth={1.5}
        />
      </div>
      
      {/* Club name */}
      <h4 className={cn(
        "text-sm font-semibold mb-0.5",
        unlocked ? "text-white" : "text-white/40"
      )}>
        {shortLabel}
      </h4>
      
      {/* Subtitle */}
      <p className={cn(
        "text-xs",
        unlocked ? "text-white/60" : "text-white/30"
      )}>
        {label}
      </p>
      
      {/* Status indicator */}
      <div className="mt-3">
        {unlocked ? (
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unlocked</span>
          </div>
        ) : remaining !== undefined && (
          <span className="text-xs text-white/30">
            {remaining} away
          </span>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TOP 100 LIST JOURNEY CARD
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface ListJourneyCardProps {
  regionKey: RegionKey;
  label: string;
  played: number;
  total: number;
  slug: string;
}

const ListJourneyCard: React.FC<ListJourneyCardProps> = ({
  regionKey,
  label,
  played,
  total,
  slug,
}) => {
  const navigate = useNavigate();
  const theme = REGION_THEMES[regionKey];
  const isComplete = played >= total && total > 0;
  const progressPercent = total > 0 ? Math.min(100, (played / total) * 100) : 0;
  
  const handleClick = () => {
    navigate(`/top100/${slug}`);
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full rounded-sq-md p-4 text-left relative overflow-hidden",
        "transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        "active:scale-[0.99] hover:bg-white/[0.08]"
      )}
      style={{
        background: DARK_GLASS_CARD,
        backdropFilter: 'blur(8px)',
        border: `1px solid ${DARK_GLASS_BORDER}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        {/* Region name + icon */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${theme.bgLight}30, ${theme.bgDark}20)`,
            }}
          >
            <MapPin 
              className="w-5 h-5" 
              style={{ color: theme.bgLight }}
              strokeWidth={1.5}
            />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">
              {label}
            </h4>
            <p className="text-xs text-white/50">
              {played} / {total} courses
            </p>
          </div>
        </div>
        
        {/* Status chip + chevron */}
        <div className="flex items-center gap-2">
          <span 
            className={cn(
              "px-2.5 py-1 rounded-sq-xs text-[10px] font-medium uppercase tracking-wide",
              isComplete 
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-white/10 text-white/50"
            )}
          >
            {isComplete ? 'Complete' : 'In Progress'}
          </span>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${theme.bgLight}, ${theme.bgDark})`,
          }}
        />
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════════════

const DarkGlassAchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);
  
  const isLoading = sessionLoading || profileLoading || progressLoading;
  
  // Debug mode
  const isDebugUser = DEBUG_UNLOCK_ALL_ACHIEVEMENTS && user?.email === DEBUG_ACHIEVEMENTS_USER_EMAIL;
  const totalTop100Played = isDebugUser ? 400 : (progressData?.totalTop100Played ?? 0);
  
  const currentClub = getTop100Club(totalTop100Played);
  const nextClub = getNextTop100Club(totalTop100Played);
  const hasClub = totalTop100Played >= 5;
  
  // Calculate total unique courses across all lists
  const totalUniqueCourses = progressData?.lists?.reduce((sum, l) => sum + l.total, 0) ?? 400;
  
  const handleBack = () => {
    navigate(-1);
  };
  
  // Map list IDs to region keys and slugs
  const listRegionMap: Record<string, { key: RegionKey; slug: string }> = {
    'list_gb_ireland': { key: 'GBI', slug: 'gb-i' },
    'list_europe': { key: 'EUROPE', slug: 'europe' },
    'list_usa': { key: 'USA', slug: 'usa' },
    'list_worldwide': { key: 'WORLD', slug: 'global' },
  };
  
  return (
    <PageRoot 
      className="min-h-screen"
      style={{
        background: DARK_GLASS_BG,
        backdropFilter: 'blur(18px)',
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white/80" />
        </button>
        
        <h1 className="text-lg font-semibold text-white">
          Achievements
        </h1>
        
        {/* Placeholder for future share/replay */}
        <div className="w-10" />
      </header>
      
      {/* Content */}
      <div className="px-4 pb-24 space-y-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Hero Progress Block */}
            <HeroProgressBlock 
              totalPlayed={totalTop100Played}
              totalCourses={100}
            />
            
            {/* Next Target */}
            {nextClub && (
              <NextTargetCard 
                nextClub={nextClub}
                currentPlayed={totalTop100Played}
                hasClub={hasClub}
              />
            )}
            
            {/* Milestone Clubs Section */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-4">
                Milestone Clubs
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                {MILESTONE_ACHIEVEMENTS.map((milestone) => {
                  const threshold = milestone.threshold ?? 0;
                  const isUnlocked = isDebugUser ? true : totalTop100Played >= threshold;
                  const isCurrent = currentClub?.threshold === threshold;
                  const remaining = Math.max(0, threshold - totalTop100Played);
                  
                  return (
                    <DarkMilestoneBadge
                      key={milestone.id}
                      threshold={threshold}
                      label={milestone.label}
                      shortLabel={milestone.shortLabel}
                      unlocked={isUnlocked}
                      remaining={isUnlocked ? undefined : remaining}
                      isCurrent={isCurrent}
                    />
                  );
                })}
              </div>
            </section>
            
            {/* Top 100 Lists Section */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-4">
                Top 100 Lists
              </h2>
              
              <div className="space-y-3">
                {LIST_ACHIEVEMENTS.map((list) => {
                  const mapping = listRegionMap[list.id];
                  if (!mapping) return null;
                  
                  const listSlugMap: Record<string, string> = {
                    'list_gb_ireland': 'gb-i',
                    'list_europe': 'europe',
                    'list_usa': 'usa',
                    'list_worldwide': 'global',
                  };
                  const slug = listSlugMap[list.id];
                  const listProgress = progressData?.lists?.find(l => l.listSlug === slug);
                  const played = listProgress?.played ?? 0;
                  const total = listProgress?.total ?? 100;
                  
                  return (
                    <ListJourneyCard
                      key={list.id}
                      regionKey={mapping.key}
                      label={list.label.replace(' Top 100', '')}
                      played={played}
                      total={total}
                      slug={mapping.slug}
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </PageRoot>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════════════════════

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Hero skeleton */}
    <div 
      className="rounded-sq-lg p-6 h-28"
      style={{ background: DARK_GLASS_CARD }}
    />
    
    {/* Next target skeleton */}
    <div 
      className="rounded-sq-lg p-5 h-32"
      style={{ background: DARK_GLASS_CARD }}
    />
    
    {/* Milestone grid skeleton */}
    <div>
      <div className="h-3 w-32 rounded bg-white/10 mb-4" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i}
            className="rounded-sq-md p-4 h-32"
            style={{ background: DARK_GLASS_CARD }}
          />
        ))}
      </div>
    </div>
    
    {/* Lists skeleton */}
    <div>
      <div className="h-3 w-28 rounded bg-white/10 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className="rounded-sq-md p-4 h-20"
            style={{ background: DARK_GLASS_CARD }}
          />
        ))}
      </div>
    </div>
  </div>
);

export default DarkGlassAchievementsPage;
