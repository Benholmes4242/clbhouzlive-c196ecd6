import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const SkeletonBlock: React.FC<{ className?: string; style?: React.CSSProperties; dark?: boolean }> = ({
  className = '',
  style,
  dark = false,
}) => (
  <Skeleton
    variant={dark ? 'dark' : 'light'}
    className={`rounded-[4px] ${className}`}
    style={style}
  />
);

export const PostsFeedSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-px pt-2 pb-6">
      {/* Hero review skeleton */}
      <div
        className="overflow-hidden"
        style={{ background: '#0F172A', borderTop: '0.5px solid rgba(247,147,30,0.2)', borderBottom: '0.5px solid rgba(247,147,30,0.2)' }}
      >
        <div
          style={{
            height: 2,
            background: 'linear-gradient(90deg, rgba(247,147,30,0.5) 0%, transparent 70%)',
          }}
        />
        <div className="relative w-full bg-slate-800/50" style={{ aspectRatio: '16 / 10' }}>
          <SkeletonBlock
            dark
            className="absolute"
            style={{ top: 12, right: 14, width: 56, height: 36 }}
          />
          <div className="absolute" style={{ left: 14, right: 100, bottom: 12 }}>
            <SkeletonBlock dark style={{ width: '70%', height: 22, marginBottom: 6 }} />
            <SkeletonBlock dark style={{ width: 120, height: 10 }} />
          </div>
        </div>
        <div className="px-3.5 pt-2.5 pb-3 flex flex-col gap-1.5">
          <SkeletonBlock style={{ width: '90%', height: 12 }} />
          <SkeletonBlock style={{ width: '55%', height: 12 }} />
        </div>
      </div>

      {/* LongForm skeleton */}
      <div
        className="overflow-hidden bg-white"
        style={{ borderTop: '0.5px solid rgba(15,23,42,0.06)', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}
      >
        <div className="relative w-full bg-slate-200" style={{ aspectRatio: '16 / 9' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <SkeletonBlock className="rounded-full" style={{ width: 56, height: 56 }} />
          </div>
        </div>
        <div className="px-3.5 pt-3 pb-3.5 flex flex-col gap-1.5">
          <SkeletonBlock style={{ width: '85%', height: 13 }} />
          <SkeletonBlock style={{ width: '45%', height: 13 }} />
          <div className="flex items-center gap-2 mt-1">
            <SkeletonBlock style={{ width: 80, height: 10 }} />
            <SkeletonBlock style={{ width: 50, height: 10 }} />
          </div>
        </div>
      </div>

      {/* Compact row skeleton — 2-up with header */}
      <div className="flex flex-col gap-1.5">
        <SkeletonBlock style={{ width: 80, height: 11, marginLeft: 14 }} />
        <div className="grid grid-cols-2 gap-px">
          {[0, 1].map((i) => (
            <Skeleton
              key={i}
              className="relative overflow-hidden rounded-none"
              style={{ aspectRatio: '4 / 5' }}
            />
          ))}
        </div>
      </div>

      {/* Second compact row */}
      <div className="grid grid-cols-2 gap-px">
        {[0, 1].map((i) => (
          <Skeleton
            key={i}
            className="relative overflow-hidden rounded-none"
            style={{ aspectRatio: '4 / 5' }}
          />
        ))}
      </div>
    </div>
  );
};
