import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

  // Extract summary from content (first 4-6 lines)
  const lines = analysis.content.split('\n').filter(line => line.trim());
  const summaryLines = lines.slice(0, 6);
  const summary = summaryLines.join('\n');
  
  const hasMoreContent = lines.length > 6;

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
            
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                {summary}
              </div>
            </div>
          </div>

          {hasMoreContent && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-primary hover:text-primary/80 font-medium"
                >
                  {isOpen ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Full breakdown
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {lines.slice(6).join('\n')}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </Card>
  );
};