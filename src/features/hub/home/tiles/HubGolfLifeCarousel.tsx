/**
 * HubGolfLifeCarousel - "Your Golf Life" horizontal scroll section
 * Shows handicap, Top 100 progress, latest achievement
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { Trophy, Award, TrendingUp } from 'lucide-react';
import { useHub } from '@/features/hub/useHub';

interface LifeCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  onClick: () => void;
}

function LifeCard({ icon, label, value, subtext, onClick }: LifeCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[140px] rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
      style={{ 
        background: 'var(--hub-glass-bg)',
        border: '1px solid var(--hub-stroke)',
        boxShadow: 'var(--hub-shadow-tile)',
      }}
    >
      <div 
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
        style={{ background: 'var(--hub-glass-bg-input)' }}
      >
        {icon}
      </div>
      <div 
        className="text-[12px] font-medium mb-0.5"
        style={{ color: 'var(--hub-text-muted)' }}
      >
        {label}
      </div>
      <div 
        className="text-[18px] font-bold"
        style={{ color: 'var(--hub-text)' }}
      >
        {value}
      </div>
      {subtext && (
        <div 
          className="text-[11px] mt-0.5"
          style={{ color: 'var(--hub-text-sub)' }}
        >
          {subtext}
        </div>
      )}
    </button>
  );
}

export function HubGolfLifeCarousel() {
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { data: top100Progress } = useTop100ProgressForUser(user?.id);
  const { navigateFromHub } = useHub();

  const handicap = profile?.eg_handicap_index;
  const handicapDisplay = handicap != null ? handicap.toFixed(1) : '—';
  
  const top100Count = top100Progress?.totalTop100Played ?? 0;

  return (
    <div className="mt-4">
      <h3 
        className="text-[17px] font-semibold mb-3 px-1"
        style={{ color: 'var(--hub-text)' }}
      >
        Your Golf Life
      </h3>
      <div 
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
        style={{ 
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
        data-hub-scroll-container="true"
      >
        <LifeCard
          icon={<TrendingUp className="w-4 h-4" style={{ color: 'var(--hub-accent)' }} />}
          label="Handicap"
          value={handicapDisplay}
          subtext={handicap != null ? 'Current index' : 'Not set'}
          onClick={() => navigateFromHub('/profile/handicap')}
        />
        
        <LifeCard
          icon={<Trophy className="w-4 h-4" style={{ color: 'var(--hub-accent-orange)' }} />}
          label="Top 100"
          value={`${top100Count}/100`}
          subtext="Courses played"
          onClick={() => navigateFromHub('/top100')}
        />
        
        <LifeCard
          icon={<Award className="w-4 h-4" style={{ color: '#8B5CF6' }} />}
          label="Achievements"
          value="View"
          subtext="Your badges"
          onClick={() => navigateFromHub('/profile/quest')}
        />
      </div>
    </div>
  );
}
