
import React from 'react';
import { Filter, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClubhouseFeedControlsProps {
  feedType: string;
  setFeedType: (type: string) => void;
  contentFilter: string;
  setContentFilter: (filter: string) => void;
}

const ClubhouseFeedControls = ({ 
  feedType, 
  setFeedType, 
  contentFilter, 
  setContentFilter 
}: ClubhouseFeedControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex gap-2">
        <Button 
          variant={feedType === 'all' ? 'default' : 'outline'} 
          onClick={() => setFeedType('all')}
          size="sm"
        >
          From All
        </Button>
        <Button 
          variant={feedType === 'friends' ? 'default' : 'outline'} 
          onClick={() => setFeedType('friends')}
          size="sm"
        >
          From Friends
        </Button>
      </div>
      
      <div className="flex gap-2 flex-1">
        <Select value={contentFilter} onValueChange={setContentFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="tip">Tips</SelectItem>
            <SelectItem value="profile">Profiles</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm">
          <Shuffle className="h-4 w-4 mr-2" />
          Surprise Me
        </Button>
      </div>
    </div>
  );
};

export default ClubhouseFeedControls;
