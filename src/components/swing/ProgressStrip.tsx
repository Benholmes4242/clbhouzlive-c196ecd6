import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProgressStripProps {
  currentStep: 'extracting' | 'analyzing' | 'saving' | 'preparing' | 'complete';
  onCancel?: () => void;
  progress?: number;
}

export const ProgressStrip: React.FC<ProgressStripProps> = ({
  currentStep,
  onCancel,
  progress = 0
}) => {
  const steps = [
    { key: 'extracting', label: 'Extracting frames' },
    { key: 'analyzing', label: 'Analyzing' },
    { key: 'saving', label: 'Saving' },
    { key: 'preparing', label: 'Preparing visuals' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const canCancel = currentStep === 'extracting' || currentStep === 'analyzing';

  return (
    <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
          </div>
          <span className="text-sm font-medium">
            {steps[currentStepIndex]?.label || 'Processing...'}
          </span>
        </div>
        
        {canCancel && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center gap-1">
                {index < currentStepIndex ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : index === currentStepIndex ? (
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-muted" />
                )}
                <span className={index <= currentStepIndex ? 'text-foreground' : ''}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};