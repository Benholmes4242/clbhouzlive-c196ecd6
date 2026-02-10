/**
 * ExploreErrorState - Consistent error state component for Explore sections
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ExploreErrorStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export const ExploreErrorState: React.FC<ExploreErrorStateProps> = ({
  message = 'Something went wrong',
  onRetry,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className || ''}`}>
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors active:scale-[0.97]"
      >
        Try Again
      </button>
    </div>
  );
};

export default ExploreErrorState;
