/**
 * HubSkeletonV3 - Full page skeleton for Hub with Echo styling
 * Matches exact layout shapes for smooth loading
 */

import React from 'react';

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className || ''}`}
      style={{
        background: 'linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 100%)',
        ...style,
      }}
    />
  );
}

function SkeletonBar({ width, height = 'h-4' }: { width: string; height?: string }) {
  return (
    <div
      className={`${width} ${height} rounded-full animate-pulse`}
      style={{ background: '#e2e8f0' }}
    />
  );
}

function SkeletonCircle({ size }: { size: string }) {
  return (
    <div
      className={`${size} rounded-full animate-pulse`}
      style={{ background: '#e2e8f0' }}
    />
  );
}

/**
 * Full page skeleton matching Hub layout
 */
export function HubSkeletonV3() {
  return (
    <div
      className="min-h-screen pb-20"
      style={{ background: '#F8FAFC' }}
    >
      {/* Header skeleton */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <SkeletonBar width="w-48" height="h-7" />
        <SkeletonCircle size="h-10 w-10" />
      </div>

      {/* Hero card skeleton */}
      <div className="px-5 mb-4">
        <SkeletonBlock className="h-[200px]" />
      </div>

      {/* Toggle bar skeleton */}
      <div className="px-5 mb-6">
        <div
          className="h-12 rounded-[14px]"
          style={{ background: '#e2e8f0' }}
        />
      </div>

      {/* Section header skeleton */}
      <div className="px-5 mb-3 flex items-center gap-2">
        <SkeletonBar width="w-32" height="h-4" />
        <div
          className="h-[2px] w-8 rounded-full"
          style={{ background: 'linear-gradient(90deg, #22c55e 0%, transparent 100%)' }}
        />
      </div>

      {/* Card skeletons - What's Happening */}
      <div className="px-5 space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-12 h-12 rounded-[14px]" />
              <div className="flex-1 space-y-2">
                <SkeletonBar width="w-3/4" height="h-4" />
                <SkeletonBar width="w-1/2" height="h-3" />
              </div>
              <SkeletonBar width="w-12" height="h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Second section skeleton - Your World */}
      <div className="px-5 mt-6 mb-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SkeletonBar width="w-24" height="h-4" />
          <div
            className="h-[2px] w-8 rounded-full"
            style={{ background: 'linear-gradient(90deg, #22c55e 0%, transparent 100%)' }}
          />
        </div>
        <SkeletonBar width="w-16" height="h-4" />
      </div>

      <div className="px-5 space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-12 h-12 rounded-[14px]" />
              <div className="flex-1 space-y-2">
                <SkeletonBar width="w-2/3" height="h-4" />
                <SkeletonBar width="w-1/3" height="h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer pill skeleton */}
      <div className="flex justify-center mt-6">
        <SkeletonBar width="w-48" height="h-8" />
      </div>
    </div>
  );
}

/**
 * Inline content skeleton (for use inside Hub when only content is loading)
 */
export function HubContentSkeletonV3() {
  return (
    <>
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <SkeletonBar width="w-48" height="h-7" />
        <SkeletonCircle size="h-10 w-10" />
      </div>

      {/* Hero card skeleton */}
      <SkeletonBlock className="h-[200px] mb-4" />

      {/* Toggle bar skeleton */}
      <div
        className="h-12 rounded-[14px] mb-6"
        style={{ background: '#e2e8f0' }}
      />

      {/* Section header skeleton */}
      <div className="mb-3 flex items-center gap-2">
        <SkeletonBar width="w-32" height="h-4" />
        <div
          className="h-[2px] w-8 rounded-full"
          style={{ background: 'linear-gradient(90deg, #22c55e 0%, transparent 100%)' }}
        />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-12 h-12 rounded-[14px]" />
              <div className="flex-1 space-y-2">
                <SkeletonBar width="w-3/4" height="h-4" />
                <SkeletonBar width="w-1/2" height="h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
