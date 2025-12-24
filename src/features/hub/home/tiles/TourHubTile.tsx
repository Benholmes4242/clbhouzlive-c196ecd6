import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { Radio, Trophy, TrendingUp, ChevronRight } from 'lucide-react';
import { useLiveEvents, useUpcomingEvents } from '@/features/tourhub/hooks';

export function TourHubTile() {
  const navigate = useNavigate();
  const { data: liveEvents } = useLiveEvents();
  const { data: upcomingEvents } = useUpcomingEvents(1);
  
  const hasLive = liveEvents && liveEvents.length > 0;
  const nextEvent = upcomingEvents?.[0];
  
  const goToTourHub = () => navigate('/tourhub');
  const goToLive = () => navigate('/tourhub/live');
  
  return (
    <Tile title="" onViewAll={goToTourHub}>
      <div className="flex h-full flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" style={{ color: 'var(--hub-text-bright)' }} />
            <h3 
              className="text-[18px] font-semibold" 
              style={{ color: 'var(--hub-text-bright)' }}
            >
              Tour Hub
            </h3>
          </div>
          
          <p 
            className="mt-1 text-[13px] leading-snug"
            style={{ color: 'var(--hub-text-muted)' }}
          >
            Live leaderboards & schedules
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="mt-3">
          {hasLive ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToLive(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl w-full transition-colors"
              style={{ 
                background: 'var(--hub-glass-bg-input)',
                border: '1px solid var(--hub-stroke)',
              }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: 'var(--hub-primary-bg)' }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ background: 'var(--hub-primary-bg)' }}
                />
              </span>
              <span 
                className="text-[13px] font-medium"
                style={{ color: 'var(--hub-text-bright)' }}
              >
                {liveEvents.length} Live Now
              </span>
              <ChevronRight className="h-4 w-4 ml-auto" style={{ color: 'var(--hub-text-dim)' }} />
            </button>
          ) : nextEvent ? (
            <div 
              className="flex items-center gap-2 text-[13px]"
              style={{ color: 'var(--hub-text-body)' }}
            >
              <Radio className="h-4 w-4" style={{ color: 'var(--hub-text-dim)' }} />
              <span className="truncate">Next: {nextEvent.name}</span>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 text-[13px]"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              <TrendingUp className="h-4 w-4" />
              <span>View rankings & schedules</span>
            </div>
          )}
        </div>
      </div>
    </Tile>
  );
}
