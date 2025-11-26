import React from 'react';
import { Settings2 } from 'lucide-react';

export type MediaFilterMode = 'most_recent' | 'photos' | 'videos' | 'friends' | 'mine';

interface MediaFilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const MediaFilterPill: React.FC<MediaFilterPillProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-100 ${
      active
        ? 'bg-slate-800 text-white border-slate-800'
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

interface MediaFilterRowProps {
  filterMode: MediaFilterMode;
  onFilterChange: (mode: MediaFilterMode) => void;
  hasFriends?: boolean;
  hasUserMedia?: boolean;
}

export const MediaFilterRow: React.FC<MediaFilterRowProps> = ({
  filterMode,
  onFilterChange,
  hasFriends = false,
  hasUserMedia = false,
}) => {
  return (
    <div className="sticky top-0 bg-slate-100 z-10 py-3 px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Settings2 className="w-3.5 h-3.5" />
          <span className="font-medium">Sort</span>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <MediaFilterPill
            label="Most recent"
            active={filterMode === 'most_recent'}
            onClick={() => onFilterChange('most_recent')}
          />
          <MediaFilterPill
            label="Photos"
            active={filterMode === 'photos'}
            onClick={() => onFilterChange('photos')}
          />
          <MediaFilterPill
            label="Videos"
            active={filterMode === 'videos'}
            onClick={() => onFilterChange('videos')}
          />
          {hasFriends && (
            <MediaFilterPill
              label="From friends"
              active={filterMode === 'friends'}
              onClick={() => onFilterChange('friends')}
            />
          )}
          {hasUserMedia && (
            <MediaFilterPill
              label="From you"
              active={filterMode === 'mine'}
              onClick={() => onFilterChange('mine')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
