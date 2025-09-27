import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MarkdownMessage } from '@/components/ai-chat/MarkdownMessage';

interface AiFeedbackBlockProps {
  analysis: {
    content: string;
    save_card?: string;
  };
  defaultCollapsed?: boolean;
}

export const AiFeedbackBlock: React.FC<AiFeedbackBlockProps> = ({
  analysis,
  defaultCollapsed = true
}) => {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary">AI</span>
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              {analysis.save_card || 'Swing Analysis'}
            </h4>
            
            <MarkdownMessage content={analysis.content} />
          </div>
        </div>
      </div>
    </Card>
  );
};