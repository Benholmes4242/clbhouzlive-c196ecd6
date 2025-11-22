import React, { useState } from 'react';
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
      <div className="rounded-2xl bg-amber-50/50 border border-amber-200 overflow-hidden shadow-[0_4px_16px_rgba(245,158,11,0.1)] transition-shadow hover:shadow-[0_6px_20px_rgba(245,158,11,0.15)]">
        <CollapsibleTrigger asChild>
          <button
            className="w-full h-auto px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-amber-600" />
              <div className="text-left">
                <p className="text-[14px] font-semibold text-amber-900">
                  #1 Priority: {fix.title}
                </p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-amber-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-600" />
            )}
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 sm:px-5 pb-4 space-y-3 border-t border-amber-200">
            <div className="pt-3 space-y-2">
              <div className="text-body-md font-normal leading-relaxed text-amber-900">
                <p><strong>Why it matters:</strong> {fix.why}</p>
              </div>
              
              <div className="text-body-md font-normal leading-relaxed text-amber-900">
                <p><strong>How to feel it:</strong> {fix.howToFeel}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-white/60 rounded-xl px-3 py-2.5 border border-amber-200/50">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="micro-task"
                  checked={taskCompleted}
                  onCheckedChange={(checked) => setTaskCompleted(checked === true)}
                />
                <label 
                  htmlFor="micro-task" 
                  className="text-[14px] font-medium text-amber-900 cursor-pointer"
                >
                  {fix.microTask}
                </label>
              </div>
              
              <button 
                className="h-9 px-4 rounded-full bg-[#2A9D8F] text-white text-[14px] shadow-md hover:brightness-105 transition flex items-center gap-1.5"
              >
                <Play className="h-3 w-3" />
                Start Drill
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};