import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
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
    name: 'GB&I Top 100',
    shortName: 'GB&I',
    tag: 'Links Legend',
    description: "You've mastered the finest across the British Isles.",
  },
  {
    id: 'europe',
    name: 'Europe Top 100',
    shortName: 'EUR',
    tag: 'The Continental Swinger',
    description: 'From Algarve to the Alps. Europe\'s elite courses. Conquered.',
  },
  {
    id: 'usa',
    name: 'USA Top 100',
    shortName: 'USA',
    tag: 'Stars and Stripes Tourer',
    description: 'Coast to coast, you\'ve played the American greats.',
  },
  {
    id: 'worldwide',
    name: 'Global Top 100',
    shortName: 'Global',
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
        {/* Divider Line */}
        <div className="mx-16 border-t border-gray-300/60"></div>

        {/* Regional Lists Completion - Improved Cards with enhanced spacing */}
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">Regional List Completion</span>
            <span className="text-base font-medium text-foreground">
              {regionalProgress.completedLists}/4 lists completed
            </span>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {regionalProgress.lists.map((list) => (
              <div
                key={list.id}
                className="flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer hover:scale-105 hover:-translate-y-1 bg-background border-border hover:shadow-lg duration-300"
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                onClick={() => {
                  setSelectedCourseList(list);
                  setIsCourseListModalOpen(true);
                }}
              >
                {/* Region Name at Top */}
                <h4 className="text-lg font-semibold text-foreground text-center mb-3 w-full">
                  {list.name}
                </h4>

                {/* Top Row: Trophy Left, Progress Ring Right */}
                <div className="flex items-center justify-between w-full mb-2">
                  {/* Trophy Icon - Left Side with enhanced styling */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      {list.id === 'britain-ireland' ? (
                        <img 
                          src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                          alt="British & Irish Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                          )}
                          style={{ 
                            filter: list.isCompleted 
                              ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                          }}
                        />
                      ) : list.id === 'europe' ? (
                        <img 
                          src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" 
                          alt="European Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                          )}
                          style={{ 
                            filter: list.isCompleted 
                              ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                          }}
                        />
                      ) : list.id === 'usa' ? (
                        <img 
                          src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" 
                          alt="USA Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                          )}
                          style={{ 
                            filter: list.isCompleted 
                              ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                          }}
                        />
                      ) : list.id === 'worldwide' ? (
                        <img 
                          src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" 
                          alt="Worldwide Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                          )}
                          style={{ 
                            filter: list.isCompleted 
                              ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Circular Progress Ring - Right Side */}
                  <div className="flex-shrink-0">
                    <CircularProgress
                      completed={list.completed}
                      total={list.total}
                      size={80}
                      strokeWidth={6}
                      showAnimation={true}
                      bottomText={`${(list.completed * 110).toLocaleString()} XP`}
                    />
                  </div>
                </div>
                
                {/* Spacer for separation */}
                <div className="flex-1"></div>
                
                {/* Text content moved to bottom */}
                <div className="mt-auto w-full">
                  {/* Achievement Tag - Black Text */}
                  <div className="text-sm font-medium text-black text-center mb-1">
                    {list.tag}
                  </div>
                  
                  {/* Description */}
                  <p className="text-xs text-black text-center mb-1 leading-relaxed">
                    {list.description}
                  </p>
                </div>
                
              </div>
            ))}
          </div>

          {/* Mobile Swipeable Layout */}
          <div className="md:hidden">
            <div className="relative overflow-hidden">
              <div 
                className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
                style={{ 
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {regionalProgress.lists.map((list, index) => (
                  <div
                    key={list.id}
                    className="flex-shrink-0 w-[calc(100vw-5rem)] max-w-[280px] snap-center"
                    style={{
                      marginRight: index === regionalProgress.lists.length - 1 ? '0' : '1rem'
                    }}
                  >
                    <div
                      className="aspect-[4/3.5] flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer hover:scale-105 hover:-translate-y-1 bg-background border-border hover:shadow-lg duration-300 h-full"
                      style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                      onClick={() => {
                        setSelectedCourseList(list);
                        setIsCourseListModalOpen(true);
                      }}
                    >
                      {/* Region Name at Top */}
                      <h4 className="text-base font-semibold text-foreground text-center mb-3 w-full">
                        {list.name}
                      </h4>

                      {/* Top Row: Trophy Left, Progress Ring Right */}
                      <div className="flex items-center justify-between w-full mb-auto">
                        {/* Trophy Icon - Left Side with enhanced styling */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            {list.id === 'britain-ireland' ? (
                              <img 
                                src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                                alt="British & Irish Trophy" 
                                className={cn(
                                  'h-24 w-auto object-contain transition-all duration-300',
                                  list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                )}
                                style={{ 
                                  filter: list.isCompleted 
                                    ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                }}
                              />
                            ) : list.id === 'europe' ? (
                              <img 
                                src="/lovable-uploads/fa5756cb-1a89-478b-b8ad-8d26168c1f4f.png" 
                                alt="European Trophy" 
                                className={cn(
                                  'h-24 w-auto object-contain transition-all duration-300',
                                  list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                )}
                                style={{ 
                                  filter: list.isCompleted 
                                    ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                }}
                              />
                            ) : list.id === 'usa' ? (
                              <img 
                                src="/lovable-uploads/7ae756b6-b8e6-4d03-a6ee-f8c336eec047.png" 
                                alt="USA Trophy" 
                                className={cn(
                                  'h-24 w-auto object-contain transition-all duration-300',
                                  list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                )}
                                style={{ 
                                  filter: list.isCompleted 
                                    ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                }}
                              />
                            ) : list.id === 'worldwide' ? (
                              <img 
                                src="/lovable-uploads/ab0f852c-4e2f-408d-a13c-ef3a595470e8.png" 
                                alt="Worldwide Trophy" 
                                className={cn(
                                  'h-24 w-auto object-contain transition-all duration-300',
                                  list.isCompleted ? 'opacity-100 brightness-110' : 'opacity-60'
                                )}
                                style={{ 
                                  filter: list.isCompleted 
                                    ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08)) brightness(1.1)' 
                                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))'
                                }}
                              />
                            ) : null}
                          </div>
                        </div>
                        
                        {/* Circular Progress Ring - Right Side */}
                        <div className="flex-shrink-0">
                          <CircularProgress
                            completed={list.completed}
                            total={list.total}
                            size={80}
                            strokeWidth={6}
                            showAnimation={true}
                            bottomText={`${(list.completed * 110).toLocaleString()} XP`}
                          />
                        </div>
                      </div>
                      
                      {/* Text content moved to bottom */}
                      <div className="mt-auto pt-1 w-full">
                        {/* Achievement Tag - Black Text */}
                        <div className="text-xs font-medium text-black text-center mb-1">
                          {list.tag}
                        </div>
                        
                        {/* Description - Truncated for mobile */}
                        <p className="text-xs text-black text-center mb-1 leading-relaxed line-clamp-2">
                          {list.description}
                        </p>
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* World Conqueror Achievement */}
          {regionalProgress.isWorldConqueror && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-5 text-center shadow-lg">
              <h5 className="font-bold text-foreground mb-1 text-lg">🌍 World Conqueror!</h5>
              <p className="text-base text-muted-foreground">
                You've completed all regional lists. Truly legendary!
              </p>
            </div>
          )}
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