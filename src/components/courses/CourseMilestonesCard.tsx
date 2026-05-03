import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseAchievementPrompts } from '@/hooks/useCourseAchievementPrompts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CourseMilestonesCardProps {
  courseId: string;
}

const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'skill': return '🎯';
    case 'exploration': return '🌍';
    case 'social': return '👥';
    default: return '🏆';
  }
};

export const CourseMilestonesCard: React.FC<CourseMilestonesCardProps> = ({ courseId }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const prompts = useCourseAchievementPrompts(courseId, user?.id);

  if (!user || prompts.length === 0) return null;

  const handlePromptClick = () => {
    navigate('/profile');
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-sq-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Milestones you're working toward
      </h3>
      
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <button
            key={prompt.code}
            onClick={handlePromptClick}
            className="w-full flex items-center justify-between p-3 rounded-sq-sm bg-background/30 hover:bg-background/50 transition-all duration-200 hover:scale-[1.01] group"
          >
            <div className="flex items-center gap-3 flex-1 text-left">
              <span className="text-2xl">{getCategoryEmoji(prompt.category)}</span>
              <div className="flex-1">
                <div className="font-medium text-foreground group-hover:text-secondary transition-all duration-motion-fast ease-standard">
                  {prompt.name}
                </div>
                {prompt.remainingLabel && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {prompt.remainingLabel}
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-4">
              {prompt.isUnlocked ? (
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  Unlocked
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-muted/30 text-muted-foreground text-xs font-medium">
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
          className="text-sm text-foreground hover:text-secondary transition-all duration-motion-fast ease-standard font-medium"
        >
          See all your achievements →
        </button>
      </div>
    </div>
  );
};
