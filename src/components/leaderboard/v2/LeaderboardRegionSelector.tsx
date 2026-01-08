/**
 * LeaderboardRegionSelector - Region dropdown for Regional Wars mode
 */

import React from 'react';
import { Globe, MapPin, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type LeaderboardRegion = 'worldwide' | 'gbi' | 'europe' | 'usa' | 'asia-pacific';

interface Region {
  id: LeaderboardRegion;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const REGIONS: Region[] = [
  { id: 'worldwide', label: 'Worldwide', shortLabel: 'World', icon: Globe },
  { id: 'gbi', label: 'GB & Ireland', shortLabel: 'GB&I', icon: MapPin },
  { id: 'europe', label: 'Continental Europe', shortLabel: 'Europe', icon: MapPin },
  { id: 'usa', label: 'USA', shortLabel: 'USA', icon: MapPin },
  { id: 'asia-pacific', label: 'Asia-Pacific', shortLabel: 'APAC', icon: MapPin },
];

interface LeaderboardRegionSelectorProps {
  value: LeaderboardRegion;
  onChange: (region: LeaderboardRegion) => void;
  className?: string;
}

export function LeaderboardRegionSelector({
  value,
  onChange,
  className,
}: LeaderboardRegionSelectorProps) {
  const activeRegion = REGIONS.find(r => r.id === value) || REGIONS[0];
  const Icon = activeRegion.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-muted/50 hover:bg-muted transition-colors',
            'text-sm font-medium text-foreground',
            className
          )}
        >
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span>{activeRegion.label}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {REGIONS.map((region) => {
          const RegionIcon = region.icon;
          const isActive = value === region.id;
          
          return (
            <DropdownMenuItem
              key={region.id}
              onClick={() => onChange(region.id)}
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                isActive && 'bg-muted'
              )}
            >
              <RegionIcon className="w-4 h-4 text-muted-foreground" />
              <span>{region.label}</span>
              {isActive && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { REGIONS };
