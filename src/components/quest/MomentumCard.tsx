/**
 * MomentumCard - Weekly momentum display.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Flame } from 'lucide-react';
import { formatDayMonthShortGB } from '@/i18n/format';

interface MomentumCardProps {
  recentlyPlayed: {
    id: string;
    name: string;
    dateAdded?: string;
  }[];
  suggestedRegion?: string;
}

export const MomentumCard: React.FC<MomentumCardProps> = ({
  recentlyPlayed,
  suggestedRegion,
}) => {
  const { t } = useTranslation('achievements');

  const { lastCourseDate, thisMonthCount, lastMonthCount, hasActivity } = useMemo(() => {
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
      return { lastCourseDate: null, thisMonthCount: 0, lastMonthCount: 0, hasActivity: false };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let latestDate: Date | null = null;
    let monthCount = 0;
    let prevMonthCount = 0;

    for (const course of recentlyPlayed) {
      if (!course.dateAdded) continue;

      const parts = course.dateAdded.split(' ');
      if (parts.length !== 2) continue;

      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];

      const monthMap: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      };

      const month = monthMap[monthStr];
      if (month === undefined || isNaN(day)) continue;

      let year = currentYear;
      if (month > currentMonth) {
        year = currentYear - 1;
      }

      const courseDate = new Date(year, month, day);

      if (!latestDate || courseDate > latestDate) {
        latestDate = courseDate;
      }

      if (courseDate.getMonth() === currentMonth && courseDate.getFullYear() === currentYear) {
        monthCount++;
      }
      if (courseDate.getMonth() === lastMonth && courseDate.getFullYear() === lastMonthYear) {
        prevMonthCount++;
      }
    }

    return {
      lastCourseDate: latestDate,
      thisMonthCount: monthCount,
      lastMonthCount: prevMonthCount,
      hasActivity: latestDate !== null,
    };
  }, [recentlyPlayed]);

  const formatLastDate = (date: Date | null): string => {
    if (!date) return t('quest.momentum.dateNever');

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('quest.momentum.dateToday');
    if (diffDays === 1) return t('quest.momentum.dateYesterday');
    if (diffDays < 7) return t('quest.momentum.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('quest.momentum.weeksAgo', { count: Math.floor(diffDays / 7) });

    return formatDayMonthShortGB(date);
  };

  const delta = thisMonthCount - lastMonthCount;
  const deltaSign = delta > 0 ? '+' : '';

  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>{t('quest.momentum.overline')}</span>
        </div>
        <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900, letterSpacing: '-0.01em' }}>{t('quest.momentum.title')}</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {hasActivity ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(110, 146, 119, 0.1)',
                  border: '1px solid rgba(110, 146, 119, 0.2)',
                }}
              >
                <Calendar className="w-4 h-4" style={{ color: 'var(--quest-accent-green)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('quest.momentum.lastLogged')}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatLastDate(lastCourseDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(210, 180, 97, 0.1)',
                  border: '1px solid rgba(210, 180, 97, 0.2)',
                }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--quest-accent-gold)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('quest.momentum.thisMonth')}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {t('quest.momentum.courses', { count: thisMonthCount })}
                  </p>
                  {lastMonthCount > 0 && thisMonthCount !== lastMonthCount && (
                    <span
                      className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                      style={{
                        background:
                          thisMonthCount > lastMonthCount
                            ? 'rgba(16,185,129,0.10)'
                            : 'rgba(15,23,42,0.05)',
                        color: thisMonthCount > lastMonthCount ? '#0F6E56' : '#64748B',
                      }}
                    >
                      {t('quest.momentum.delta', { sign: deltaSign, count: delta })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {suggestedRegion ? (
              <p className="text-xs mt-2 text-muted-foreground">
                {t('quest.momentum.suggestedRegion', { region: suggestedRegion })}
              </p>
            ) : (
              <p className="text-xs mt-2 text-muted-foreground">
                {t('quest.momentum.keepBuilding')}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <div
               className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}
            >
              <Flame className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('quest.momentum.emptyPrompt')}
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default MomentumCard;
