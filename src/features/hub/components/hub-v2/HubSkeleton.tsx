/**
 * HubSkeleton - Loading states for Hub 2.0
 * Fixed viewport, non-scrolling skeleton layout
 */

import { motion, type Easing } from 'framer-motion';

// Shimmer animation for skeletons
const shimmerVariants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: { 
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear' as Easing,
    },
  },
};

// Skeleton pulse component
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
    />
  );
}

// Header skeleton
export function HubHeaderSkeleton() {
  return (
    <header 
      className="flex-none px-5 pt-6 pb-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="h-8 w-56 rounded-lg" />
          <SkeletonPulse className="h-4 w-36 rounded" />
        </div>
        <SkeletonPulse className="w-14 h-14 rounded-full" />
      </div>
    </header>
  );
}

// Messages card skeleton
export function HubMessagesCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-11 h-11 rounded-2xl" />
          <SkeletonPulse className="h-5 w-24 rounded" />
        </div>
        <SkeletonPulse className="w-5 h-5 rounded" />
      </div>
      
      {/* Conversation previews */}
      <div className="flex-1 min-h-0 overflow-hidden px-5 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <SkeletonPulse className="w-12 h-12 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <SkeletonPulse className="h-4 w-24 rounded" />
                <SkeletonPulse className="h-3 w-8 rounded" />
              </div>
              <SkeletonPulse className="h-3.5 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer buttons */}
      <div className="flex-none px-5 pb-5 pt-3 flex gap-2">
        <SkeletonPulse className="flex-1 h-12 rounded-2xl" />
        <SkeletonPulse className="flex-1 h-12 rounded-2xl" />
      </div>
    </div>
  );
}

// Echo card skeleton
export function HubEchoCardSkeleton() {
  return (
    <div 
      className="h-full flex flex-col rounded-[28px] border border-white/80 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.9) 0%, rgba(254, 215, 170, 0.7) 50%, rgba(255, 255, 255, 0.8) 100%)',
      }}
    >
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonPulse className="h-5 w-12 rounded" />
              <SkeletonPulse className="h-4 w-6 rounded-full" />
            </div>
            <SkeletonPulse className="h-3.5 w-40 rounded" />
          </div>
        </div>
        <SkeletonPulse className="w-5 h-5 rounded" />
      </div>
      
      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden px-5 flex flex-col">
        {/* Whisper card */}
        <SkeletonPulse className="h-14 w-full rounded-2xl" />
        
        {/* Quick prompts */}
        <div className="flex-1 flex items-center py-3">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <SkeletonPulse key={i} className="h-10 w-24 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Input field */}
      <div className="flex-none px-5 pb-5 pt-2">
        <SkeletonPulse className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// Grapevine skeleton (kept for backward compatibility)
export function GolfGrapevineSkeleton() {
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-2">
        <SkeletonPulse className="h-3.5 w-28 rounded" />
        <SkeletonPulse className="h-3 w-12 rounded" />
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[160px] p-3 rounded-xl bg-gray-100/30 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <SkeletonPulse className="w-6 h-6 rounded-full" />
              <SkeletonPulse className="h-3 w-16 rounded" />
            </div>
            <div className="space-y-1.5">
              <SkeletonPulse className="h-3.5 w-full rounded" />
              <SkeletonPulse className="h-3 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Full page skeleton - fixed viewport
export function HubPageSkeleton() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8FAFC]">
      <HubHeaderSkeleton />
      
      <main 
        className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4 px-5 pb-4"
        style={{
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <section className="flex-1 min-h-0 overflow-hidden">
          <HubMessagesCardSkeleton />
        </section>
        <section className="flex-1 min-h-0 overflow-hidden">
          <HubEchoCardSkeleton />
        </section>
      </main>
    </div>
  );
}
