import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100AchievementPrompts } from '@/hooks/useTop100AchievementPrompts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

interface Top100AchievementsBlockProps {
  listId: string;
}

// Map list ID to regional tier
function getListTier(listId: string): AchievementTier {
  if (listId.includes('gb') || listId.includes('ireland')) return 'GBI';
  if (listId.includes('europe')) return 'EU';
  if (listId.includes('usa')) return 'USA';
  return 'WORLD';
}

/**
 * Top100AchievementsBlock - Part of Global Achievement & Milestone System
 * Uses unified AchievementBadgeCard for consistent styling site-wide
 */
export const Top100AchievementsBlock: React.FC<Top100AchievementsBlockProps> = ({ listId }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const prompts = useTop100AchievementPrompts(listId, user?.id);

  if (!user || prompts.length === 0) return null;

  const handlePromptClick = () => {
    navigate('/achievements');
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-sq-md p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Achievements tied to this list
      </h3>
      
      <div className="space-y-3">
        {prompts.map((prompt) => {
          // Determine tier based on prompt
          const tier = getListTier(listId);
          
          return (
            <button
              key={prompt.code}
              onClick={handlePromptClick}
              className="w-full text-left"
            >
              <AchievementBadgeCard
                tier={tier}
                title={prompt.name}
                subtitle={prompt.description}
                unlocked={prompt.isUnlocked}
                remaining={prompt.isUnlocked ? undefined : parseInt(prompt.progressLabel?.split('/')[0] || '0')}
              />
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/30">
        <button
          onClick={handlePromptClick}
          className="text-sm text-foreground hover:text-secondary transition-colors font-medium"
        >
          See all your achievements →
        </button>
      </div>
    </div>
  );
};
