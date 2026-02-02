/**
 * HubSkeleton - Loading states for Hub 2.0 (Phase 5)
 * Zero spinners - elegant skeleton loading
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
      className={`bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
    />
  );
}

// Header skeleton
export function HubHeaderSkeleton() {
  return (
    <header className="px-5 pt-3 pb-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="h-7 w-48 rounded-lg" />
          <SkeletonPulse className="h-4 w-32 rounded" />
        </div>
        <SkeletonPulse className="w-11 h-11 rounded-[34%]" />
      </div>
    </header>
  );
}

// Messages card skeleton
export function HubMessagesCardSkeleton() {
  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.75) 50%, rgba(255, 255, 255, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-10 h-10 rounded-xl" />
          <SkeletonPulse className="h-5 w-24 rounded" />
        </div>
        <SkeletonPulse className="w-5 h-5 rounded" />
      </div>
      
      {/* Conversation previews */}
      <div className="px-4 pb-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2.5">
            <SkeletonPulse className="w-11 h-11 rounded-[34%] flex-shrink-0" />
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
      
      {/* Quick actions */}
      <div className="px-4 pb-4 flex gap-2">
        <SkeletonPulse className="flex-1 h-10 rounded-full" />
        <SkeletonPulse className="flex-1 h-10 rounded-full" />
      </div>
    </div>
  );
}

// Echo card skeleton
export function HubEchoCardSkeleton() {
  return (
    <div 
      className="rounded-2xl overflow-visible relative"
      style={{
        marginTop: '48px',
        background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.12) 0%, rgba(247, 147, 30, 0.08) 50%, rgba(245, 166, 35, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(245, 166, 35, 0.25)',
        boxShadow: '0 8px 32px rgba(245, 166, 35, 0.15)',
      }}
    >
      {/* Mascot placeholder */}
      <div 
        className="absolute"
        style={{
          left: '16px',
          top: '-56px',
          width: '100px',
          height: '100px',
        }}
      >
        <SkeletonPulse className="w-full h-full rounded-full" />
      </div>
      
      {/* Header */}
      <div className="p-4 pb-3 pl-28">
        <SkeletonPulse className="h-5 w-16 rounded mb-2" />
        <SkeletonPulse className="h-4 w-40 rounded" />
      </div>
      
      {/* Quick prompts */}
      <div className="px-4 pb-3 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>
      
      {/* Input field */}
      <div className="px-4 pb-4">
        <SkeletonPulse className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Grapevine skeleton
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
            className="flex-shrink-0 w-[160px] p-3 rounded-xl bg-muted/30 border border-muted"
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

// Full page skeleton
export function HubPageSkeleton() {
  return (
    <div 
      className="min-h-screen relative"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <HubHeaderSkeleton />
      
      <div className="flex flex-col gap-4 px-4">
        <HubMessagesCardSkeleton />
        <HubEchoCardSkeleton />
      </div>
      
      <div className="mt-4">
        <GolfGrapevineSkeleton />
      </div>
    </div>
  );
}
