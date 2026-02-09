/**
 * TourTitles — Gamified category leader "title belts"
 * Shows 3-4 titles in horizontal scroll, each held by one player
 * Uses existing useSeasonLeaderboards data
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Target, Flame, Crown } from 'lucide-react';
import { useSeasonLeaderboards, type CategoryId } from '../../hooks/useSeasonLeaderboards';

interface TitleConfig {
  title: string;
  icon: typeof Trophy;
  categoryId: CategoryId;
  iconColor: string;
  iconBg: string;
}

const ALL_TITLES: TitleConfig[] = [
  { title: 'Longest Hitter', icon: Trophy, categoryId: 'distance', iconColor: '#D97706', iconBg: 'rgba(217,119,6,0.1)' },
  { title: 'Fairway Sniper', icon: Target, categoryId: 'accuracy', iconColor: '#2563EB', iconBg: 'rgba(37,99,235,0.1)' },
  { title: 'Hot Putter', icon: Flame, categoryId: 'putting', iconColor: '#DC2626', iconBg: 'rgba(220,38,38,0.1)' },
  { title: 'SG King', icon: Crown, categoryId: 'sg_total', iconColor: '#7C3AED', iconBg: 'rgba(124,58,237,0.1)' },
];

export function TourTitles() {
  const navigate = useNavigate();
  const { data, isLoading } = useSeasonLeaderboards();

  // Build title cards from data
  const titles = useMemo(() => {
    if (!data?.categories) return [];

    return ALL_TITLES.map(cfg => {
      const cat = data.categories.find(c => c.id === cfg.categoryId);
      if (!cat || cat.players.length === 0) return null;

      const holder = cat.players[0];
      const runnerUp = cat.players[1];
      
      // Determine threat status
      let status = 'Current leader';
      if (holder && runnerUp) {
        const gap = Math.abs(holder.statValue - runnerUp.statValue);
        const pctGap = (gap / Math.abs(holder.statValue)) * 100;
        if (pctGap < 1) {
          status = 'Under threat this week';
        }
      }

      return {
        ...cfg,
        holderName: holder.playerName,
        statValue: holder.statDisplayValue,
        statUnit: holder.statUnit,
        status,
      };
    }).filter(Boolean);
  }, [data]);

  if (isLoading || titles.length === 0) return null;

  // Show 3–4 titles (rotate by week)
  const weekOfYear = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const startIdx = (weekOfYear % Math.max(1, titles.length - 2));
  const visibleTitles = titles.slice(0, 4);

  return (
    <motion.section
      style={{ paddingTop: '40px' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-gray-900">Tour Titles</h2>
        <button
          onClick={() => navigate('/tourhub?tab=leaderboards')}
          className="text-sm font-medium text-blue-600"
        >
          View All →
        </button>
      </div>

      {/* Horizontal scroll cards */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {visibleTitles.map((title: any, idx: number) => {
          const Icon = title.icon;
          return (
            <motion.button
              key={title.categoryId}
              onClick={() => navigate('/tourhub?tab=leaderboards')}
              className="flex-shrink-0 bg-white rounded-2xl p-4 text-left border border-gray-100 active:scale-[0.98] transition-transform"
              style={{
                width: '200px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                scrollSnapAlign: 'start',
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: title.iconBg }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: title.iconColor }} />
              </div>

              {/* Title */}
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                {title.title}
              </p>

              {/* Holder name */}
              <p className="text-sm font-bold text-gray-900 mb-0.5 truncate">
                {title.holderName}
              </p>

              {/* Stat value */}
              <p className="text-xs font-mono font-medium text-gray-600">
                {title.statValue}{title.statUnit && ` ${title.statUnit}`}
              </p>

              {/* Status */}
              <p className="text-[10px] mt-2" style={{
                color: title.status.includes('threat') ? '#DC2626' : '#9CA3AF',
                fontWeight: title.status.includes('threat') ? 600 : 400,
              }}>
                {title.status}
              </p>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
