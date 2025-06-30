
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Users, Video, Camera, MapPin } from 'lucide-react';

interface ClubhouseFeedControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  feedFilter: 'trending' | 'friends' | 'videos' | 'photos' | 'courses' | 'all';
  setFeedFilter: (filter: 'trending' | 'friends' | 'videos' | 'photos' | 'courses' | 'all') => void;
}

const ClubhouseFeedControls: React.FC<ClubhouseFeedControlsProps> = ({
  searchQuery,
  setSearchQuery,
  feedFilter,
  setFeedFilter
}) => {
  const filterButtons = [
    { key: 'all', label: 'All', icon: null },
    { key: 'trending', label: 'Trending', icon: TrendingUp },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'videos', label: 'Videos', icon: Video },
    { key: 'photos', label: 'Photos', icon: Camera },
    { key: 'courses', label: 'Courses', icon: MapPin },
  ] as const;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b pb-4 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search posts, users, or courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterButtons.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={feedFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedFilter(key)}
            className={`flex items-center gap-2 whitespace-nowrap ${
              feedFilter === key 
                ? 'bg-[#b66b41] hover:bg-[#9a5a37] text-white' 
                : 'hover:bg-[#b66b41]/10 hover:text-[#b66b41]'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ClubhouseFeedControls;
