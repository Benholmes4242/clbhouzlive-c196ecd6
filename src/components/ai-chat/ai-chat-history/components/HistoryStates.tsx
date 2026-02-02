/**
 * History States Components
 * Skeleton loading, empty state, and error state components
 */

import React, { memo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Skeleton Loading Card
 */
export const SkeletonCard: React.FC = memo(() => (
  <div className="h-[92px] rounded-2xl bg-white/04 border border-white/06 animate-pulse" />
));

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Empty State Component
 */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export const EmptyState: React.FC<EmptyStateProps> = memo(({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32 space-y-5">
    <div className="h-24 w-24 rounded-full bg-white/08 backdrop-blur border border-white/12 grid place-items-center text-white/60">
      {icon}
    </div>
    <div className="font-display text-heading-lg font-semibold leading-snug text-white">
      {title}
    </div>
    <div className="text-body-md text-white/60 max-w-[280px]">
      {subtitle}
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

/**
 * Error State Component
 */
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = memo(({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 space-y-5">
    <div className="h-20 w-20 rounded-full bg-red-900/20 border border-red-500/20 text-red-400 grid place-items-center">
      <AlertCircle className="h-9 w-9" />
    </div>
    <div className="text-heading-md font-semibold leading-snug text-white">
      Something went wrong
    </div>
    <div className="text-body-md text-white/60 max-w-[280px]">
      {message}
    </div>
    <Button
      variant="secondary"
      onClick={onRetry}
      className="mt-2"
    >
      Retry
    </Button>
  </div>
));

ErrorState.displayName = 'ErrorState';

/**
 * No Search Results Component
 */
interface NoSearchResultsProps {
  onClear: () => void;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = memo(({ onClear }) => (
  <div className="mx-auto w-full max-w-[720px] px-3 sm:px-4 py-10">
    <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/10 text-center px-6 py-10">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full grid place-items-center bg-white border border-black/10 shadow-sm text-gray-700">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="text-heading-md font-semibold text-gray-900">No matches</div>
      <div className="mt-1.5 text-body-sm text-gray-600/90">
        Try a different search term or clear filters.
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="secondary" onClick={onClear}>
          Clear search
        </Button>
      </div>
    </div>
  </div>
));

NoSearchResults.displayName = 'NoSearchResults';
