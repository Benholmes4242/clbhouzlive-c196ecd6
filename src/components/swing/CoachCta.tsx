import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CoachCtaProps {
  analysisId: string;
  onOpenCoachPicker: () => void;
}

export const CoachCta: React.FC<CoachCtaProps> = ({
  analysisId,
  onOpenCoachPicker
}) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            Get a local pro's take
          </h4>
          <p className="text-xs text-muted-foreground">
            Secure share. Typical response ≈ 24–48h.
          </p>
        </div>
        
        <Button
          onClick={onOpenCoachPicker}
          className="gap-2"
          size="sm"
        >
          <Users className="h-4 w-4" />
          Find Coach
        </Button>
      </div>
    </Card>
  );
};