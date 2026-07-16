/**
 * TrophyCase - Earned milestones/regions grid.
 */


import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CLUB_STEPS } from '@/lib/top100Club';
import { QuestEmptyState } from '@/components/quest/QuestEmptyState';
import { Trophy } from 'lucide-react';

import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

import gbiBadgeImage from '@/assets/badges/gbi-badge.png';
import europeBadgeImage from '@/assets/badges/europe-badge.png';
import usaBadgeImage from '@/assets/badges/usa-badge.png';
import globalBadgeImage from '@/assets/badges/global-badge.png';

type FilterMode = 'milestones' | 'regions';

interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface TrophyCaseProps {
  totalPlayed: number;
  regionProgress: RegionProgress[];
  onBadgeClick?: (badge: { type: 'milestone' | 'region'; id: string; threshold?: number }) => void;
}

const BADGE_IMAGES: Record<number, string> = {
  5: rookieBadgeImage,
  10: fairwayBadgeImage,
  20: foundersBadgeImage,
  50: heritageBadgeImage,
  100: centuryBadgeImage,
  200: eliteBadgeImage,
  300: legendaryBadgeImage,
  400: grandslamBadgeImage,
};

const CLUB_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

const REGION_BADGE_IMAGES: Record<string, string> = {
  'gb-i': gbiBadgeImage,
  'europe': europeBadgeImage,
  'usa': usaBadgeImage,
  'global': globalBadgeImage,
};

const REGION_NAMES: Record<string, string> = {
  'gb-i': 'GB&I Top 100',
  'europe': 'Europe Top 100',
  'usa': 'USA Top 100',
  'global': 'Global Top 100',
};

export const TrophyCase: React.FC<TrophyCaseProps> = ({
  totalPlayed,
  regionProgress,
  onBadgeClick,
}) => {
  const { t } = useTranslation('achievements');
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterMode>('milestones');

  const milestones = useMemo(() => {
    return CLUB_STEPS.map(step => ({
      threshold: step.threshold,
      name: CLUB_NAMES[step.threshold] || `${step.threshold} Club`,
      tierName: step.tierName,
      isUnlocked: totalPlayed >= step.threshold,
    }));
  }, [totalPlayed]);

  let lastEarnedIndex = -1;
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (milestones[i].isUnlocked) { lastEarnedIndex = i; break; }
  }
  const nextMilestoneIndex = milestones.findIndex(m => !m.isUnlocked);

  const visibleMilestones = useMemo(() => {
    return milestones.filter((m, i) => {
      if (m.isUnlocked) return true;
      return i <= lastEarnedIndex + 3;
    });
  }, [milestones, lastEarnedIndex]);

  const regions = useMemo(() => {
    return regionProgress.map(r => ({
      ...r,
      isUnlocked: r.played >= r.total && r.total > 0,
    }));
  }, [regionProgress]);

  const showMilestones = filter === 'milestones';
  const hasAnyMilestones = visibleMilestones.length > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>{t('quest.trophy.overline')}</span>
          </div>
          <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>{t('quest.trophy.title')}</h2>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-full" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
          <button
            onClick={() => setFilter('milestones')}
            className={cn(
              "px-3 min-h-[44px] text-xs font-medium rounded-full transition-all duration-200 active:scale-[0.98]",
              filter === 'milestones'
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={filter === 'milestones' ? { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' } : undefined}
          >
            {t('quest.trophy.filterMilestones')}
          </button>
          <button
            onClick={() => setFilter('regions')}
            className={cn(
              "px-3 min-h-[44px] text-xs font-medium rounded-full transition-all duration-200 active:scale-[0.98]",
              filter === 'regions'
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={filter === 'regions' ? { background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' } : undefined}
          >
            {t('quest.trophy.filterRegions')}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showMilestones ? (
          !hasAnyMilestones ? (
            <QuestEmptyState
              key="milestones-empty"
              icon={<Trophy className="w-7 h-7 text-muted-foreground" />}
              title={t('quest.trophy.emptyTitle')}
              description={t('quest.trophy.emptyDescription')}
              action={{
                label: t('quest.trophy.emptyCta'),
                onClick: () => navigate('/courses?tab=top100'),
              }}
            />
          ) : (
            <motion.div
              key="milestones"
              className="flex flex-wrap justify-center gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {visibleMilestones.map((m, index) => {
                const isNext = index === nextMilestoneIndex;
                const remaining = m.threshold - totalPlayed;

                return (
                  <motion.button
                    key={m.threshold}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onClick={() => onBadgeClick?.({ type: 'milestone', id: String(m.threshold), threshold: m.threshold })}
                    className="flex flex-col items-center group active:scale-[0.97]"
                  >
                    <div className="relative mb-2">
                      {m.isUnlocked && (
                        <div className="absolute inset-0 rounded-full blur-md scale-110" style={{ background: 'rgba(247,147,30,0.15)' }} />
                      )}
                      {isNext && !m.isUnlocked && (
                        <div
                          className="absolute inset-[-4px] border-2 animate-pulse pointer-events-none"
                          style={{ borderColor: 'rgba(247,147,30,0.60)', borderRadius: 14 }}
                        />
                      )}
                      <img
                        src={BADGE_IMAGES[m.threshold]}
                        alt={m.name}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          "object-contain transition-transform duration-200 group-hover:scale-105",
                          m.isUnlocked
                            ? "w-[88px] h-[110px] drop-shadow-md"
                            : isNext
                              ? "w-[88px] h-[110px] opacity-75 grayscale-[30%]"
                              : "w-[72px] h-[90px] opacity-40 grayscale-[60%]"
                        )}
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-semibold text-center transition-colors",
                      m.isUnlocked ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {m.name}
                    </span>
                    {m.isUnlocked && (
                      <span className="flex items-center gap-1 text-xs font-semibold mt-0.5" style={{ color: '#10B981' }}>
                        <span
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-white"
                          style={{ background: '#10B981', fontSize: 9, lineHeight: 1 }}
                        >
                          {'✓'}
                        </span>
                        {t('quest.trophy.earned')}
                      </span>
                    )}
                    {!m.isUnlocked && isNext && (
                      <span className="text-xs font-semibold tabular-nums mt-0.5" style={{ color: '#F7931E' }}>
                        {t('quest.trophy.awayCount', { count: remaining })}
                      </span>
                    )}
                    {!m.isUnlocked && !isNext && (
                      <span className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {t('quest.trophy.playedFraction', { played: totalPlayed, total: m.threshold })}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )
        ) : (
          <motion.div
            key="regions"
            className="flex flex-wrap justify-center gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {regions.map((r, index) => {
              const badgeImage = REGION_BADGE_IMAGES[r.id];
              const regionName = REGION_NAMES[r.id] || r.name;

              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => onBadgeClick?.({ type: 'region', id: r.id })}
                  className="flex flex-col items-center group active:scale-[0.97]"
                >
                  <div className="relative mb-2">
                    {r.isUnlocked && (
                      <div className="absolute inset-0 rounded-full blur-md scale-110" style={{ background: 'rgba(247,147,30,0.15)' }} />
                    )}
                    <img
                      src={badgeImage}
                      alt={regionName}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        "w-[88px] h-[88px] object-contain transition-transform duration-200 group-hover:scale-105",
                        !r.isUnlocked && "opacity-40 grayscale-[60%]"
                      )}
                    />
                  </div>

                  <span className={cn(
                    "text-xs font-semibold text-center transition-colors max-w-[100px]",
                    r.isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {regionName}
                  </span>
                  {!r.isUnlocked && (
                    <span className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {t('quest.trophy.playedFraction', { played: r.played, total: r.total })}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default TrophyCase;
