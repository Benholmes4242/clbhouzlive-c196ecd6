/**
 * MomentumIndex — Surging / Stable / Sliding
 * Shows 3 players per category based on rank delta + recent form
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { useMomentumIndex, type MomentumPlayer, type MomentumCategory } from '../../hooks/useMomentumIndex';

const CATEGORY_CONFIG: Record<MomentumCategory, {
  label: string;
  icon: typeof TrendingUp;
  color: string;
  badgeBg: string;
  badgeText: string;
}> = {
  surging: {
    label: 'Surging',
    icon: TrendingUp,
    color: '#16A34A',
    badgeBg: 'rgba(22, 163, 74, 0.1)',
    badgeText: '#16A34A',
  },
  stable: {
    label: 'Stable',
    icon: Minus,
    color: '#6B7280',
    badgeBg: 'rgba(107, 114, 128, 0.1)',
    badgeText: '#6B7280',
  },
  sliding: {
    label: 'Sliding',
    icon: TrendingDown,
    color: '#DC2626',
    badgeBg: 'rgba(220, 38, 38, 0.1)',
    badgeText: '#DC2626',
  },
};

function PlayerCard({ player }: { player: MomentumPlayer }) {
  const navigate = useNavigate();
  const config = CATEGORY_CONFIG[player.category];
  const initials = `${player.firstName[0] || ''}${player.lastName[0] || ''}`.toUpperCase();
  const deltaLabel = player.rankDelta > 0 ? `↑${player.rankDelta}` : player.rankDelta < 0 ? `↓${Math.abs(player.rankDelta)}` : '—';

  return (
    <button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="flex items-center gap-3 w-full text-left py-2"
    >
      {/* Photo */}
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`}
            className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-xs font-bold text-gray-400">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {player.firstName} {player.lastName}
        </p>
        {player.recentResults.length > 0 && (
          <p className="text-xs text-gray-400 truncate">
            {player.recentResults.join(' · ')}
          </p>
        )}
      </div>

      {/* Rank delta badge */}
      <span
        className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: config.badgeBg, color: config.badgeText }}
      >
        {deltaLabel}
      </span>
    </button>
  );
}

function CategoryGroup({ category, players }: { category: MomentumCategory; players: MomentumPlayer[] }) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (players.length === 0) return null;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {players.map(p => <PlayerCard key={p.playerId} player={p} />)}
      </div>
    </div>
  );
}

export function MomentumIndex() {
  const { data, isLoading } = useMomentumIndex();

  if (isLoading) return null;
  if (!data || (data.surging.length === 0 && data.stable.length === 0 && data.sliding.length === 0)) return null;

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
        <h2 className="text-lg font-bold text-gray-900">Momentum Index</h2>
      </div>

      {/* Three columns on wider screens, stacked on narrow */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white rounded-2xl p-4 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <CategoryGroup category="surging" players={data.surging} />
        <CategoryGroup category="stable" players={data.stable} />
        <CategoryGroup category="sliding" players={data.sliding} />
      </div>
    </motion.section>
  );
}
