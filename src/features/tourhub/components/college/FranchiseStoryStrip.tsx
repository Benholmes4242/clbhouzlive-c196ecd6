/**
 * FranchiseStoryStrip - Three compact tiles showing this week's activity
 * 
 * Tiles:
 * 1. "This week: +$X / +Y wins / +Z cuts"
 * 2. "Top alumnus this week" (highest earner)
 * 3. "Rival you're chasing" (closest rival above)
 */

import { motion } from 'framer-motion';
import { TrendingUp, Star, Target, DollarSign, Trophy, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeWeeklyMovers, useCollegeRivalries } from '../../hooks/useCollegeMovers';
import { useCollegeAlumni } from '../../hooks/useCollegeAlumni';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { Link } from 'react-router-dom';

interface FranchiseStoryStripProps {
  normalizedName: string;
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

interface StoryTileProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  to?: string;
  delay?: number;
}

function StoryTile({ icon: Icon, iconColor, title, value, subtitle, to, delay = 0 }: StoryTileProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "flex flex-col p-3 rounded-xl",
        "bg-card/60 backdrop-blur-sm",
        "border border-border/40",
        to && "hover:border-primary/40 hover:bg-card transition-all cursor-pointer"
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn('w-3.5 h-3.5', iconColor)} />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground leading-tight">
        {value}
      </div>
      {subtitle && (
        <span className="text-[11px] text-muted-foreground mt-1 truncate">
          {subtitle}
        </span>
      )}
    </motion.div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}

export function FranchiseStoryStrip({ normalizedName, className }: FranchiseStoryStripProps) {
  // Get this week's data for this college
  const { data: movers } = useCollegeWeeklyMovers({ limit: 50 });
  const { data: allStats } = useCollegeSeasonStats();
  const { data: rivals } = useCollegeRivalries(normalizedName);
  const { data: alumni } = useCollegeAlumni(normalizedName, { orderBy: 'earnings', limit: 1 });
  const { data: collegeMap } = useCollegeMediaMap();

  // Find this college in movers
  const thisMover = movers?.find(m => m.normalized_name === normalizedName);
  const weekEarnings = thisMover?.earnings_delta || 0;
  const weekWins = thisMover?.wins_delta || 0;
  const weekCuts = thisMover?.cuts_delta || 0;

  // Top alumnus
  const topAlumnus = alumni?.[0];

  // Find closest rival above in earnings
  const myStats = allStats?.find(s => s.normalized_name === normalizedName);
  const rivalNames = rivals?.map(r => r.rivalNormalizedName) || [];
  const rivalAbove = allStats
    ?.filter(s => rivalNames.includes(s.normalized_name) && s.earnings_total > (myStats?.earnings_total || 0))
    .sort((a, b) => a.earnings_total - b.earnings_total)[0];

  const rivalCollege = rivalAbove ? collegeMap?.get(rivalAbove.normalized_name) : null;
  const gapToRival = rivalAbove && myStats 
    ? rivalAbove.earnings_total - myStats.earnings_total 
    : 0;

  // Build week summary
  const weekParts: string[] = [];
  if (weekEarnings > 0) weekParts.push(`+${formatCurrency(weekEarnings)}`);
  if (weekWins > 0) weekParts.push(`${weekWins} win${weekWins > 1 ? 's' : ''}`);
  if (weekCuts > 0) weekParts.push(`${weekCuts} cut${weekCuts > 1 ? 's' : ''}`);
  const weekSummary = weekParts.length > 0 ? weekParts.join(' · ') : 'No activity';

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {/* This Week */}
      <StoryTile
        icon={TrendingUp}
        iconColor="text-emerald-500"
        title="This Week"
        value={weekSummary}
        delay={0}
      />

      {/* Top Alumnus */}
      <StoryTile
        icon={Star}
        iconColor="text-amber-500"
        title="Top Performer"
        value={topAlumnus ? `${topAlumnus.first_name} ${topAlumnus.last_name.charAt(0)}.` : '—'}
        subtitle={topAlumnus?.earnings ? formatCurrency(topAlumnus.earnings) : undefined}
        to={topAlumnus ? `/tourhub/player/${topAlumnus.id}` : undefined}
        delay={0.05}
      />

      {/* Rival Chasing */}
      <StoryTile
        icon={Target}
        iconColor="text-primary"
        title="Chasing"
        value={rivalCollege?.short_name || rivalCollege?.college_name || '—'}
        subtitle={gapToRival > 0 ? `${formatCurrency(gapToRival)} gap` : undefined}
        to={rivalAbove ? `/tourhub/college-golf/${rivalAbove.normalized_name}` : undefined}
        delay={0.1}
      />
    </div>
  );
}
