/**
 * QuestPageSkeleton - Full page loading skeleton for Quest page
 * Matches the actual page structure with pulse animations
 */

import React from 'react';
import { EliteGameCardSkeleton } from '@/components/achievements/EliteGameCardSkeleton';

export const QuestPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <div className="px-4 pt-4 pb-2">
      <div className="w-16 h-4 rounded bg-muted animate-pulse mb-5" />
      <div className="flex flex-col items-center">
        <div className="w-48 h-8 rounded bg-muted animate-pulse mb-2" />
        <div className="w-64 h-4 rounded bg-muted animate-pulse" />
      </div>
    </div>
    
    {/* Hero skeleton */}
    <div className="px-4 pt-6 pb-8">
      <div className="flex flex-col items-center">
        <div className="w-28 h-7 rounded-full bg-muted animate-pulse mb-6" />
        <div className="w-[72px] h-[72px] rounded-2xl bg-muted animate-pulse mb-6" />
        <div className="w-40 h-14 rounded bg-muted animate-pulse mb-2" />
        <div className="w-48 h-4 rounded bg-muted animate-pulse mb-5" />
        <div className="w-56 h-2.5 rounded-full bg-muted animate-pulse mb-4" />
        <div className="w-40 h-10 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
    
    {/* Trophy case skeleton */}
    <div className="px-4 mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-24 h-4 rounded bg-muted animate-pulse" />
        <div className="w-40 h-8 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <EliteGameCardSkeleton key={i} variant="compact" />
        ))}
      </div>
    </div>
    
    {/* Next target skeleton */}
    <div className="px-4 mb-10">
      <div className="w-24 h-4 rounded bg-muted animate-pulse mb-4" />
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="space-y-3">
          <div className="w-32 h-5 rounded bg-muted animate-pulse" />
          <div className="w-full h-2 rounded-full bg-muted animate-pulse" />
          <div className="w-48 h-4 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
    
    {/* Journey map skeleton */}
    <div className="px-4 mb-12">
      <div className="w-28 h-4 rounded bg-muted animate-pulse mb-4" />
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <EliteGameCardSkeleton key={i} variant="large" />
          ))}
        </div>
      </div>
    </div>
    
    {/* Regional progress skeleton */}
    <div className="px-4 mb-12">
      <div className="w-32 h-4 rounded bg-muted animate-pulse mb-4" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                <div className="w-32 h-4 rounded bg-muted animate-pulse" />
              </div>
              <div className="w-20 h-4 rounded bg-muted animate-pulse" />
            </div>
            <div className="w-full h-2 rounded-full bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default QuestPageSkeleton;
