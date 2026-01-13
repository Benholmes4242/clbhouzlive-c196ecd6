import React from 'react';
import { cn } from '@/lib/utils';

// Base shimmer animation
const shimmerClass = 'animate-pulse bg-muted';

// Generic skeleton block
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn(shimmerClass, 'rounded', className)} />;
}

// Game Card Skeleton
export function GameCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Skeleton className="w-20 h-6 rounded-full" />
        <Skeleton className="w-16 h-4" />
      </div>
    </div>
  );
}

// Trip Card Skeleton
export function TripCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  );
}

// Game Detail Skeleton
export function GameDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 mx-4">
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </header>
      
      {/* Tabs */}
      <div className="flex border-b border-border px-4">
        <Skeleton className="flex-1 h-10 mx-1" />
        <Skeleton className="flex-1 h-10 mx-1" />
        <Skeleton className="flex-1 h-10 mx-1" />
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      
      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="flex-1 h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Trip Detail Skeleton
export function TripDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 mx-4">
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </header>
      
      <div className="flex border-b border-border px-4">
        <Skeleton className="flex-1 h-10 mx-1" />
        <Skeleton className="flex-1 h-10 mx-1" />
        <Skeleton className="flex-1 h-10 mx-1" />
      </div>
      
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

// Player List Skeleton
export function PlayerListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Message List Skeleton
export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'flex gap-3',
            i % 2 === 0 ? 'justify-start' : 'justify-end'
          )}
        >
          {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full" />}
          <Skeleton 
            className={cn(
              'h-12 rounded-2xl',
              i % 2 === 0 ? 'w-48' : 'w-40'
            )} 
          />
        </div>
      ))}
    </div>
  );
}

// Hub Home Skeleton
export function HubHomeSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background pb-24">
      <header className="px-4 pt-12 pb-6">
        <Skeleton className="h-8 w-48" />
      </header>
      
      <div className="px-4 space-y-6">
        {/* Hero card */}
        <Skeleton className="h-32 rounded-2xl" />
        
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        
        {/* List items */}
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

// List Skeleton (generic)
export function ListSkeleton({ 
  count = 4, 
  CardComponent = GameCardSkeleton 
}: { 
  count?: number;
  CardComponent?: React.ComponentType;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
}
