import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lock, Settings, Trophy, MoreVertical } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import ClbhouzAchievementsModal from '@/components/achievements/ClbhouzAchievementsModal';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

interface Achievement {
  id: string;
  name: string;
  xp: number;
  unlocked: boolean;
  iconURL?: string;
  description?: string;
  tier?: EliteCardTier;
  subtitle?: string;
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

  // Achievement data with tier mapping
  const mockAchievements: Achievement[] = [
    { id: '20-club', name: '20 Club', xp: 200, unlocked: true, description: 'Play 20 golf courses', tier: '20', subtitle: 'Founders Club' },
    { id: '50-club', name: '50 Club', xp: 300, unlocked: true, description: 'Play 50 golf courses', tier: '50', subtitle: 'Heritage Club' },
    { id: '100-club', name: 'Century Club', xp: 500, unlocked: false, description: 'Play 100 golf courses', tier: '100', subtitle: 'Century Club' },
    { id: '5-club', name: '5 Club', xp: 100, unlocked: true, description: 'Play 5 golf courses', tier: '5', subtitle: 'Rookie Club' },
    { id: '10-club', name: '10 Club', xp: 150, unlocked: true, description: 'Play 10 golf courses', tier: '10', subtitle: 'Fairway Club' },
    { id: '200-club', name: '200 Club', xp: 600, unlocked: false, description: 'Play 200 golf courses', tier: '200', subtitle: 'Elite Club' },
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
      const pinned = pinnedAchievementIds
        .map(id => mockAchievements.find(a => a.id === id))
        .filter(Boolean) as Achievement[];
      return pinned.slice(0, 4);
    }
    
    return unlockedAchievements
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 4);
  };

  // Check if section should be visible
  const shouldShowSection = (): boolean => {
    if (isOwnProfile) return true;
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

  // Render achievement using EliteGameCard
  const renderAchievementCard = (achievement: Achievement, isPlaceholder = false) => {
    if (isPlaceholder || !achievement.tier) {
      return (
        <EliteGameCard
          tier="5"
          earned={false}
          isGhost={true}
          enableAnimations={false}
          quality="low"
        />
      );
    }

    return (
      <div 
        className="cursor-pointer"
        onClick={() => setIsAchievementsModalOpen(true)}
      >
        <EliteGameCard
          tier={achievement.tier}
          earned={achievement.unlocked}
          title={achievement.name}
          subtitle={achievement.subtitle || achievement.description || ''}
          enableAnimations={false}
          quality="low"
        />
      </div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }, (_, index) => {
            const achievement = displayAchievements[index];
            
            if (!achievement && unlockedCount === 0 && isOwnProfile) {
              return (
                <div key={`placeholder-${index}`}>
                  {renderAchievementCard(
                    { id: `placeholder-${index}`, name: '', xp: 0, unlocked: false },
                    true
                  )}
                </div>
              );
            }
            
            if (achievement) {
              return (
                <div key={achievement.id}>
                  {renderAchievementCard(achievement)}
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
              Select up to 4 achievements to pin to your profile.
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
                {selectedAchievement.tier && (
                  <EliteGameCard
                    tier={selectedAchievement.tier}
                    earned={selectedAchievement.unlocked}
                    title={selectedAchievement.name}
                    subtitle={selectedAchievement.subtitle || selectedAchievement.description || ''}
                    enableAnimations={true}
                    quality="high"
                  />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed text-center">
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
