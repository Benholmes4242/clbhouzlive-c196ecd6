/**
 * HubGolfLifeCompact - Compact Golf Life Card for side-by-side layout
 * Shows 2-3 condensed stats
 */

import React from 'react';
import { Tile } from '../components/Tile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useHub } from '@/features/hub/useHub';
import { TrendingUp, Trophy, Award } from 'lucide-react';

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}

function StatRow({ icon, label, value, onClick }: StatRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 py-1.5 transition-all active:scale-[0.98]"
      style={{ background: 'transparent' }}
    >
      <div 
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--hub-glass-bg-input)' }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div 
          className="text-[11px] leading-tight"
          style={{ color: 'var(--hub-text-muted)' }}
        >
          {label}
        </div>
        <div 
          className="text-[14px] font-semibold truncate"
          style={{ color: 'var(--hub-text)' }}
        >
          {value}
        </div>
      </div>
    </button>
  );
}

export function HubGolfLifeCompact() {
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { data: top100Progress } = useTop100ProgressForUser(user?.id);
  const { navigateFromHub } = useHub();

  const handicap = profile?.eg_handicap_index;
  const handicapDisplay = handicap != null ? handicap.toFixed(1) : '—';
  const top100Count = top100Progress?.totalTop100Played ?? 0;

  return (
    <Tile title="">
      <div className="h-full flex flex-col">
        {/* Title */}
        <h3 
          className="text-[17px] font-semibold mb-2"
          style={{ color: 'var(--hub-text)' }}
        >
          Golf Life
        </h3>

        {/* Stats */}
        <div className="flex flex-col gap-1">
          <StatRow
            icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--hub-accent)' }} />}
            label="Handicap"
            value={handicapDisplay}
            onClick={() => navigateFromHub('/profile/handicap')}
          />
          
          <StatRow
            icon={<Trophy className="w-3.5 h-3.5" style={{ color: 'var(--hub-accent-orange)' }} />}
            label="Top 100"
            value={`${top100Count}/100`}
            onClick={() => navigateFromHub('/top100')}
          />
          
          <StatRow
            icon={<Award className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} />}
            label="Achievements"
            value="View →"
            onClick={() => navigateFromHub('/profile/quest')}
          />
        </div>
      </div>
    </Tile>
  );
}
