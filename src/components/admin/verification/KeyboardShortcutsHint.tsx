import React from 'react';
import { Keyboard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KeyboardShortcutsHintProps {
  selectMode: boolean;
}

export function KeyboardShortcutsHint({ selectMode }: KeyboardShortcutsHintProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
            <Keyboard className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Shortcuts</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1.5 text-xs">
            {!selectMode ? (
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">S</kbd>
                <span>Enter select mode</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">A</kbd>
                  <span>Approve selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">R</kbd>
                  <span>Reject selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘/Ctrl + A</kbd>
                  <span>Select all</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
                  <span>Clear selection</span>
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
