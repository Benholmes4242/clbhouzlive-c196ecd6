import React, { useState } from 'react';
import { Hash, X } from 'lucide-react';
import { IoFlameOutline } from 'react-icons/io5';
import { cn } from '@/lib/utils';

interface TrendingHashtag {
  id: string;
  tag: string;
  postCount: number;
  trending: boolean;
}

interface TrendingAudio {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  usageCount: number;
  waveform?: string;
  thumbnail?: string;
}

interface TrendingNowProps {
  onHashtagClick: (tag: string) => void;
  onAudioClick: (audioId: string) => void;
}

// Mock data - in real app this would come from backend
const trendingHashtags: TrendingHashtag[] = [
  { id: '1', tag: '#holeinone', postCount: 1240, trending: true },
  { id: '2', tag: '#golfhumour', postCount: 890, trending: true },
  { id: '3', tag: '#tigerdrive', postCount: 756, trending: false },
  { id: '4', tag: '#sundayscramble', postCount: 623, trending: true },
  { id: '5', tag: '#birdielife', postCount: 534, trending: false },
  { id: '6', tag: '#golfswing', postCount: 445, trending: true },
  { id: '7', tag: '#coursevibes', postCount: 398, trending: false },
  { id: '8', tag: '#golfday', postCount: 321, trending: true },
];

const trendingAudio: TrendingAudio[] = [
  {
    id: '1',
    title: 'Perfect Golf Swing',
    artist: 'Golf Pro Audio',
    duration: 15,
    usageCount: 342,
    thumbnail: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=100&h=100&fit=crop'
  },
  {
    id: '2', 
    title: 'Birdie Celebration',
    artist: 'Course Sounds',
    duration: 8,
    usageCount: 289,
    thumbnail: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    title: 'Golf Cart Vibes',
    artist: 'Weekend Golfer',
    duration: 22,
    usageCount: 156,
    thumbnail: 'https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=100&h=100&fit=crop'
  }
];

const TrendingNow: React.FC<TrendingNowProps> = ({ onHashtagClick, onAudioClick }) => {
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleHashtagClick = (tag: string) => {
    if (selectedHashtag === tag) {
      // Deselect if already selected
      setSelectedHashtag(null);
      onHashtagClick(''); // Clear filter
    } else {
      // Select new hashtag
      setSelectedHashtag(tag);
      onHashtagClick(tag);
    }
  };

  const handleClearSelection = () => {
    setSelectedHashtag(null);
    onHashtagClick(''); // Clear filter
  };

  return (
    <div className="pt-0 mb-0">
      <div className="px-1 md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Trending Now</h3>
        </div>

        {/* Trending Hashtags - Always Show */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 px-1 md:px-0">
          {trendingHashtags.map((hashtag) => {
            const isSelected = selectedHashtag === hashtag.tag;
            
            return (
              <button
                key={hashtag.id}
                onClick={() => handleHashtagClick(hashtag.tag)}
                className={cn(
                  "pill",
                  isSelected && "pill--active"
                )}
              >
                <IoFlameOutline className="pill__icon" style={{color: 'var(--trend-icon)'}} />
                <span className="font-medium">{hashtag.tag.replace('#', '')}</span>
                <span className="opacity-70">{formatCount(hashtag.postCount)}</span>
                {isSelected && (
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-slate-700" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default TrendingNow;