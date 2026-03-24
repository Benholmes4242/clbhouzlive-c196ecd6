import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExplorationLeaderboardEntry } from '@/types/leaderboards';

interface ContinentBreakdownGridProps {
  entries: ExplorationLeaderboardEntry[];
  activeContinent: string | null;
  onContinentSelect: (continent: string | null) => void;
  seasonColor?: string;
}

const CONTINENT_CONFIG = [
  { name: 'Europe', icon: '🇪🇺', color: '#3B82F6' },
  { name: 'Asia', icon: '🌏', color: '#F59E0B' },
  { name: 'North America', icon: '🌎', color: '#10B981' },
  { name: 'Oceania', icon: '🦘', color: '#8B5CF6' },
  { name: 'Africa', icon: '🌍', color: '#EF4444' },
  { name: 'South America', icon: '🌱', color: '#F97316' },
] as const;

export function ContinentBreakdownGrid({
  entries,
  activeContinent,
  onContinentSelect,
}: ContinentBreakdownGridProps) {
  const continentStats = useMemo(() => {
    return CONTINENT_CONFIG.map((continent) => {
      const playerCount = entries.filter(e =>
        e.continent_list?.includes(continent.name)
      ).length;
      return { ...continent, playerCount };
    });
  }, [entries]);

  const maxPlayers = useMemo(
    () => Math.max(...continentStats.map(c => c.playerCount), 1),
    [continentStats]
  );

  return (
    <div>
      <p
        className="uppercase tracking-wider text-muted-foreground"
        style={{ fontSize: 10, fontWeight: 600, marginBottom: 10 }}
      >
        Continents · Community Coverage
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {continentStats.map((continent) => {
          const isActive = activeContinent === continent.name;
          const isEmpty = continent.playerCount === 0;

          return (
            <button
              key={continent.name}
              onClick={() => {
                if (isEmpty) return;
                onContinentSelect(isActive ? null : continent.name);
              }}
              style={{
                borderRadius: 14,
                padding: '12px 14px',
                backgroundColor: isActive ? `${continent.color}10` : 'hsl(var(--card))',
                border: isActive
                  ? `1.5px solid ${continent.color}55`
                  : '1.5px solid hsl(var(--border))',
                boxShadow: isActive ? `0 0 12px ${continent.color}15` : 'none',
                opacity: isEmpty ? 0.4 : 1,
                cursor: isEmpty ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 18 }}>{continent.icon}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: isEmpty ? 'hsl(var(--muted-foreground))' : continent.color,
                  }}
                >
                  {continent.playerCount}
                </span>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 3,
                  marginTop: 6,
                  marginBottom: 6,
                  background: 'rgba(0,0,0,0.06)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(continent.playerCount / maxPlayers) * 100}%`,
                    height: '100%',
                    backgroundColor: continent.color,
                    borderRadius: 999,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <p className="text-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
                {continent.name}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                {isEmpty ? 'No players yet' : `${continent.playerCount} players`}
              </p>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeContinent && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-center mt-2"
            style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--accent-amber))' }}
          >
            Showing {activeContinent} players · tap to clear
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
