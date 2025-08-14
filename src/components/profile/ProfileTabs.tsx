
import React, { useRef, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Camera, BarChart3, MapPin } from 'lucide-react';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userId: string;
  userDisplayName?: string;
  userHandicap?: number;
  userProfilePhotoUrl?: string;
  isCurrentUser: boolean;
  transitionState: string;
  children: {
    activity: React.ReactNode;
    courses: React.ReactNode;
    stats: React.ReactNode;
  };
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  userId,
  userDisplayName,
  userHandicap,
  userProfilePhotoUrl,
  isCurrentUser,
  transitionState,
  children
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);

  const tabs = [
    { id: 'activity', label: 'Activity', icon: Camera },
    { id: 'courses', label: 'Courses Played', icon: MapPin },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'stats', label: 'Handicap', icon: BarChart3 }
  ];

  const updateScrollState = () => {
    const container = tabsRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 2);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 2
      );
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = tabsRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  }, []);

  return (
    <div className="w-full">
      {/* Sticky Tab Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm w-full">
        <div className="relative w-full">
          {/* Left fade gradient */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/95 to-transparent z-10 pointer-events-none md:hidden" />
          )}
          
          {/* Right fade gradient */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 to-transparent z-10 pointer-events-none md:hidden" />
          )}
          
          <div 
            ref={tabsRef}
            className="flex w-full"
          >
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  disabled={transitionState !== 'idle'}
                  className={`flex-1 flex items-center justify-center py-4 transition-all duration-200 text-base relative ${
                    isActive 
                      ? 'text-black' 
                      : 'text-muted-foreground hover:text-foreground'
                  } ${transitionState !== 'idle' ? 'pointer-events-none' : ''}`}
                >
                  <span className="whitespace-nowrap text-lg md:text-xl font-medium">{tab.label}</span>
                  {/* Underline only under text label */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-black w-3/4" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`py-6 md:py-8 ${activeTab === 'activity' ? 'md:px-0' : 'px-4 md:px-0'}`}>
        <div className={`md:max-w-[1150px] md:mx-auto`}>
          {activeTab === 'activity' && children.activity}
          {activeTab === 'courses' && children.courses}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <button
                  onClick={() => setIsAchievementsModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Open Achievements Modal
                </button>
              </div>
              
              {/* Achievements Content */}
              <div className="min-h-screen bg-background">
                {/* XP Progress Header */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
                  <div className="px-4 py-6">
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                          {userDisplayName}'s Achievements
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                          Track your golf journey and unlock new milestones
                        </p>
                        
                        {/* XP Ring System */}
                        <div className="relative">
                          <div className="w-32 h-32 relative">
                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                              {/* Background ring */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-muted/20"
                              />
                              {/* Progress ring */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                stroke="#3B82F6"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${25 * 2.827} ${282.7 - 25 * 2.827}`}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            
                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-2xl font-bold text-foreground">2.5K</div>
                              <div className="text-xs text-muted-foreground">XP</div>
                            </div>
                          </div>
                          
                          <div className="text-center mt-2">
                            <div className="text-sm text-muted-foreground">
                              7,500 XP to Blue Ring
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="px-4 py-4 border-b border-border">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      { id: 'all', label: 'All Achievements' },
                      { id: 'unlocked', label: 'Unlocked' },
                      { id: 'locked', label: 'Locked' },
                      { id: 'exploration', label: 'Exploration' },
                      { id: 'skill', label: 'Skill' }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          'all' === filter.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Achievements Grid */}
                <div className="px-4 py-6">
                  <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* Experience & Exploration Section */}
                    <section>
                      <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <span>🏌️</span>
                        Experience & Exploration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Sample Achievement Cards */}
                        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl">🏆</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">20 Club</h4>
                              <p className="text-sm text-muted-foreground mb-2">Play 20 different golf courses</p>
                              <div className="text-xs text-primary font-medium">✓ Unlocked</div>
                              <div className="text-xs text-muted-foreground">+100 XP</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl grayscale">🎯</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">50 Club</h4>
                              <p className="text-sm text-muted-foreground mb-2">Play 50 different golf courses</p>
                              <div className="w-full bg-muted rounded-full h-2 mb-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: '80%' }}></div>
                              </div>
                              <div className="text-xs text-muted-foreground">40/50 courses</div>
                              <div className="text-xs text-muted-foreground">+250 XP</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl grayscale">🌟</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">100 Century Club</h4>
                              <p className="text-sm text-muted-foreground mb-2">Play 100 different golf courses</p>
                              <div className="w-full bg-muted rounded-full h-2 mb-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: '40%' }}></div>
                              </div>
                              <div className="text-xs text-muted-foreground">40/100 courses</div>
                              <div className="text-xs text-muted-foreground">+500 XP</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Skill & Performance Section */}
                    <section>
                      <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <span>⚡</span>
                        Skill & Performance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl grayscale">🦅</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">First Eagle</h4>
                              <p className="text-sm text-muted-foreground mb-2">Record your first eagle</p>
                              <div className="text-xs text-muted-foreground">Score 2 under par on any hole</div>
                              <div className="text-xs text-muted-foreground mt-1">+150 XP</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl grayscale">🎯</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">Birdie Blitz</h4>
                              <p className="text-sm text-muted-foreground mb-2">Score 3+ birdies in one round</p>
                              <div className="w-full bg-muted rounded-full h-2 mb-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: '66%' }}></div>
                              </div>
                              <div className="text-xs text-muted-foreground">2/3 birdies in a round</div>
                              <div className="text-xs text-muted-foreground">+200 XP</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow opacity-60">
                          <div className="flex items-start gap-3">
                            <div className="text-4xl grayscale">🏌️</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">Single-Figure Handicap</h4>
                              <p className="text-sm text-muted-foreground mb-2">Achieve a handicap under 10</p>
                              <div className="w-full bg-muted rounded-full h-2 mb-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                              </div>
                              <div className="text-xs text-muted-foreground">Current: 12.3 handicap</div>
                              <div className="text-xs text-muted-foreground">+300 XP</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'stats' && children.stats}
        </div>
      </div>

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={userDisplayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isCurrentUser}
      />
    </div>

  );
};

export default ProfileTabs;
