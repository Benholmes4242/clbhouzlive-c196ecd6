/**
 * QuestHero - Hero section showing overall Top 100 progress
 */

import React from 'react';
import { Trophy } from 'lucide-react';

interface QuestHeroProps {
  totalPlayed: number;
  target?: number;
  seasonLabel?: string;
  hasPremiumAccent?: boolean;
}

export const QuestHero: React.FC<QuestHeroProps> = ({
  totalPlayed,
  target = 100,
  seasonLabel,
  hasPremiumAccent = false,
}) => {
  return (
    <section className="text-center py-6">
      <div className="flex justify-center mb-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(210, 180, 97, 0.12)',
            border: '1px solid rgba(210, 180, 97, 0.25)',
            boxShadow: hasPremiumAccent ? '0 0 25px rgba(210, 180, 97, 0.2)' : 'var(--quest-shadow-sm)',
          }}
        >
          <Trophy className="w-7 h-7" style={{ color: 'var(--quest-accent-gold)' }} />
        </div>
      </div>

      <div className="flex items-baseline justify-center gap-2 mb-1">
        <span
          className="text-5xl font-bold"
          style={{ color: 'var(--quest-text-primary)' }}
        >
          {totalPlayed}
        </span>
        <span
          className="text-2xl"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          / {target}
        </span>
      </div>

      <p
        className="text-sm"
        style={{ color: 'var(--quest-text-secondary)' }}
      >
        Top 100 Courses Played
      </p>

      {seasonLabel && (
        <p
          className="text-xs mt-2"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          {seasonLabel}
        </p>
      )}
    </section>
  );
};

export default QuestHero;
