import React, { useEffect, useState } from 'react';
import { MapPin, Lock, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface JourneyHeroProps {
  coursesPlayed: number;
  uniqueClubs: number;
  newCoursesThisYear: number;
  isOwnProfile: boolean;
  onAddCourse?: () => void;
}

const MILESTONES = [
  { target: 10, name: '10 Club' },
  { target: 25, name: '25 Club' },
  { target: 50, name: '50 Club' },
  { target: 100, name: '100 Club' },
  { target: 150, name: '150 Club' },
  { target: 200, name: '200 Club' },
  { target: 250, name: '250 Club' },
  { target: 300, name: '300 Club' },
  { target: 400, name: '400 Club' },
  { target: 500, name: '500 Club' },
];

export const JourneyHero: React.FC<JourneyHeroProps> = ({
  coursesPlayed,
  uniqueClubs,
  newCoursesThisYear,
  isOwnProfile,
  onAddCourse,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Calculate next milestone
  const nextMilestone = MILESTONES.find(m => m.target > coursesPlayed) || MILESTONES[MILESTONES.length - 1];
  const previousMilestone = MILESTONES.filter(m => m.target <= coursesPlayed).pop();
  const coursesToNextMilestone = nextMilestone.target - coursesPlayed;
  
  // Calculate progress from previous milestone (or 0) to next milestone
  const progressBase = previousMilestone?.target || 0;
  const progressRange = nextMilestone.target - progressBase;
  const progressValue = coursesPlayed - progressBase;
  const progressPercent = Math.min((progressValue / progressRange) * 100, 100);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  // Empty state
  if (coursesPlayed === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-stone-50/80 to-slate-100 border border-slate-200/60 rounded-sq-lg p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {isOwnProfile ? 'Start your course journey' : 'No courses played yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
              {isOwnProfile 
                ? 'Play and rate your first course to unlock your journey stats.'
                : 'This golfer hasn\'t logged any courses yet.'}
            </p>
          </div>
          {isOwnProfile && onAddCourse && (
            <button 
              onClick={onAddCourse}
              className="mt-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-sq-sm hover:bg-slate-800 transition-colors"
            >
              Add your first course
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/60 via-stone-50 to-slate-50 border border-slate-200/60 rounded-sq-lg p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Subtle background texture - faded right side */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          maskImage: 'linear-gradient(to right, black 40%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to right, black 40%, transparent 80%)',
        }}
      />
      
      <div className="relative z-10 flex gap-5">
        {/* Left block - Main stat */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-amber-100/80 flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <span className="text-4xl font-bold text-slate-900 tracking-tight">{coursesPlayed}</span>
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1.5">
            Courses played
          </p>
          <p className="text-xs text-slate-500">
            Across {uniqueClubs} clubs
            {newCoursesThisYear > 0 && ` · ${newCoursesThisYear} new this year`}
          </p>
        </div>

        {/* Right block - Milestone progress */}
        <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-sq-sm p-3.5 border border-slate-100/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-slate-600">
                Next milestone
              </span>
            </div>
            {/* Locked badge silhouette */}
            <div className="flex items-center gap-1 opacity-50">
              <Lock className="w-3 h-3 text-slate-400" />
            </div>
          </div>
          
          <div className="mb-2.5">
            <span className="text-xs font-semibold text-amber-700">{nextMilestone.name}</span>
            <span className="text-xs text-slate-500"> · {coursesToNextMilestone} remaining</span>
          </div>

          {/* Animated progress bar with position marker */}
          <div className="relative h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${animatedProgress}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            />
            {/* Position marker */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-amber-500 rounded-full shadow-sm"
              initial={{ left: 0 }}
              animate={{ left: `calc(${animatedProgress}% - 6px)` }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
          
          {/* Progress fraction - tighter spacing */}
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">{progressBase}</span>
            <span className="text-[10px] text-slate-500 font-medium">
              {coursesPlayed} / {nextMilestone.target}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
