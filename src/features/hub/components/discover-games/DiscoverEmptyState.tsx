/**
 * DiscoverEmptyState - Empty and error states for discover games & trips
 * Tab-aware messaging
 */

import React from 'react';
import { Search, AlertCircle, RefreshCw, Plane } from 'lucide-react';

interface DiscoverEmptyStateProps {
  type: 'empty' | 'error';
  entityType?: 'games' | 'trips';
  onRetry?: () => void;
}

export function DiscoverEmptyState({ type, entityType = 'games', onRetry }: DiscoverEmptyStateProps) {
  const isTrips = entityType === 'trips';
  
  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.1)' }}
        >
          <AlertCircle className="w-6 h-6" style={{ color: 'rgba(220, 38, 38, 0.7)' }} />
        </div>
        <h3 
          className="text-[15px] font-semibold mb-1"
          style={{ color: '#1e293b' }}
        >
          Something went wrong
        </h3>
        <p 
          className="text-[13px] mb-4"
          style={{ color: 'rgba(100, 116, 139, 0.7)' }}
        >
          We couldn't load {isTrips ? 'trips' : 'games'}. Please try again.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-150 hover:bg-black/5"
            style={{
              background: 'rgba(0, 0, 0, 0.04)',
              color: '#1e293b',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(100, 116, 139, 0.08)' }}
      >
        {isTrips ? (
          <Plane className="w-6 h-6" style={{ color: 'rgba(100, 116, 139, 0.5)' }} />
        ) : (
          <Search className="w-6 h-6" style={{ color: 'rgba(100, 116, 139, 0.5)' }} />
        )}
      </div>
      <h3 
        className="text-[15px] font-semibold mb-1"
        style={{ color: '#1e293b' }}
      >
        No {isTrips ? 'trips' : 'games'} found
      </h3>
      <p 
        className="text-[13px]"
        style={{ color: 'rgba(100, 116, 139, 0.7)' }}
      >
        {isTrips 
          ? 'No trips match your search criteria. Check back later!'
          : 'Try adjusting your filters or check back later for new games.'
        }
      </p>
    </div>
  );
}
