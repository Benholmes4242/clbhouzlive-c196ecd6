/**
 * EchoErrorCard - Glass error state in chat flow
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
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.08) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}
      >
        <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
      </div>

      {/* Error card */}
      <div 
        className="flex-1 rounded-2xl rounded-tl-md p-4"
        style={{
          background: 'rgba(254, 242, 242, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(239, 68, 68, 0.1)',
          boxShadow: '0 2px 12px rgba(239, 68, 68, 0.06)',
        }}
      >
        <h4 
          className="text-[14px] font-semibold mb-1"
          style={{ color: '#b91c1c' }}
        >
          Couldn't reach Echo
        </h4>
        <p 
          className="text-[13px] mb-3"
          style={{ color: '#dc2626' }}
        >
          Check your connection and try again.
        </p>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all active:scale-95"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
          <button
            onClick={handleDismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all active:scale-95"
            style={{
              background: 'transparent',
              color: '#9ca3af',
            }}
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
