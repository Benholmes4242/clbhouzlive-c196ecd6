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
  const { achievements } = useUserAchievements();
  
  // State for pinned achievements settings
  const [showAchievementsPublic, setShowAchievementsPublic] = useState(true);
  const [pinnedAchievementIds, setPinnedAchievementIds] = useState<string[]>([]);
  const [isManagePinsOpen, setIsManagePinsOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [tempPinnedIds, setTempPinnedIds] = useState<string[]>([]);

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

  // Get real badge image based on achievement name
  const getAchievementBadge = (achievementName: string) => {
    switch (achievementName) {
      case '20 Club':
        return <img src="/lovable-uploads/20198e55-c649-4394-984a-3fda3a3c8981.png" alt="20 Club Badge" className="w-12 h-12" />;
      case '50 Club':
        return <img src="/lovable-uploads/e262bb44-197f-4aac-9823-abf51a3f29ae.png" alt="50 Club Badge" className="w-12 h-12" />;
      case 'Century Club':
        return <img src="/lovable-uploads/c1d8b74c-57b4-4adc-9b6b-bbccc045e03a.png" alt="100 Century Club Badge" className="w-12 h-12" />;
      case 'Eagle Collector':
        return <img src="/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png" alt="Eagle Collector Badge" className="w-12 h-12" />;
      case 'Birdie Blitz':
        return <img src="/lovable-uploads/5928ca86-f5a8-4ac1-8e15-f13ff748746a.png" alt="Birdie Badge" className="w-12 h-12" />;
      case 'Hole-in-One':
        return <img src="/lovable-uploads/68aa3b6e-7c54-41e7-80f6-75b4bf6e8b63.png" alt="Hole-in-One Badge" className="w-12 h-12" />;
      default:
        return <Trophy className="w-8 h-8 text-primary" />;
    }
  };

  // Render achievement badge
  const renderAchievementBadge = (achievement: Achievement, isPlaceholder = false) => {
    const content = (
      <div 
        className={`
          relative aspect-square rounded-2xl border-2 transition-all duration-200 cursor-pointer
          ${isPlaceholder 
            ? 'bg-muted border-border opacity-60' 
            : achievement.unlocked
              ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:scale-105 hover:border-primary/40'
              : 'bg-muted border-border opacity-40'
          }
        `}
        onClick={() => !isPlaceholder && setIsAchievementsModalOpen(true)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {isPlaceholder ? (
            <Lock className="w-8 h-8 text-muted-foreground" />
          ) : (
             <div className="text-center">
               <div className="mb-1">
                 {getAchievementBadge(achievement.name)}
               </div>
               <div className="text-xs font-medium text-foreground px-1 leading-tight">
                 {achievement.name}
               </div>
             </div>
          )}
        </div>
        
        {/* Lock overlay for locked achievements */}
        {!isPlaceholder && !achievement.unlocked && (
          <div className="absolute top-1 right-1">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );

    if (isPlaceholder) {
      return content;
    }

    return (
      <TooltipProvider key={achievement.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-semibold">{achievement.name}</div>
              <div className="text-sm text-muted-foreground">
                +{achievement.xp} XP • {achievement.unlocked ? 'Unlocked' : 'Locked'}
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
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Pinned Achievements</h3>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }, (_, index) => {
            const achievement = displayAchievements[index];
            
            if (!achievement && unlockedCount === 0 && isOwnProfile) {
              // Show placeholder for empty state
              return renderAchievementBadge(
                { id: `placeholder-${index}`, name: '', xp: 0, unlocked: false },
                true
              );
            }
            
            if (achievement) {
              return renderAchievementBadge(achievement);
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
    </>
  );
};

export default PinnedAchievements;