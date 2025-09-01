
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { scopeMapping, ScopeKey } from './types';

interface GolfCoursesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRegion: ScopeKey;
  onRegionChange: (value: ScopeKey) => void;
}

const GolfCoursesFilters: React.FC<GolfCoursesFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedRegion,
  onRegionChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search golf courses by name or country..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 focus:ring-[#b66b41] focus:border-[#b66b41]"
          />
        </div>
      </div>
      <Select value={selectedRegion} onValueChange={onRegionChange}>
        <SelectTrigger className="w-full sm:w-48 focus:ring-[#b66b41] focus:border-[#b66b41]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(scopeMapping).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GolfCoursesFilters;
