import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  TrendingDown,
  Award,
  Map as MapIcon,
  Calendar,
  Star,
} from 'lucide-react';
import { useAllScores, useHandicapHistory } from '@/lib/whs/hooks';
import { computeAchievements } from '@/lib/whs/achievements';
import type { Achievement } from '@/lib/whs/types';

interface Props {
  connectionId: string;
  connectionCreatedAt: string | null;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Flame,
  TrendingDown,
  Award,
  Map: MapIcon,
  Calendar,
};

const Card: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.icon_name] ?? Star;
  const accent = a.highlight ? '#F7931E' : '#64748B';
  return (
    <motion.div
      initial={a.highlight ? { scale: 0.85, opacity: 0 } : { opacity: 0, y: 6 }}
      animate={a.highlight ? { scale: [0.85, 1.05, 1], opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-shrink-0 w-[140px] rounded-xl border p-3 bg-background"
      style={{
        borderColor: a.highlight ? 'rgba(247,147,30,0.4)' : 'rgba(15,23,42,0.08)',
        background: a.highlight
          ? 'linear-gradient(135deg, rgba(247,147,30,0.06), rgba(247,147,30,0.01))'
          : undefined,
        scrollSnapAlign: 'start',
      }}
    >
      <Icon className="w-6 h-6 mb-2" style={{ color: accent }} />
      <p className="text-[14px] font-bold text-foreground leading-tight">{a.title}</p>
      <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">{a.subtitle}</p>
      <p className="text-[11px] text-muted-foreground mt-2">
        {format(new Date(a.achieved_at), 'd MMM yyyy')}
      </p>
    </motion.div>
  );
};

export const AchievementsStrip: React.FC<Props> = ({ connectionId, connectionCreatedAt }) => {
  const { data: scores, isLoading: sLoading } = useAllScores(connectionId);
  // Pull a wide history window for milestone detection (1y)
  const { data: history, isLoading: hLoading } = useHandicapHistory(connectionId, 365);

  const achievements = useMemo<Achievement[]>(() => {
    if (!scores || !history) return [];
    return computeAchievements({
      scores,
      history,
      connectionCreatedAt,
    });
  }, [scores, history, connectionCreatedAt]);

  const isLoading = sLoading || hLoading;

  if (!isLoading && achievements.length === 0) return null;

  const hasNew = achievements.some((a) => a.highlight);

  return (
    <section className="mb-6">
      <div className="px-5 flex items-end justify-between mb-2">
        <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2">
          Achievements
          {hasNew && (
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
              style={{ background: '#F7931E', color: '#fff' }}
            >
              New
            </span>
          )}
        </h3>
      </div>
      <div
        className="flex gap-3 px-5 pt-2 pb-2 overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          willChange: 'transform',
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[140px] h-[110px] rounded-xl bg-muted/60 animate-pulse"
              />
            ))
          : achievements.map((a) => <Card key={a.id} a={a} />)}
      </div>
    </section>
  );
};

export default AchievementsStrip;
