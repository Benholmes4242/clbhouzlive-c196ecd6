/**
 * FranchiseStoryStrip - Two compact tiles: This Week + Top Performer
 */

import { motion } from 'framer-motion';
import { TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeWeeklyMovers } from '../../hooks/useCollegeMovers';
import { useCollegeAlumni } from '../../hooks/useCollegeAlumni';
import { Link } from 'react-router-dom';

interface FranchiseStoryStripProps {
  normalizedName: string;
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount.toFixed(0)}`;
}

interface StoryTileProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  to?: string;
  delay?: number;
}

function StoryTile({ icon: Icon, iconColor, title, children, to, delay = 0 }: StoryTileProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "flex flex-col rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "bg-card border border-border/50",
        to && "hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
      )}
      style={{ padding: '16px' }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn('text-muted-foreground/50')} style={{ width: '14px', height: '14px' }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.8px',
          textTransform: 'uppercase' as const,
        }} className="text-muted-foreground/50">
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return content;
}

function StoryTileSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex flex-col p-4 rounded-2xl bg-card border border-border/50"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-3.5 h-3.5 rounded bg-muted animate-pulse" />
        <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-4 w-20 bg-muted rounded animate-pulse mb-1" />
      <div className="h-3 w-14 bg-muted rounded animate-pulse" />
    </motion.div>
  );
}

export function FranchiseStoryStrip({ normalizedName, className }: FranchiseStoryStripProps) {
  const { data: movers, isLoading: moversLoading } = useCollegeWeeklyMovers({ limit: 50 });
  const { data: alumni, isLoading: alumniLoading } = useCollegeAlumni(normalizedName, { orderBy: 'earnings', limit: 1 });

  const isLoading = moversLoading || alumniLoading;

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        <StoryTileSkeleton delay={0} />
        <StoryTileSkeleton delay={0.05} />
      </div>
    );
  }

  // Find this college in movers
  const thisMover = movers?.find(m => m.normalized_name === normalizedName);
  const weekEarnings = thisMover?.earnings_delta || 0;
  const weekWins = thisMover?.wins_delta || 0;
  const weekTop10s = thisMover?.top10_delta || 0;

  // Top alumnus
  const topAlumnus = alumni?.[0];

  // Build week summary
  const weekParts: string[] = [];
  if (weekEarnings > 0) weekParts.push(`+${formatCurrency(weekEarnings)}`);
  if (weekWins > 0) weekParts.push(`${weekWins} win${weekWins > 1 ? 's' : ''}`);
  if (weekTop10s > 0) weekParts.push(`${weekTop10s} top 10${weekTop10s > 1 ? 's' : ''}`);
  const weekSummary = weekParts.length > 0 ? weekParts.join(' · ') : 'No activity';

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {/* This Week */}
      <StoryTile icon={TrendingUp} iconColor="text-emerald-500" title="This Week" delay={0}>
        <span className="text-foreground leading-tight" style={{ fontSize: '15px', fontWeight: 600, marginTop: '6px' }}>{weekSummary}</span>
      </StoryTile>

      {/* Top Performer */}
      <StoryTile
        icon={Star}
        iconColor="text-amber-500"
        title="Top Performer"
        to={topAlumnus ? `/tourhub/player/${topAlumnus.id}` : undefined}
        delay={0.05}
      >
        <span className="text-foreground leading-tight truncate" style={{ fontSize: '15px', fontWeight: 600, marginTop: '6px' }}>
          {topAlumnus ? `${topAlumnus.first_name} ${topAlumnus.last_name}` : 'No data'}
        </span>
        {topAlumnus && (
          <span className="text-muted-foreground truncate" style={{ fontSize: '12px', fontWeight: 400, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
            {topAlumnus.earnings ? formatCurrency(topAlumnus.earnings) : ''}
            {topAlumnus.wins ? ` · ${topAlumnus.wins} win${topAlumnus.wins > 1 ? 's' : ''}` : ''}
            {topAlumnus.world_ranking && topAlumnus.world_ranking < 500 ? ` · #${topAlumnus.world_ranking} OWGR` : ''}
          </span>
        )}
      </StoryTile>
    </div>
  );
}
