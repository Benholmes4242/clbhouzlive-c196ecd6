import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface RecentSearchesProps {
  recentSearches: RecentSearch[];
  onRecentSearchClick: (query: string) => void;
  onClearRecentSearches: () => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  recentSearches,
  onRecentSearchClick,
  onClearRecentSearches
}) => {
  if (recentSearches.length === 0) return null;

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Searches</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearRecentSearches}
          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
      
      <div className="space-y-1">
        {recentSearches.slice(0, 5).map((search) => (
          <button
            key={search.id}
            onClick={() => onRecentSearchClick(search.query)}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-900 truncate">{search.query}</span>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatTimestamp(search.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;