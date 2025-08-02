import React, { useState } from 'react';
import { Hash, Play, Headphones, TrendingUp, Volume2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'hashtags' | 'audio'>('hashtags');

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const formatDuration = (seconds: number) => {
    return `${seconds}s`;
  };

  return (
    <div className="px-4 py-3">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header with Tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Trending Now</h3>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('hashtags')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full transition-all duration-200",
                activeTab === 'hashtags' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Hash className="w-3 h-3 inline mr-1" />
              Tags
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full transition-all duration-200",
                activeTab === 'audio' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Headphones className="w-3 h-3 inline mr-1" />
              Sounds
            </button>
          </div>
        </div>

        {/* Trending Hashtags */}
        {activeTab === 'hashtags' && (
          <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
            {trendingHashtags.map((hashtag) => (
              <button
                key={hashtag.id}
                onClick={() => onHashtagClick(hashtag.tag)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300",
                  "rounded-full text-sm font-medium text-gray-700 transition-all duration-150",
                  "whitespace-nowrap flex-shrink-0 border border-gray-200",
                  hashtag.trending && "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 text-orange-700"
                )}
              >
                <Hash className="w-3 h-3" />
                <span>{hashtag.tag.replace('#', '')}</span>
                <span className="text-xs text-gray-500 ml-1">
                  {formatCount(hashtag.postCount)}
                </span>
                {hashtag.trending && (
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Trending Audio */}
        {activeTab === 'audio' && (
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-1">
            {trendingAudio.map((audio) => (
              <button
                key={audio.id}
                onClick={() => onAudioClick(audio.id)}
                className="flex items-center gap-3 px-3 py-2 bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl hover:from-gray-50 hover:to-gray-100 transition-all duration-200 whitespace-nowrap flex-shrink-0 min-w-[200px]"
              >
                {/* Audio Thumbnail/Waveform */}
                <div className="relative flex-shrink-0">
                  {audio.thumbnail ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={audio.thumbnail} 
                        alt={audio.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Audio Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {audio.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {audio.artist && (
                      <span className="truncate">{audio.artist}</span>
                    )}
                    <span>•</span>
                    <span>{formatDuration(audio.duration)}</span>
                    <span>•</span>
                    <span>{formatCount(audio.usageCount)} posts</span>
                  </div>
                </div>

                {/* Play Button */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                    <Play className="w-4 h-4 text-gray-600 fill-current ml-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingNow;