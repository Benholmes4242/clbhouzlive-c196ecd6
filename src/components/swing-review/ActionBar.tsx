import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Plus } from 'lucide-react';

interface ActionBarProps {
  onShare?: () => void;
  onAddVoiceNote?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onShare,
  onAddVoiceNote
}) => {
  return (
    <div className="flex gap-2 pt-2 border-t border-border">
      {onShare && (
        <Button
          onClick={onShare}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share My Swing
        </Button>
      )}
      
      {onAddVoiceNote && (
        <Button
          onClick={onAddVoiceNote}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Voice Note
        </Button>
      )}
    </div>
  );
};