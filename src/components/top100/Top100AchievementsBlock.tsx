import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100AchievementPrompts } from '@/hooks/useTop100AchievementPrompts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

interface Top100AchievementsBlockProps {
  listId: string;
}

// Map list ID to regional tier
function getListTier(listId: string): EliteCardTier {
  if (listId.includes('gb') || listId.includes('ireland')) return 'GBI';
  if (listId.includes('europe')) return 'EU';
  if (listId.includes('usa')) return 'USA';
  return 'WORLD';
}

/**
 * Top100AchievementsBlock - Part of Global Achievement & Milestone System
 * Uses unified EliteGameCard for consistent styling site-wide
 */
export const Top100AchievementsBlock: React.FC<Top100AchievementsBlockProps> = ({ listId }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const prompts = useTop100AchievementPrompts(listId, user?.id);

  if (!user || prompts.length === 0) return null;

  const handlePromptClick = () => {
    navigate('/profile');
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-sq-md p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Achievements tied to this list
      </h3>
      
      <div className="space-y-3">
        {prompts.map((prompt) => {
          const tier = getListTier(listId);
          const progressParts = prompt.progressLabel?.split('/') || [];
          const current = parseInt(progressParts[0] || '0', 10);
          const total = parseInt(progressParts[1] || '100', 10);
          
          return (
            <button
              key={prompt.code}
              onClick={handlePromptClick}
              className="w-full text-left"
            >
              <EliteGameCard
                tier={tier}
                earned={prompt.isUnlocked}
                currentProgress={current}
                targetProgress={total}
                title={prompt.name}
                subtitle={prompt.description}
                enableAnimations={false}
                quality="medium"
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
