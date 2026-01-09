/**
 * CourseLegacyMiniTile - Mini version of Course Legacy card
 * Shows courses played, countries, avg rating
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/utils/haptics';
import { useHub } from '@/features/hub/useHub';

// TODO: Replace with real hook that fetches user's course stats
const useMockCourseLegacy = () => ({
  coursesPlayed: 24,
  countries: 3,
  avgRating: 4.2,
});

export function CourseLegacyMiniTile() {
  const navigate = useNavigate();
  const { close } = useHub();
  const stats = useMockCourseLegacy();

  const handleTap = () => {
    haptic('light');
    close();
    navigate('/courses');
  };

  return (
    <button
      onClick={handleTap}
      className="w-full rounded-[22px] p-4 text-left transition-all active:scale-[0.98]"
      style={{
        background: 'var(--hub-glass-bg)',
        border: '1px solid var(--hub-stroke)',
        boxShadow: 'var(--hub-shadow-tile)',
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left side - main stat */}
        <div>
          <div 
            className="text-[15px] font-semibold"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Your Course Legacy
          </div>
          <div 
            className="text-[32px] font-bold leading-none mt-1"
            style={{ color: 'var(--hub-text)' }}
          >
            {stats.coursesPlayed}
          </div>
          <div 
            className="text-[13px] mt-1"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Courses played
          </div>
        </div>

        {/* Right side - secondary stats */}
        <div className="flex flex-col items-end gap-1 mt-1">
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'var(--hub-glass-bg-input)' }}
          >
            <span 
              className="text-[13px] font-medium"
              style={{ color: 'var(--hub-text-body)' }}
            >
              {stats.countries} countries
            </span>
          </div>
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'var(--hub-glass-bg-input)' }}
          >
            <span 
              className="text-[13px] font-medium"
              style={{ color: 'var(--hub-text-body)' }}
            >
              {stats.avgRating.toFixed(1)} avg rating
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
