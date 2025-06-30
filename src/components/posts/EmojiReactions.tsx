
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Reaction {
  emoji: string;
  label: string;
  count: number;
  userReacted: boolean;
}

interface EmojiReactionsProps {
  postId: string;
  reactions?: Reaction[];
  onReact?: (emoji: string) => void;
}

const EmojiReactions = ({ postId, reactions = [], onReact }: EmojiReactionsProps) => {
  const [localReactions, setLocalReactions] = useState<Reaction[]>([
    { emoji: '❤️', label: 'Like', count: 0, userReacted: false },
    { emoji: '⛳', label: 'Nice Shot', count: 0, userReacted: false },
    { emoji: '🔥', label: 'Hot', count: 0, userReacted: false },
    ...reactions
  ]);

  const handleReactionClick = (emoji: string) => {
    setLocalReactions(prev => prev.map(reaction => {
      if (reaction.emoji === emoji) {
        const newUserReacted = !reaction.userReacted;
        return {
          ...reaction,
          count: newUserReacted ? reaction.count + 1 : Math.max(0, reaction.count - 1),
          userReacted: newUserReacted
        };
      }
      return reaction;
    }));
    
    onReact?.(emoji);
  };

  return (
    <div className="flex items-center space-x-2 py-2">
      {localReactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          className={`flex items-center space-x-1 px-2 py-1 h-auto text-sm hover:bg-accent transition-colors ${
            reaction.userReacted ? 'bg-accent text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => handleReactionClick(reaction.emoji)}
        >
          <span className="text-base">{reaction.emoji}</span>
          {reaction.count > 0 && (
            <span className="text-xs font-medium">{reaction.count}</span>
          )}
        </Button>
      ))}
    </div>
  );
};

export default EmojiReactions;
