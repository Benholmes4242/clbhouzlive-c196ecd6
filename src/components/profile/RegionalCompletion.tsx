import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import CircularProgress from '@/components/ui/circular-progress';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface RegionalCompletionProps {
  britainIrelandCompleted?: number;
  britainIrelandTotal?: number;
  europeCompleted?: number;
  europeTotal?: number;
  usaCompleted?: number;
  usaTotal?: number;
  worldwideCompleted?: number;
  worldwideTotal?: number;
  className?: string;
  onRegionClick?: (region: string) => void;
}

interface RegionalList {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  completed: number;
  total: number;
  isCompleted: boolean;
  tag?: string;
  description?: string;
}

const RegionalCompletion: React.FC<RegionalCompletionProps> = ({
  britainIrelandCompleted = 0,
  britainIrelandTotal = 100,
  europeCompleted = 0,
  europeTotal = 100,
  usaCompleted = 0,
  usaTotal = 100,
  worldwideCompleted = 0,
  worldwideTotal = 100,
  className,
  onRegionClick
}) => {
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const regionalLists: RegionalList[] = [
    {
      id: 'britain-ireland',
      name: 'Great Britain & Ireland',
      shortName: 'GB&I',
      flag: '🇬🇧',
      completed: britainIrelandCompleted,
      total: britainIrelandTotal,
      isCompleted: britainIrelandCompleted >= britainIrelandTotal,
      tag: 'Links Legend',
      description: "You've mastered the finest courses across the British Isles."
    },
    {
      id: 'europe',
      name: 'Continental Europe',
      shortName: 'EUR',
      flag: '🇪🇺',
      completed: europeCompleted,
      total: europeTotal,
      isCompleted: europeCompleted >= europeTotal,
      tag: 'Continental Swinger',
      description: 'From Algarve to the Alps. Europe\'s elite courses conquered.'
    },
    {
      id: 'usa',
      name: 'USA',
      shortName: 'USA',
      flag: '🇺🇸',
      completed: usaCompleted,
      total: usaTotal,
      isCompleted: usaCompleted >= usaTotal,
      tag: 'Stars and Stripes Tourer',
      description: 'Coast to coast, you\'ve played the American greats.'
    },
    {
      id: 'worldwide',
      name: 'Worldwide Top 100',
      shortName: 'World',
      flag: '🌍',
      completed: worldwideCompleted,
      total: worldwideTotal,
      isCompleted: worldwideCompleted >= worldwideTotal,
      tag: 'Legends Club',
      description: 'From Seve to Tiger to Jack, legends have walked where you now stand.'
    }
  ];

  const completedLists = regionalLists.filter(list => list.isCompleted).length;
  const isWorldConqueror = completedLists === 4;

  const getProgressColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage >= 100) return 'text-green-500';
    if (percentage >= 75) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    if (percentage >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Regional List Completion</h3>
        <span className="text-sm text-muted-foreground">
          {completedLists}/4 regions completed
        </span>
      </div>

      {/* World Conqueror Status */}
      {isWorldConqueror && (
        <div className="bg-gradient-to-r from-purple-500/20 to-gold-500/20 border border-purple-400/30 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🏆</div>
          <h4 className="font-bold text-foreground mb-1">World Conqueror!</h4>
          <p className="text-sm text-muted-foreground">
            You've completed all regional Top 100 lists. Legendary status achieved!
          </p>
        </div>
      )}

      {/* Regional Progress Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {regionalLists.map((region) => (
          <div key={region.id} className="space-y-2">
            {/* Progress Circle */}
            <div className="relative flex justify-center">
              <div className="relative">
                <CircularProgress
                  completed={region.completed}
                  total={region.total}
                  size={80}
                  strokeWidth={6}
                  className={cn(
                    'transition-all duration-300',
                    getProgressColor(region.completed, region.total)
                  )}
                  bottomText=""
                />
                {/* Custom Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl mb-1">{region.flag}</span>
                  <span className="text-xs font-medium text-foreground">
                    {region.completed}/{region.total}
                  </span>
                </div>
              </div>

              {/* Completion Badge */}
              {region.isCompleted && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            {/* Region Info */}
            <div className="text-center space-y-1">
              <h4 className="text-sm font-medium text-foreground">{region.shortName}</h4>
              <p className="text-xs text-muted-foreground leading-tight">
                {region.name}
              </p>

              {/* Completion Tag */}
              {region.isCompleted && region.tag && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full px-2 py-1">
                  <span className="text-xs font-medium text-green-400">{region.tag}</span>
                </div>
              )}
            </div>

            {/* View Details Button */}
            {onRegionClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegionClick(region.id)}
                className="w-full text-xs h-6 px-2"
              >
                View List
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {regionalLists.reduce((sum, region) => sum + region.completed, 0)} total courses played across all regions
        </p>
      </div>
    </div>
  );
};

export default RegionalCompletion;