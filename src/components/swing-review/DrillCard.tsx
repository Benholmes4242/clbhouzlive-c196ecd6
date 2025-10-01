import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2, CheckCircle2 } from 'lucide-react';
import { SwingDrill } from './SwingReview';

interface DrillCardProps {
  drill: SwingDrill;
}

export const DrillCard: React.FC<DrillCardProps> = ({ drill }) => {
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    new Array(drill.steps.length).fill(false)
  );
  const [setsCompleted, setSetsCompleted] = useState(0);

  const handleStepToggle = (index: number) => {
    const newCompleted = [...completedSteps];
    newCompleted[index] = !newCompleted[index];
    setCompletedSteps(newCompleted);
  };

  const allStepsCompleted = completedSteps.every(Boolean);

  return (
    <Card className="border-brand-orange/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          🎬 {drill.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Demo video */}
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="text-center">
            <Button size="sm" className="bg-brand-orange hover:bg-brand-orange-light text-white">
              <Play className="h-4 w-4 mr-1" />
              Play Demo
            </Button>
            <p className="text-xs text-muted-foreground mt-1">30-45s demo</p>
          </div>
        </div>

        {/* Steps checklist */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Steps:</p>
          {drill.steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Checkbox
                id={`step-${index}`}
                checked={completedSteps[index]}
                onCheckedChange={() => handleStepToggle(index)}
                className="mt-0.5"
              />
              <label
                htmlFor={`step-${index}`}
                className={`text-sm cursor-pointer leading-relaxed ${
                  completedSteps[index] ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {step}
              </label>
            </div>
          ))}
        </div>

        {/* Target feel */}
        <div className="bg-brand-orange/5 rounded-lg p-3 border border-brand-orange/20">
          <p className="text-sm">
            <span className="font-medium text-brand-orange">🧠 Target feel:</span>{' '}
            <span className="text-foreground">{drill.targetFeel}</span>
          </p>
        </div>

        {/* Goal and logging */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium">🔁 Goal: {drill.reps}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                Sets: {setsCompleted}/3
              </Badge>
            </div>
          </div>
          
          <Button
            size="sm"
            variant={allStepsCompleted ? "default" : "outline"}
            onClick={() => setSetsCompleted(prev => Math.min(prev + 1, 3))}
            disabled={!allStepsCompleted}
            className={allStepsCompleted ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Mark Set Complete
          </Button>
        </div>

        {/* Optional coach tip audio */}
        <Button variant="ghost" size="sm" className="w-full text-xs">
          <Volume2 className="h-3 w-3 mr-1" />
          Coach tip audio (0:22)
        </Button>
      </CardContent>
    </Card>
  );
};