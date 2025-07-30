import React from 'react';
import { Hash, Clock, Trash2, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrendingTag {
  id: string;
  name: string;
  count: number;
}

interface TrendingTagsProps {
  onTagClick: (tag: string) => void;
}

// Mock trending tags data - in real app this would come from backend
const trendingTags: TrendingTag[] = [
  { id: '1', name: '#holeinone', count: 1240 },
  { id: '2', name: '#weekendwarrior', count: 890 },
  { id: '3', name: '#protips', count: 756 },
  { id: '4', name: '#golflaughs', count: 623 },
  { id: '5', name: '#bestshots', count: 534 },
  { id: '6', name: '#courselife', count: 445 },
  { id: '7', name: '#golfswing', count: 398 },
  { id: '8', name: '#fairway', count: 321 },
  { id: '9', name: '#birdiewatch', count: 287 },
  { id: '10', name: '#golfhumor', count: 256 }
];

const TrendingTags: React.FC<TrendingTagsProps> = ({ onTagClick }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Trending Tags</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {trendingTags.slice(0, 8).map((tag) => (
          <button
            key={tag.id}
            onClick={() => onTagClick(tag.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:from-gray-100 hover:to-gray-200 active:from-gray-200 active:to-gray-300 transition-all duration-150"
          >
            <Hash className="w-3 h-3 text-gray-500" />
            <span>{tag.name.replace('#', '')}</span>
            <span className="text-xs text-gray-500 ml-1">{tag.count > 999 ? `${(tag.count / 1000).toFixed(1)}k` : tag.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingTags;