import React from 'react';
import { cn } from '@/lib/utils';

interface CommentsSkeletonProps {
  isDark: boolean;
  count?: number;
}

const shimmerClass = "animate-pulse";

export const CommentSkeleton: React.FC<{ isDark: boolean; isReply?: boolean }> = ({ isDark, isReply = false }) => (
  <div className={cn("flex items-start gap-3 py-3", isReply && "pl-[26px]")}>
    {/* Avatar */}
    <div className={cn(
      "rounded-full flex-shrink-0",
      shimmerClass,
      isReply ? "w-7 h-7" : "w-[34px] h-[34px]",
      isDark ? "bg-white/8" : "bg-muted"
    )} />
    <div className="flex-1 space-y-2">
      {/* Name + time */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-3 rounded-full",
          shimmerClass,
          isDark ? "bg-white/8" : "bg-muted",
          isReply ? "w-16" : "w-20"
        )} />
        <div className={cn(
          "h-2.5 w-8 rounded-full",
          shimmerClass,
          isDark ? "bg-white/5" : "bg-muted/70"
        )} />
      </div>
      {/* Text lines */}
      <div className={cn(
        "h-3 rounded-full",
        shimmerClass,
        isDark ? "bg-white/6" : "bg-muted/80",
        isReply ? "w-[75%]" : "w-[85%]"
      )} />
      <div className={cn(
        "h-3 rounded-full",
        shimmerClass,
        isDark ? "bg-white/5" : "bg-muted/60",
        isReply ? "w-[45%]" : "w-[55%]"
      )} />
    </div>
    {/* Like button skeleton */}
    <div className={cn(
      "w-4 h-4 rounded-full flex-shrink-0 mt-3",
      shimmerClass,
      isDark ? "bg-white/6" : "bg-muted/60"
    )} />
  </div>
);

export const CommentsSkeleton: React.FC<CommentsSkeletonProps> = ({ isDark, count = 5 }) => {
  // Stagger shimmer with slightly different widths per item
  return (
    <div className="pl-5 pr-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          <CommentSkeleton isDark={isDark} />
          {/* Show 1 reply skeleton for 2nd and 4th items */}
          {(i === 1 || i === 3) && (
            <CommentSkeleton isDark={isDark} isReply />
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentsSkeleton;
