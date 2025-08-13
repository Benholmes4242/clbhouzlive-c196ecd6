import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SortViewDropdownProps {
  selectedSort: string;
  onSortChange: (sort: string) => void;
}

const SortViewDropdown: React.FC<SortViewDropdownProps> = ({ selectedSort, onSortChange }) => {
  const sortOptions = [
    { value: 'rank-asc', label: 'Rank: Low to High' },
    { value: 'rank-desc', label: 'Rank: High to Low' },
    { value: 'recent', label: 'Recently Played' }
  ];

  const currentSort = sortOptions.find(s => s.value === selectedSort);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex items-center cursor-pointer bg-white/10 backdrop-blur-2xl border border-white/20 px-3 py-1.5 text-white shadow-lg hover:bg-white/20 transition-all duration-300 rounded-full"
          style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
        >
          <span className="text-sm font-medium text-black">
            {currentSort?.label || 'Sort & View'}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 text-black" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-background/95 backdrop-blur-sm border border-border/50"
        style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
      >
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`cursor-pointer transition-colors ${
              selectedSort === option.value 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-muted/50'
            }`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortViewDropdown;