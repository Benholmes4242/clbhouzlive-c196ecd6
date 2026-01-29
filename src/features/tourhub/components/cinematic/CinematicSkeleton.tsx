/**
 * CinematicSkeleton - Premium shimmer loading skeletons
 * Apple-grade loading states with smooth animations
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Base shimmer component
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg bg-slate-100",
      className
    )}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{ translateX: ['−100%', '100%'] }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Hero section skeleton
export function CinematicHeroSkeleton() {
  return (
    <div className="h-[85vh] min-h-[600px] relative bg-gradient-to-b from-slate-200 to-slate-100">
      {/* Gradient overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-transparent to-transparent" />
      
      {/* Content skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
        {/* Live badge */}
        <Shimmer className="h-6 w-20 rounded-full" />
        
        {/* Tournament name */}
        <Shimmer className="h-10 w-3/4 max-w-md" />
        
        {/* Venue info */}
        <Shimmer className="h-5 w-1/2 max-w-xs" />
        
        {/* Metadata pills */}
        <div className="flex gap-2 pt-2">
          <Shimmer className="h-8 w-24 rounded-full" />
          <Shimmer className="h-8 w-20 rounded-full" />
          <Shimmer className="h-8 w-28 rounded-full" />
        </div>
        
        {/* Mini leaderboard */}
        <div className="mt-6 p-4 rounded-2xl bg-white/50 backdrop-blur-sm">
          <Shimmer className="h-4 w-24 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Shimmer className="w-8 h-8 rounded-full" />
                <Shimmer className="h-4 flex-1 max-w-[120px]" />
                <Shimmer className="h-5 w-12 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// World rank cards skeleton
export function WorldRankShowcaseSkeleton() {
  return (
    <section className="py-8 bg-[#F8FAFC]">
      {/* Header */}
      <div className="px-4 mb-5">
        <Shimmer className="h-3 w-32 mb-2" />
        <Shimmer className="h-6 w-48" />
      </div>
      
      {/* Cards */}
      <div className="flex gap-3 overflow-hidden px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="w-[180px] h-[260px] rounded-3xl overflow-hidden flex-shrink-0 bg-gradient-to-b from-slate-200 to-slate-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-300/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-5 w-24" />
              <Shimmer className="h-3 w-20" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Event cards skeleton
export function ThisWeekSkeleton() {
  return (
    <section className="py-8 px-4 bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Shimmer className="h-6 w-40" />
        <Shimmer className="h-4 w-24" />
      </div>
      
      {/* Timeline */}
      <div className="flex justify-between px-4 py-3 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col items-center">
            <Shimmer className="w-3 h-3 rounded-full" />
            <Shimmer className="h-3 w-8 mt-2" />
          </div>
        ))}
      </div>
      
      {/* Event cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="rounded-2xl border border-slate-200 p-4 bg-slate-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-2">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
            <Shimmer className="h-5 w-3/4 mb-2" />
            <Shimmer className="h-4 w-1/2" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Season dashboard skeleton
export function SeasonDashboardSkeleton() {
  return (
    <section className="py-8 px-4 bg-[#F8FAFC]">
      {/* Header */}
      <div className="mb-5">
        <Shimmer className="h-3 w-32 mb-2" />
        <Shimmer className="h-6 w-44" />
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            className="rounded-2xl border border-slate-200 p-4 bg-white"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shimmer className="w-8 h-8 rounded-lg" />
              <Shimmer className="h-3 w-16" />
            </div>
            <Shimmer className="h-8 w-20 mb-1" />
            <Shimmer className="h-3 w-14" />
          </motion.div>
        ))}
      </div>
      
      {/* Status pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[1, 2, 3, 4].map(i => (
          <Shimmer key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    </section>
  );
}

// Player list skeleton
export function PlayerListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-0 rounded-2xl overflow-hidden bg-white border border-slate-200">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-4 py-4 px-4 border-b border-slate-100 last:border-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Shimmer className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-3 w-20" />
          </div>
          <Shimmer className="h-6 w-12" />
          <Shimmer className="h-5 w-5 rounded" />
        </motion.div>
      ))}
    </div>
  );
}

// Podium skeleton
export function PodiumSkeleton() {
  return (
    <div className="relative h-[280px] flex items-end justify-center gap-3 pb-4">
      {/* 2nd Place */}
      <motion.div
        className="w-[100px] rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-100"
        style={{ height: '65%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="p-3 space-y-2">
          <Shimmer className="w-12 h-12 rounded-full mx-auto" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-4 w-8 mx-auto" />
        </div>
      </motion.div>
      
      {/* 1st Place */}
      <motion.div
        className="w-[110px] rounded-t-2xl bg-gradient-to-b from-amber-100 to-amber-50"
        style={{ height: '85%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.4 }}
      >
        <div className="p-3 space-y-2">
          <Shimmer className="w-14 h-14 rounded-full mx-auto" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-5 w-10 mx-auto" />
        </div>
      </motion.div>
      
      {/* 3rd Place */}
      <motion.div
        className="w-[100px] rounded-t-2xl bg-gradient-to-b from-orange-100 to-orange-50"
        style={{ height: '50%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="p-3 space-y-2">
          <Shimmer className="w-10 h-10 rounded-full mx-auto" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-4 w-8 mx-auto" />
        </div>
      </motion.div>
    </div>
  );
}

// Category grid skeleton
export function CategoryGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section */}
      <div>
        <Shimmer className="h-4 w-32 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
            >
              <Shimmer className="h-16 rounded-xl" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Full page loading overlay
export function PageLoadingOverlay() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated golf ball */}
        <motion.div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 shadow-lg"
          animate={{
            y: [0, -20, 0],
            scale: [1, 0.95, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.p
          className="text-sm font-medium text-slate-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Tour Hub...
        </motion.p>
      </div>
    </motion.div>
  );
}
