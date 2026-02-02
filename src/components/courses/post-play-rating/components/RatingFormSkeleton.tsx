import React from 'react';

/**
 * Loading skeleton for the rating form
 */
const RatingFormSkeleton = React.memo(function RatingFormSkeleton() {
  return (
    <div className="fixed inset-0 z-[999] bg-background overflow-y-auto">
      <div className="min-h-screen bg-background pb-24">
        {/* Header with back button - Section A (light) */}
        <div className="relative h-64 bg-slate-50">
          <div className="animate-pulse bg-slate-200 h-full w-full" />
          <div className="absolute top-4 left-4">
            <div className="h-9 w-9 rounded-md bg-white/20" />
          </div>
        </div>

        <div className="space-y-0">
          {/* Overall rating section - Section A continued (light) */}
          <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-50">
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded-full animate-pulse" />
            <div className="h-8 w-32 bg-muted rounded-full mx-auto animate-pulse" />
          </div>

          {/* Share thoughts textarea - Section B (dark) */}
          <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-100">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-32 w-full bg-muted rounded-2xl animate-pulse" />
          </div>

          {/* Breakdown section - Section C (light) */}
          <div className="space-y-4 px-6 pt-6 pb-3 bg-slate-50">
            <div className="h-5 w-56 bg-muted rounded animate-pulse" />
            
            {/* 4 breakdown sliders */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-muted rounded-full ml-auto animate-pulse" />
              </div>
            ))}
          </div>

          {/* Media upload section - Section D (dark) */}
          <div className="space-y-3 px-6 pt-6 pb-3 bg-slate-100">
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-muted rounded-lg animate-pulse" />
              <div className="aspect-square bg-muted rounded-lg animate-pulse" />
              <div className="aspect-square bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="h-3 w-64 bg-muted rounded animate-pulse" />
          </div>

          {/* Primary button - Section E (light) */}
          <div className="flex w-full items-center justify-between gap-3 px-6 pt-6 pb-3 bg-slate-50">
            <div className="h-11 flex-1 bg-muted rounded-lg animate-pulse" />
            <div className="h-11 flex-1 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default RatingFormSkeleton;
