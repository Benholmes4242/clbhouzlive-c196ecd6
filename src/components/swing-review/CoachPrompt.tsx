import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { CoachFinderModal } from './CoachFinderModal';

interface CoachPromptProps {
  swingAnalysisId: string;
  onOpen?: () => void;
}

export const CoachPrompt: React.FC<CoachPromptProps> = ({ swingAnalysisId, onOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = () => {
    setIsModalOpen(true);
    onOpen?.();
  };
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="font-medium text-foreground mb-1">
          Want a pro to review this in person?
        </div>
        <p className="text-sm text-muted-foreground">
          We can suggest nearby coaches and (optionally) share this video and analysis with them.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          No thanks
        </Button>
        <Button
          onClick={handleOpen}
          size="sm"
        >
          <Users className="h-4 w-4 mr-1" />
          Recommend coaches near me
        </Button>
      </div>
      
      <CoachFinderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        swingAnalysisId={swingAnalysisId}
      />
    </div>
  );
};