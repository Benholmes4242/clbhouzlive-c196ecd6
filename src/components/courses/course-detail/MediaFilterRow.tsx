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
    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      active
        ? 'bg-slate-900 text-white shadow-sm'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
    <div className="bg-slate-100 px-4 py-2">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        <Settings2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div className="flex gap-3">
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
