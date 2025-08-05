import React, { useMemo, useState } from 'react';
import { CheckCircle, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CircularProgress from '@/components/ui/circular-progress';
import { CourseListModal } from './CourseListModal';
import FriendsLeaderboard from './friends/FriendsLeaderboard';
import { useIsMobile } from '@/hooks/use-mobile';

interface RegionalCompletionSectionProps {
  className?: string;
  userFirstName?: string;
  isCurrentUser?: boolean;
  // Regional completion data
  britainIrelandCompleted?: number;
  britainIrelandTotal?: number;
  europeCompleted?: number;
  europeTotal?: number;
  usaCompleted?: number;
  usaTotal?: number;
  worldwideCompleted?: number;
  worldwideTotal?: number;
}

// Regional List Completion
const REGIONAL_LISTS = [
  {
    id: 'britain-ireland',
    name: 'Great Britain & Ireland',
    shortName: 'GB&I',
    tag: 'Links Legend',
    description: "You've mastered the finest across the British Isles.",
  },
  {
    id: 'europe',
    name: 'Continental Europe',
    shortName: 'EUR',
    tag: 'The Continental Swinger',
    description: 'From Algarve to the Alps. Europe\'s elite courses. Conquered.',
  },
  {
    id: 'usa',
    name: 'USA',
    shortName: 'USA',
    tag: 'Stars and Stripes Tourer',
    description: 'Coast to coast, you\'ve played the American greats.',
  },
  {
    id: 'worldwide',
    name: 'Worldwide Top 100',
    shortName: 'World',
    tag: 'Legends Club',
    description: 'From Seve to Tiger to Jack, legends have walked where you now stand. You\'ve joined golf\'s most elite circle. Welcome.',
  },
];

const RegionalCompletionSection: React.FC<RegionalCompletionSectionProps> = ({
  className = '',
  userFirstName,
  isCurrentUser = true,
  britainIrelandCompleted = 0,
  britainIrelandTotal = 100,
  europeCompleted = 0,
  europeTotal = 100,
  usaCompleted = 0,
  usaTotal = 100,
  worldwideCompleted = 0,
  worldwideTotal = 100,
}) => {
  const [selectedCourseList, setSelectedCourseList] = useState<any>(null);
  const [isCourseListModalOpen, setIsCourseListModalOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  
  // Mobile detection
  const isMobile = useIsMobile();

  // Calculate regional list completion
  const regionalProgress = useMemo(() => {
    const lists = [
      {
        ...REGIONAL_LISTS[0],
        completed: britainIrelandCompleted,
        total: britainIrelandTotal,
        isCompleted: britainIrelandCompleted >= britainIrelandTotal,
      },
      {
        ...REGIONAL_LISTS[1],
        completed: europeCompleted,
        total: europeTotal,
        isCompleted: europeCompleted >= europeTotal,
      },
      {
        ...REGIONAL_LISTS[2],
        completed: usaCompleted,
        total: usaTotal,
        isCompleted: usaCompleted >= usaTotal,
      },
      {
        ...REGIONAL_LISTS[3],
        completed: worldwideCompleted,
        total: worldwideTotal,
        isCompleted: worldwideCompleted >= worldwideTotal,
      },
    ];

    const completedLists = lists.filter(list => list.isCompleted).length;
    const isWorldConqueror = completedLists === 4;

    return { lists, completedLists, isWorldConqueror };
  }, [
    britainIrelandCompleted, britainIrelandTotal,
    europeCompleted, europeTotal,
    usaCompleted, usaTotal,
    worldwideCompleted, worldwideTotal
  ]);

  return (
    <Tooltip.Provider>
      <div className={cn('space-y-6', className)}>
        {/* Regional List Completion Section */}
        <div className="bg-muted border border-border rounded-xl p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-foreground">
              Regional List Completion
            </h4>
            
            {/* Friends Leaderboard Toggle */}
            <Collapsible open={isFriendsOpen} onOpenChange={setIsFriendsOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Friends</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isFriendsOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="absolute right-6 top-16 z-20 w-80">
                <div className="bg-background border border-border rounded-lg shadow-lg p-4">
                  <FriendsLeaderboard />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* World Conqueror Special Badge */}
          {regionalProgress.isWorldConqueror && (
            <div className="bg-gradient-to-r from-purple-500/20 to-amber-500/20 border border-amber-400/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">👑</span>
                <h5 className="text-lg font-bold text-foreground">World Conqueror</h5>
                <span className="text-2xl">👑</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isCurrentUser ? "You've" : `${userFirstName || 'User'} has`} completed all four regional lists!
              </p>
            </div>
          )}

          {/* Regional Progress Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regionalProgress.lists.map((region) => (
              <div
                key={region.id}
                className="bg-background/50 border border-border rounded-lg p-4 hover:bg-background/70 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCourseList(region);
                  setIsCourseListModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CircularProgress
                      completed={region.completed}
                      total={region.total}
                      size={isMobile ? 40 : 48}
                      strokeWidth={isMobile ? 4 : 6}
                      className={cn(
                        region.isCompleted && "animate-pulse"
                      )}
                    />
                    <div>
                      <h6 className="font-semibold text-foreground text-sm">{region.shortName}</h6>
                      <p className="text-xs text-muted-foreground">{region.completed}/{region.total}</p>
                    </div>
                  </div>
                  
                  {region.isCompleted && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-xs font-medium text-green-600">Complete</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <h6 className="text-sm font-medium text-foreground">{region.name}</h6>
                  {region.isCompleted && (
                    <div className="bg-green-500/10 border border-green-400/20 rounded px-2 py-1">
                      <span className="text-xs font-medium text-green-600">{region.tag}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Regional Progress Summary */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isCurrentUser ? "You've" : `${userFirstName || 'User'} has`} completed{' '}
              <span className="font-medium text-foreground">{regionalProgress.completedLists}</span>{' '}
              of 4 regional lists
            </p>
          </div>
        </div>

        {/* Course List Modal */}
        {selectedCourseList && (
          <CourseListModal
            isOpen={isCourseListModalOpen}
            onClose={() => {
              setIsCourseListModalOpen(false);
              setSelectedCourseList(null);
            }}
            region={selectedCourseList}
          />
        )}

      </div>
    </Tooltip.Provider>
  );
};

export default RegionalCompletionSection;