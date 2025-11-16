import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lock, Settings, Trophy, MoreVertical, Medal, Award, Star } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Achievement {
  id: string;
  name: string;
  xp: number;
  unlocked: boolean;
  iconURL?: string;
  description?: string;
}

interface PinnedAchievementsProps {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
  userHandicap?: string | number;
  userProfilePhotoUrl?: string;
}

const PinnedAchievements: React.FC<PinnedAchievementsProps> = ({
  userId,
  isOwnProfile,
  displayName,
  userHandicap,
  userProfilePhotoUrl
}) => {
  const { user } = useSupabaseSession();
  const { data: achievements = [] } = useUserAchievements(user?.id);
  const isMobile = useIsMobile();
  
  // State for pinned achievements settings
  const [showAchievementsPublic, setShowAchievementsPublic] = useState(true);
  const [pinnedAchievementIds, setPinnedAchievementIds] = useState<string[]>([]);
  const [isManagePinsOpen, setIsManagePinsOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [tempPinnedIds, setTempPinnedIds] = useState<string[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Mock achievement data (replace with real data later)
  const mockAchievements: Achievement[] = [
    { id: '20-club', name: '20 Club', xp: 200, unlocked: true, description: 'Play 20 golf courses' },
    { id: '50-club', name: '50 Club', xp: 300, unlocked: true, description: 'Play 50 golf courses' },
    { id: '100-club', name: 'Century Club', xp: 500, unlocked: false, description: 'Play 100 golf courses' },
    { id: 'eagle-collector', name: 'Eagle Collector', xp: 400, unlocked: true, description: 'Collect 5 eagles' },
    { id: 'birdie-blitz', name: 'Birdie Blitz', xp: 300, unlocked: false, description: 'Get 3 birdies in one round' },
    { id: 'hole-in-one', name: 'Hole-in-One', xp: 1000, unlocked: false, description: 'Score an ace!' },
  ];

  // Load user settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('show_achievements_public, pinned_achievement_ids')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error loading achievement settings:', error);
          return;
        }

        if (data) {
          setShowAchievementsPublic(data.show_achievements_public ?? true);
          setPinnedAchievementIds((data.pinned_achievement_ids as string[]) || []);
        }
      } catch (error) {
        console.error('Error loading achievement settings:', error);
      }
    };

    loadUserSettings();
  }, [userId]);

  // Get display achievements (pinned or top 4 by XP)
  const getDisplayAchievements = (): Achievement[] => {
    const unlockedAchievements = mockAchievements.filter(a => a.unlocked);
    
    if (pinnedAchievementIds.length > 0) {
      // Show pinned achievements in saved order
      const pinned = pinnedAchievementIds
        .map(id => mockAchievements.find(a => a.id === id))
        .filter(Boolean) as Achievement[];
      return pinned.slice(0, 4);
    }
    
    // Show top 4 unlocked by XP
    return unlockedAchievements
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 4);
  };

  // Check if section should be visible
  const shouldShowSection = (): boolean => {
    if (isOwnProfile) return true; // Always show for owner
    
    // For visitors: only show if public and has achievements to display
    const hasAchievements = getDisplayAchievements().length > 0;
    return showAchievementsPublic && hasAchievements;
  };

  // Handle toggle change
  const handleToggleChange = async (newValue: boolean) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ show_achievements_public: newValue } as any)
        .eq('id', user.id);

      if (error) throw error;

      setShowAchievementsPublic(newValue);
      toast({
        title: newValue ? 'Achievements are now public' : 'Achievements are now private',
        description: newValue 
          ? 'Others can see your pinned achievements' 
          : 'Your achievements are hidden from others',
      });
    } catch (error) {
      console.error('Error updating achievement visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update achievement visibility',
        variant: 'destructive'
      });
    }
  };

  // Handle pin management
  const handlePinToggle = (achievementId: string) => {
    const newPinned = tempPinnedIds.includes(achievementId)
      ? tempPinnedIds.filter(id => id !== achievementId)
      : tempPinnedIds.length < 4 
        ? [...tempPinnedIds, achievementId]
        : tempPinnedIds;
    
    setTempPinnedIds(newPinned);
  };

  // Save pin changes
  const handleSavePins = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ pinned_achievement_ids: tempPinnedIds } as any)
        .eq('id', user.id);

      if (error) throw error;

      setPinnedAchievementIds(tempPinnedIds);
      setIsManagePinsOpen(false);
      toast({
        title: 'Pins updated',
        description: 'Your pinned achievements have been saved',
      });
    } catch (error) {
      console.error('Error saving pinned achievements:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pinned achievements',
        variant: 'destructive'
      });
    }
  };

  // Open manage pins with current state
  const openManagePins = () => {
    setTempPinnedIds([...pinnedAchievementIds]);
    setIsManagePinsOpen(true);
  };

  // Get real badge image based on achievement name (match ClbhouzAchievementsModal sizing)
  const getAchievementBadge = (achievementName: string) => {
    switch (achievementName) {
      case '20 Club':
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className="w-40 h-40" />;
      case '50 Club':
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className="w-40 h-40" />;
      case 'Century Club':
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className="w-40 h-40" />;
      case 'Eagle Collector':
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className="w-40 h-40" />;
      case 'Birdie Blitz':
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className="w-40 h-40" />;
      case 'Hole-in-One':
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className="w-40 h-40" />;
      default:
        return <Trophy className="w-8 h-8 text-primary" />;
    }
  };

  // Render achievement badge with proper tooltip system
  const renderAchievementBadge = (achievement: Achievement, isPlaceholder = false) => {
    const badgeContent = (
      <div 
        className={`
          achv-badge-size relative flex flex-col items-center justify-center
          rounded-lg transition-all duration-200 cursor-pointer
          ${isPlaceholder 
            ? 'opacity-60' 
            : achievement.unlocked
              ? 'hover:scale-105'
              : 'opacity-60 grayscale'
          }
        `}
        onClick={isMobile && !isPlaceholder ? () => {
          setSelectedAchievement(achievement);
          setShowAchievementModal(true);
        } : () => !isPlaceholder && setIsAchievementsModalOpen(true)}
      >
        {/* Badge Image */}
        <div className="flex-shrink-0">
          {isPlaceholder ? (
            <Lock className="w-40 h-40 text-muted-foreground" />
          ) : (
            <div className={`transition-all duration-200 ${achievement.unlocked ? 'drop-shadow-lg' : 'opacity-60 grayscale'}`}>
              {getAchievementBadge(achievement.name)}
            </div>
          )}
        </div>
        
        {/* Lock overlay for locked achievements */}
        {!isPlaceholder && !achievement.unlocked && (
          <div className="absolute top-2 right-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );

    // Achievement title under badge
    const titleContent = !isPlaceholder && (
      <div className="text-center mt-3">
        <div className={`text-sm font-semibold mb-1 ${achievement.unlocked ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
          {achievement.name.toUpperCase()}
        </div>
        <div className={`text-sm font-medium ${achievement.unlocked ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
          +{achievement.xp} XP
        </div>
      </div>
    );

    const fullContent = (
      <div className="flex flex-col items-center">
        {badgeContent}
        {titleContent}
      </div>
    );

    if (isPlaceholder) {
      return fullContent;
    }

    // Mobile: Click opens detail modal
    if (isMobile) {
      return fullContent;
    }

    // Desktop: Hover shows rich tooltip
    return (
      <TooltipProvider key={achievement.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            {fullContent}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs z-50 bg-background border shadow-lg">
            <div className="p-2">
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">{achievement.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  achievement.unlocked 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {achievement.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
              
              {/* Description */}
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {achievement.description}
              </p>
              
              {/* XP Value */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                  <span className="text-amber-500">✨</span>
                  +{achievement.xp} XP
                </span>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  🏆 One-time
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (!shouldShowSection()) {
    return null;
  }

  const displayAchievements = getDisplayAchievements();
  const unlockedCount = mockAchievements.filter(a => a.unlocked).length;

  return (
    <>
      <div className="w-full max-w-2xl mx-auto mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-foreground" />
            <h3 className="text-3xl font-bold text-foreground">Achievements</h3>
            {isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => handleToggleChange(!showAchievementsPublic)}>
                    {showAchievementsPublic ? 'Hide from others' : 'Show to others'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openManagePins}>
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Pins
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Visibility warning for owner */}
        {isOwnProfile && !showAchievementsPublic && (
          <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Hidden from others</p>
          </div>
        )}

        {/* Achievement badges grid */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-6 mb-6 justify-items-center">
          {Array.from({ length: 4 }, (_, index) => {
            const achievement = displayAchievements[index];
            
            if (!achievement && unlockedCount === 0 && isOwnProfile) {
              // Show placeholder for empty state
              return (
                <div key={`placeholder-${index}`}>
                  {renderAchievementBadge(
                    { id: `placeholder-${index}`, name: '', xp: 0, unlocked: false },
                    true
                  )}
                </div>
              );
            }
            
            if (achievement) {
              return (
                <div key={achievement.id}>
                  {renderAchievementBadge(achievement)}
                </div>
              );
            }
            
            return null;
          }).filter(Boolean)}
        </div>

        {/* Empty state message for owner */}
        {unlockedCount === 0 && isOwnProfile && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Achievements you earn will appear here.
            </p>
          </div>
        )}

        {/* See All button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setIsAchievementsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            See All Achievements
          </Button>
        </div>
      </div>

      {/* Manage Pins Modal */}
      <Dialog open={isManagePinsOpen} onOpenChange={setIsManagePinsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Pinned Achievements</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select up to 4 achievements to pin to your profile. Pinned achievements will be displayed to others when your profile is public.
            </p>
            
            {/* Unlocked achievements */}
            <div>
              <h4 className="font-semibold mb-3">Unlocked Achievements</h4>
              <div className="grid grid-cols-2 gap-3">
                {mockAchievements
                  .filter(a => a.unlocked)
                  .map(achievement => (
                    <div
                      key={achievement.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-all duration-200
                        ${tempPinnedIds.includes(achievement.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                        }
                        ${tempPinnedIds.length >= 4 && !tempPinnedIds.includes(achievement.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                        }
                      `}
                      onClick={() => handlePinToggle(achievement.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🏆</div>
                        <div className="flex-1">
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-sm text-muted-foreground">+{achievement.xp} XP</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={tempPinnedIds.includes(achievement.id)}
                          onChange={() => handlePinToggle(achievement.id)}
                          className="rounded"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Locked achievements */}
            <div>
              <h4 className="font-semibold mb-3 text-muted-foreground">Locked Achievements</h4>
              <div className="grid grid-cols-2 gap-3">
                {mockAchievements
                  .filter(a => !a.unlocked)
                  .map(achievement => (
                    <div
                      key={achievement.id}
                      className="p-3 border border-border rounded-lg opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl opacity-50">🏆</div>
                        <div className="flex-1">
                          <div className="font-medium text-muted-foreground">{achievement.name}</div>
                          <div className="text-sm text-muted-foreground">+{achievement.xp} XP</div>
                        </div>
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsManagePinsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePins}>
              Save Pins ({tempPinnedIds.length}/4)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Achievements Modal */}
      <ClbhouzAchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        userId={userId}
        userDisplayName={displayName}
        userHandicap={userHandicap}
        userProfilePhotoUrl={userProfilePhotoUrl}
        isCurrentUser={isOwnProfile}
      />

      {/* Achievement Detail Modal for Mobile */}
      {selectedAchievement && (
        <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
          <DialogContent className="max-w-[90vw] max-h-[70vh] p-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{selectedAchievement.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                {getAchievementBadge(selectedAchievement.name)}
              </div>
              
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAchievement.unlocked 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {selectedAchievement.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedAchievement.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                  <span className="text-amber-500">✨</span>
                  +{selectedAchievement.xp} XP
                </span>
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  🏆 One-time
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PinnedAchievements;