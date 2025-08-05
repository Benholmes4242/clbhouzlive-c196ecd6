import React from 'react';
import { cn } from '@/lib/utils';
import CircularProgress from '@/components/ui/circular-progress';

interface MobileGamificationLayoutProps {
  globalTrophies: Array<{
    id: string;
    name: string;
    requiredCourses: number;
    isUnlocked: boolean;
    xp: number;
  }>;
  regionalProgress: {
    lists: Array<{
      id: string;
      name: string;
      completed: number;
      total: number;
    }>;
  };
  onTrophyClick: (trophy: any) => void;
  onRegionalCardClick: (list: any) => void;
}

const MobileGamificationLayout: React.FC<MobileGamificationLayoutProps> = ({
  globalTrophies,
  regionalProgress,
  onTrophyClick,
  onRegionalCardClick
}) => {
  return (
    <>
      {/* Mobile Trophy Carousel - Show only 2 trophies at a time */}
      <div className="md:hidden relative z-10 py-4">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-8 snap-x snap-mandatory px-4 pb-4 pt-2" style={{ scrollSnapType: 'x mandatory' }}>
            {globalTrophies.map((trophy, index) => (
              <div 
                key={trophy.id} 
                className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-110 transition-all duration-300 hover:-translate-y-1 snap-center flex-shrink-0"
                style={{ 
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                  minWidth: 'calc(50% - 16px)' // Show 2 trophies at a time
                }}
                onClick={() => onTrophyClick({
                  ...trophy,
                  type: 'global',
                  dateEarned: trophy.isUnlocked ? 'July 2025' : null,
                  description: `Complete ${trophy.requiredCourses} courses to earn ${trophy.xp.toLocaleString()} XP`
                })}
              >
                {trophy.id === 'green-fee-rookie' ? (
                  <img 
                    src="/lovable-uploads/f2f50b99-38e1-466b-8ac8-c32e428231cb.png" 
                    alt="Green Fee Rookie Trophy" 
                    className={cn(
                      'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                      trophy.isUnlocked ? 'opacity-100 animate-bounce' : 'opacity-40 grayscale'
                    )}
                    style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                  />
                ) : trophy.id === 'the-turn' ? (
                  <img 
                    src="/lovable-uploads/43291ca4-d526-4b10-9585-6ea3488445cf.png" 
                    alt="The Turn Trophy"
                    className={cn(
                      'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                      trophy.isUnlocked ? 'opacity-100 animate-bounce' : 'opacity-40 grayscale'
                    )}
                    style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(148, 163, 184, 0.6))' : 'none' }}
                  />
                ) : trophy.id === 'century-club' ? (
                  <img 
                    src="/lovable-uploads/0c126dc7-5509-40b9-862d-b054423ca7f6.png" 
                    alt="Century Club Trophy" 
                    className={cn(
                      'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                      trophy.isUnlocked ? 'opacity-100 animate-bounce' : 'opacity-40 grayscale'
                    )}
                    style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' : 'none' }}
                  />
                ) : trophy.id === 'clubhouse-elite' ? (
                  <img 
                    src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" 
                    alt="Clubhouse Elite Trophy" 
                    className={cn(
                      'h-20 w-auto object-contain -mt-4 transition-all duration-300',
                      trophy.isUnlocked ? 'opacity-100 animate-bounce' : 'opacity-40 grayscale'
                    )}
                    style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))' : 'none' }}
                  />
                ) : (
                  <div 
                    className={cn(
                      'text-6xl transition-all duration-300',
                      trophy.isUnlocked ? 'opacity-100 animate-bounce' : 'opacity-40 grayscale'
                    )}
                    style={{ filter: trophy.isUnlocked ? 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))' : 'none' }}
                  >
                    🏆
                  </div>
                )}
                <span className="text-sm text-center font-medium text-foreground max-w-24 leading-tight">
                  {trophy.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {trophy.requiredCourses} courses
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider Line */}
      <div className="mx-16 border-t border-gray-300/60 mt-6 mb-6"></div>

      {/* Mobile Regional Lists - Single Card Carousel */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-foreground">Regional List Completion</span>
          <span className="text-base font-medium text-foreground">
            {regionalProgress.lists.filter(list => list.completed >= list.total).length}/4 lists completed
          </span>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 snap-x snap-mandatory px-2 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
            {regionalProgress.lists.map((list, index) => (
              <div
                key={list.id}
                className="flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer hover:scale-105 hover:-translate-y-1 bg-background border-border hover:shadow-lg duration-300 snap-center flex-shrink-0"
                style={{ 
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  minWidth: 'calc(100% - 32px)', // Show 1 card fully with peek of next
                  marginRight: index === regionalProgress.lists.length - 1 ? '0' : '8px'
                }}
                onClick={() => onRegionalCardClick(list)}
              >
                {/* Region Name at Top */}
                <h4 className="text-xl font-semibold text-foreground text-center mb-4 w-full">
                  {list.name}
                </h4>

                {/* Center Content: Trophy and Progress Ring */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  {/* Trophy Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      {list.id === 'britain-ireland' ? (
                        <img 
                          src="/lovable-uploads/7df94753-adb7-43b1-8ea8-380234f3318f.png" 
                          alt="British & Irish Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.completed >= list.total ? 'opacity-100 animate-pulse' : 'opacity-70'
                          )}
                          style={{ 
                            filter: list.completed >= list.total 
                              ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' 
                              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                          }}
                        />
                      ) : list.id === 'europe' ? (
                        <img 
                          src="/lovable-uploads/1a1f3f8d-5f91-4e65-8f64-6a516cd2ea20.png" 
                          alt="European Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.completed >= list.total ? 'opacity-100 animate-pulse' : 'opacity-70'
                          )}
                          style={{ 
                            filter: list.completed >= list.total 
                              ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' 
                              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                          }}
                        />
                      ) : list.id === 'usa' ? (
                        <img 
                          src="/lovable-uploads/b6d15b83-cd17-41b5-9af1-a066d6d0c6ac.png" 
                          alt="USA Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.completed >= list.total ? 'opacity-100 animate-pulse' : 'opacity-70'
                          )}
                          style={{ 
                            filter: list.completed >= list.total 
                              ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' 
                              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                          }}
                        />
                      ) : (
                        <img 
                          src="/lovable-uploads/a9672498-b79d-4a47-9e6a-1128770700c9.png" 
                          alt="Worldwide Trophy" 
                          className={cn(
                            'h-20 w-auto object-contain transition-all duration-300',
                            list.completed >= list.total ? 'opacity-100 animate-pulse' : 'opacity-70'
                          )}
                          style={{ 
                            filter: list.completed >= list.total 
                              ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))' 
                              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="flex-shrink-0">
                    <CircularProgress 
                      completed={list.completed}
                      total={list.total}
                      size={80}
                      strokeWidth={6}
                      className="transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Bottom: XP Count and Description */}
                <div className="text-center w-full">
                  <div className="text-xl font-bold text-foreground mb-1">
                    {list.completed}/{list.total}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {(list.completed * 110).toLocaleString()} XP
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight">
                    {list.completed >= list.total 
                      ? "Complete! All courses played." 
                      : `${list.total - list.completed} courses remaining`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileGamificationLayout;