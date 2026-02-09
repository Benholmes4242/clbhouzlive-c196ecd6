/**
 * CollegeRivalries — Compact college power rankings
 * Top 5 colleges in a clean ranked list
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { formatCurrency } from '@/lib/utils/formatCurrency';

export function CollegeRivalries() {
  const navigate = useNavigate();
  const { data: allStats, isLoading: statsLoading } = useCollegeSeasonStats();
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();

  const top5 = useMemo(() => {
    if (!allStats?.length) return [];
    return [...allStats]
      .sort((a, b) => b.earnings_total - a.earnings_total)
      .slice(0, 5);
  }, [allStats]);

  if (statsLoading || mediaLoading || top5.length === 0) return null;

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
        <h2 className="text-lg font-bold text-gray-900">College Rivalries</h2>
        <button
          onClick={() => navigate('/tourhub/college')}
          className="text-sm font-medium text-blue-600"
        >
          View All →
        </button>
      </div>

      {/* Compact ranked list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {top5.map((stats, idx) => {
          const media = collegeMap?.get(stats.normalized_name);
          const displayName = media?.short_name || media?.college_name || stats.normalized_name;

          const medalColors = ['#FFB800', '#C0C0C0', '#CD7F32'];
          const rankColor = idx < 3 ? medalColors[idx] : '#9CA3AF';

          return (
            <button
              key={stats.id}
              onClick={() => navigate('/tourhub/college?sort=earnings')}
              className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
              style={{ borderTop: idx > 0 ? '1px solid rgba(0,0,0,0.04)' : undefined }}
            >
              {/* Rank */}
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                style={{ background: rankColor }}
              >
                {idx + 1}
              </span>

              {/* Logo */}
              {media?.logo_url && (
                <img src={media.logo_url} alt={displayName}
                  className="w-7 h-7 object-contain flex-shrink-0" />
              )}

              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(stats.earnings_total)} · {stats.wins_total} win{stats.wins_total !== 1 ? 's' : ''} · {stats.player_count} alumni
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/tourhub/college')}
        className="w-full mt-3 py-3 rounded-xl text-center bg-white border border-gray-200 text-sm font-medium text-gray-700 active:scale-[0.98] transition-transform"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        Explore All Colleges →
      </button>
    </motion.section>
  );
}
