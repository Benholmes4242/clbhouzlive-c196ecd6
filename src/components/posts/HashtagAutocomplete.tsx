import React from 'react';
import { Hash, TrendingUp } from 'lucide-react';

interface HashtagSuggestion {
  tag: string;
  count: number;
}

interface HashtagAutocompleteProps {
  hashtags: HashtagSuggestion[];
  isVisible: boolean;
  onSelect: (hashtag: HashtagSuggestion) => void;
  selectedIndex: number;
}

const HashtagAutocomplete: React.FC<HashtagAutocompleteProps> = ({
  hashtags,
  isVisible,
  onSelect,
  selectedIndex
}) => {
  if (!isVisible) return null;

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 mt-1">
      {hashtags.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500">
          No hashtags found
        </div>
      ) : (
        hashtags.map((hashtag, index) => (
          <div
            key={hashtag.tag}
            className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
              index === selectedIndex
                ? 'bg-green-50 border-l-2 border-green-500'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(hashtag)}
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Hash className="w-4 h-4 text-green-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate" style={{ color: '#6e9277' }}>
                  {hashtag.tag}
                </span>
                {hashtag.count > 500 && (
                  <TrendingUp className="w-3 h-3 text-orange-500" />
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {formatCount(hashtag.count)} posts
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HashtagAutocomplete;