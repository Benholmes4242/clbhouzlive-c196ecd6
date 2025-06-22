
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ClubhouseFeedControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ClubhouseFeedControls = ({ 
  searchQuery, 
  setSearchQuery
}: ClubhouseFeedControlsProps) => {
  return (
    <div className="mb-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search tips, wedge play, hole in ones..."
          className="pl-10 pr-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ClubhouseFeedControls;
