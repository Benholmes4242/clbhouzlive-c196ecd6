import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, Target, Play } from 'lucide-react';

interface PriorityFixProps {
  fix: {
    title: string;
    why: string;
    howToFeel: string;
    microTask: string;
  };
}

export const PriorityFixBar: React.FC<PriorityFixProps> = ({ fix }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-auto p-4 justify-between hover:bg-amber-100/50 transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-amber-600" />
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-900">
                  #1 Priority: {fix.title}
                </p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-amber-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-600" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-3 pt-2">
            <div className="text-sm text-amber-800">
              <p><strong>Why it matters:</strong> {fix.why}</p>
            </div>
            
            <div className="text-sm text-amber-800">
              <p><strong>How to feel it:</strong> {fix.howToFeel}</p>
            </div>
            
            <div className="flex items-center justify-between bg-white/60 rounded-lg p-3 border border-amber-200/50">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="micro-task"
                  checked={taskCompleted}
                  onCheckedChange={(checked) => setTaskCompleted(checked === true)}
                />
                <label 
                  htmlFor="micro-task" 
                  className="text-sm font-medium text-amber-900 cursor-pointer"
                >
                  {fix.microTask}
                </label>
              </div>
              
              <Button 
                size="sm" 
                className="bg-brand-orange hover:bg-brand-orange-light text-white"
              >
                <Play className="h-3 w-3 mr-1" />
                Start Drill
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};