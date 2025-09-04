import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Bookmark } from 'lucide-react';

interface ActionBarProps {
  onShare?: () => void;
  onAskEcho?: () => void;
  onSaveToInsights?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onShare,
  onAskEcho,
  onSaveToInsights
}) => {
  return (
    <div className="flex gap-2 pt-2 border-t border-border">
      {onSaveToInsights && (
        <Button
          onClick={onSaveToInsights}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Bookmark className="h-4 w-4 mr-1" />
          Save to Insights
        </Button>
      )}
      
      {onShare && (
        <Button
          onClick={onShare}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share with Coach
        </Button>
      )}
      
      {onAskEcho && (
        <Button
          onClick={onAskEcho}
          size="sm"
          className="flex-1 bg-brand-orange hover:bg-brand-orange-light text-white"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Ask Echo About This
        </Button>
      )}
    </div>
  );
};