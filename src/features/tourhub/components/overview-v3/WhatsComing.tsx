/**
 * WhatsComing — Awareness schedule module
 * Shows 4-6 upcoming events in a vertical stack
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, MapPin } from 'lucide-react';
import { useSeasonTournaments } from '../../hooks/useSeasonTournaments';
import { getTourLogo } from '../../utils/tourLogos';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';

// Major championship names for tier labeling
const MAJORS = ['The Masters', 'PGA Championship', 'U.S. Open', 'The Open Championship'];
const SIGNATURE_KEYWORDS = ['Invitational', 'WGC', 'PLAYERS', 'Genesis', 'Arnold Palmer'];

function getTournamentLabel(name: string): string {
  if (MAJORS.some(m => name.includes(m))) return 'Major Championship';
  if (SIGNATURE_KEYWORDS.some(k => name.includes(k))) return 'Signature Event';
  if (name.toLowerCase().includes('playoff') || name.toLowerCase().includes('tour championship')) return 'Playoff Event';
  return 'Tour Event';
}

function getCountdownLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  const days = differenceInDays(date, new Date());
  if (days <= 0) return 'Today';
  if (days <= 7) return `In ${days} day${days > 1 ? 's' : ''}`;
  return format(date, 'MMM d');
}

export function WhatsComing() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading } = useSeasonTournaments('pga');

  const upcoming = useMemo(() => {
    if (!tournaments) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return tournaments
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .filter(t => new Date(t.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 6);
  }, [tournaments]);

  if (isLoading || upcoming.length === 0) return null;

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
        <h2 className="text-lg font-bold text-gray-900">What's Coming</h2>
        <button
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="text-sm font-medium text-blue-600"
        >
          Full Schedule →
        </button>
      </div>

      {/* Vertical event stack */}
      <div className="space-y-2">
        {upcoming.map((t, idx) => {
          const tierLabel = getTournamentLabel(t.name);
          const isMajor = tierLabel === 'Major Championship';

          return (
            <motion.button
              key={t.id}
              onClick={() => navigate(`/tourhub/tournament/${t.id}`)}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl text-left bg-white border transition-all active:scale-[0.98]"
              style={{
                borderColor: isMajor ? 'rgba(217,119,6,0.2)' : 'rgba(0,0,0,0.04)',
                boxShadow: isMajor
                  ? '0 2px 8px rgba(217,119,6,0.08)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              {/* Date badge */}
              <div className="flex-shrink-0 w-12 text-center">
                <p className="text-[10px] uppercase font-semibold text-gray-400">
                  {format(new Date(t.startDate), 'MMM')}
                </p>
                <p className="text-lg font-bold text-gray-900 leading-tight">
                  {format(new Date(t.startDate), 'd')}
                </p>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: isMajor ? '#D97706' : '#9CA3AF' }}>
                    {tierLabel}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                {t.venueName && (
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {t.venueName}{t.venueCity && ` · ${t.venueCity}`}
                  </p>
                )}
              </div>

              {/* Countdown */}
              <div className="flex-shrink-0 text-right">
                <span className="text-xs font-medium text-gray-400">
                  {getCountdownLabel(t.startDate)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
