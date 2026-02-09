/**
 * TourIntelligenceSnapshot — "What Wins Right Now"
 * Shows 3 dimension cards: Power, Precision, Short Game
 * Uses existing useSeasonLeaderboards data
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Target, Sparkles } from 'lucide-react';
import { useSeasonLeaderboards, type CategoryId } from '../../hooks/useSeasonLeaderboards';

interface DimensionConfig {
  label: string;
  icon: typeof Zap;
  categoryId: CategoryId;
  contextLine: string;
}

const DIMENSIONS: DimensionConfig[] = [
  {
    label: 'Power',
    icon: Zap,
    categoryId: 'distance',
    contextLine: 'Critical at long, demanding venues',
  },
  {
    label: 'Precision',
    icon: Target,
    categoryId: 'accuracy',
    contextLine: 'Key stat on tight fairways',
  },
  {
    label: 'Short Game',
    icon: Sparkles,
    categoryId: 'scrambling',
    contextLine: 'Separates winners around the green',
  },
];

export function TourIntelligenceSnapshot() {
  const navigate = useNavigate();
  const { data, isLoading } = useSeasonLeaderboards();

  const cards = useMemo(() => {
    if (!data?.categories) return [];

    return DIMENSIONS.map(dim => {
      const cat = data.categories.find(c => c.id === dim.categoryId);
      if (!cat || cat.players.length === 0) return null;

      const leader = cat.players[0];
      return {
        ...dim,
        playerName: leader.playerName,
        value: leader.statDisplayValue,
        unit: leader.statUnit,
        tourAvg: cat.topTenAverage,
        formatAvg: cat.id === 'distance'
          ? cat.topTenAverage.toFixed(1)
          : cat.topTenAverage.toFixed(1),
      };
    }).filter(Boolean);
  }, [data]);

  if (isLoading || cards.length === 0) return null;

  return (
    <motion.section
      className="px-4"
      style={{ paddingTop: '40px' }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">What Wins Right Now</h2>
        <button
          onClick={() => navigate('/tourhub?tab=leaderboards')}
          className="text-sm font-medium text-blue-600"
        >
          View All →
        </button>
      </div>

      {/* 3 Dimension cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card: any, idx: number) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.categoryId}
              onClick={() => navigate('/tourhub?tab=leaderboards')}
              className="bg-white rounded-2xl p-4 text-left border border-gray-100 transition-all active:scale-[0.98]"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              {/* Icon + Label */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {card.label}
                </span>
              </div>

              {/* Leader */}
              <p className="text-sm font-semibold text-gray-900 mb-0.5">{card.playerName}</p>

              {/* Stat value vs avg */}
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-900">{card.value}{card.unit && ` ${card.unit}`}</span>
                {' '}vs {card.formatAvg} avg
              </p>

              {/* Context */}
              <p className="text-[11px] text-gray-400 mt-1.5">{card.contextLine}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
