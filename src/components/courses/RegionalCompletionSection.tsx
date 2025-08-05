import React, { useMemo, useState } from 'react';
import { CheckCircle, Target, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CircularProgress from '@/components/ui/circular-progress';
import { CourseListModal } from './CourseListModal';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';

interface RegionalCompletionSectionProps {
  className?: string;
  userFirstName?: string;
  isCurrentUser?: boolean;
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
  
  // Mobile detection
  const isMobile = useIsMobile();

  // Fetch friends data for progress markers
  const { user } = useSupabaseSession();

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
    <div className={cn('space-y-6', className)}>
      {/* Regional List Completion Section */}
      <div className="bg-muted border border-border rounded-xl p-6 space-y-6">
        {/* Regional Completion Progress */}
        <div className="space-y-6">
          <h4 className="text-xl font-semibold text-foreground">Regional List Completion</h4>
          
          {regionalProgress.isWorldConqueror && (
            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-400 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🌍</span>
                <span className="text-lg font-bold text-yellow-800 dark:text-yellow-200">World Conqueror</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {isCurrentUser 
                  ? "You've completed all regional lists! You are truly a master of the global golf scene."
                  : `${userFirstName || 'This golfer'} has completed all regional lists!`
                }
              </p>
            </div>
          )}

          {/* Regional Progress Grid */}
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-2" : "grid-cols-4"
          )}>
            {regionalProgress.lists.map((list) => {
              const percentage = Math.round((list.completed / list.total) * 100);
              
              return (
                <div 
                  key={list.id}
                  className="relative bg-background border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => {
                    setSelectedCourseList(list);
                    setIsCourseListModalOpen(true);
                  }}
                >
                  <div className="text-center space-y-3">
                    <div className="relative">
                      <CircularProgress 
                        completed={list.completed}
                        total={list.total}
                        size={isMobile ? 60 : 80}
                        strokeWidth={6}
                        className="mx-auto"
                      />
                      {list.isCompleted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-500 bg-background rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h5 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {list.shortName}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {list.completed}/{list.total} completed
                      </p>
                      
                      {list.isCompleted && (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                          {list.tag}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Regional Completion Summary */}
          <div className="bg-gradient-to-r from-background to-muted border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">
                  {isCurrentUser 
                    ? `You've completed ${regionalProgress.completedLists} of 4 regional lists`
                    : `${userFirstName || 'User'} has completed ${regionalProgress.completedLists} of 4 regional lists`
                  }
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {regionalProgress.completedLists}/4 lists
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course List Modal */}
      <CourseListModal 
        isOpen={isCourseListModalOpen}
        onClose={() => setIsCourseListModalOpen(false)}
        region={selectedCourseList}
      />
    </div>
  );
};

export default RegionalCompletionSection;