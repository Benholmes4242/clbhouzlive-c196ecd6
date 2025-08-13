import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RegionDropdownProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

const RegionDropdown: React.FC<RegionDropdownProps> = ({ selectedRegion, onRegionChange }) => {
  const regions = [
    { value: 'global', label: 'Global Top 100' },
    { value: 'britain-ireland', label: 'Britain & Ireland Top 100' },
    { value: 'usa', label: 'USA Top 100' },
    { value: 'europe', label: 'Europe Top 100' }
  ];

  const currentRegion = regions.find(r => r.value === selectedRegion);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex items-center cursor-pointer bg-white/10 backdrop-blur-2xl border border-white/20 px-3 py-1.5 text-white shadow-lg hover:bg-white/20 transition-all duration-300 rounded-full"
          style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
        >
          <span className="text-sm font-medium text-black">
            {currentRegion?.label || 'Select Region'}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 text-black" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-background/95 backdrop-blur-sm border border-border/50"
        style={{ backdropFilter: 'blur(20px) saturate(150%)' }}
      >
        {regions.map((region) => (
          <DropdownMenuItem
            key={region.value}
            onClick={() => onRegionChange(region.value)}
            className={`cursor-pointer transition-colors ${
              selectedRegion === region.value 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-muted/50'
            }`}
          >
            {region.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RegionDropdown;