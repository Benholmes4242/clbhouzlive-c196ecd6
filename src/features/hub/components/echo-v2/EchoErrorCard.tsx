/**
 * EchoErrorCard - Glass error state in chat flow
 * Uses explicit light styling
 */

import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { haptic } from '@/utils/haptics';

interface EchoErrorCardProps {
  onRetry: () => void;
  onDismiss: () => void;
}

export function EchoErrorCard({ onRetry, onDismiss }: EchoErrorCardProps) {
  const handleRetry = () => {
    haptic('medium');
    onRetry();
  };

  const handleDismiss = () => {
    haptic('light');
    onDismiss();
  };

  return (
    <div className="flex gap-2.5">
      {/* Error icon */}
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-red-50 border border-red-200"
      >
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      </div>

      {/* Error card */}
      <div 
        className="flex-1 rounded-2xl rounded-tl-md p-4 bg-red-50/80 backdrop-blur-md border border-red-200/50 shadow-sm"
      >
        <h4 className="text-[14px] font-semibold mb-1 text-red-800">
          Couldn't reach Echo
        </h4>
        <p className="text-[13px] mb-3 text-red-600">
          Check your connection and try again.
        </p>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all active:scale-95 bg-red-100 text-red-700 hover:bg-red-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
          <button
            onClick={handleDismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all active:scale-95 text-slate-500 hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
