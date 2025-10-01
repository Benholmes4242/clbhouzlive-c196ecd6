import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { SwingPhase } from './SwingReview';

interface PhaseCardProps {
  phase: SwingPhase;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase }) => {
  const [showDetail, setShowDetail] = useState(false);

  const getStatusColor = (status: SwingPhase['status']) => {
    switch (status) {
      case 'strong':
        return 'text-green-600';
      case 'tip':
        return 'text-amber-600';
      case 'fix':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {phase.name}
          <span className={`text-sm ${getStatusColor(phase.status)}`}>
            {phase.status === 'strong' && '✅'}
            {phase.status === 'tip' && '🟡'}
            {phase.status === 'fix' && '🔴'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Short looping clip placeholder */}
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
          Phase video clip (1-2s loop)
        </div>

        {/* Compact blocks */}
        <div className="space-y-2">
          {/* Observation */}
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Observation</p>
            <p className="text-muted-foreground">{phase.observation}</p>
          </div>

          {/* Strength */}
          {phase.strength && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-700">Strength</p>
                <p className="text-green-600">{phase.strength}</p>
              </div>
            </div>
          )}

          {/* Tip */}
          {phase.tip && (
            <div className="flex items-start gap-2 text-sm">
              <Target className="h-4 w-4 text-brand-orange mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-brand-orange">Tip</p>
                <p className="text-foreground">{phase.tip}</p>
              </div>
            </div>
          )}
        </div>

        {/* Coach toggle */}
        <Collapsible open={showDetail} onOpenChange={setShowDetail}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <span className="mr-2">Show more detail</span>
              {showDetail ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              Detailed analysis and coaching notes would appear here when expanded.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};