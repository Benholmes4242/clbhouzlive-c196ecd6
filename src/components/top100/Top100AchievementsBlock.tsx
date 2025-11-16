import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTop100AchievementPrompts } from '@/hooks/useTop100AchievementPrompts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface Top100AchievementsBlockProps {
  listId: string;
}

const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'skill': return '🎯';
    case 'exploration': return '🌍';
    case 'social': return '👥';
    default: return '🏆';
  }
};

export const Top100AchievementsBlock: React.FC<Top100AchievementsBlockProps> = ({ listId }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const prompts = useTop100AchievementPrompts(listId, user?.id);

  if (!user || prompts.length === 0) return null;

  const handlePromptClick = () => {
    navigate('/achievements');
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Achievements tied to this list
      </h3>
      
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <button
            key={prompt.code}
            onClick={handlePromptClick}
            className="w-full flex items-start justify-between p-4 rounded-xl bg-background/30 hover:bg-background/50 transition-all duration-200 hover:scale-[1.01] group"
          >
            <div className="flex items-start gap-3 flex-1 text-left">
              <span className="text-2xl mt-0.5">{getCategoryEmoji(prompt.category)}</span>
              <div className="flex-1">
                <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {prompt.name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {prompt.description}
                </div>
                {prompt.remainingLabel && (
                  <div className="text-xs text-primary/80 mt-2 font-medium">
                    {prompt.remainingLabel}
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              {prompt.isUnlocked ? (
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium whitespace-nowrap">
                  Unlocked
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-muted/30 text-muted-foreground text-xs font-medium whitespace-nowrap">
                  {prompt.progressLabel}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/30">
        <button
          onClick={handlePromptClick}
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          See all your achievements →
        </button>
      </div>
    </div>
  );
};
