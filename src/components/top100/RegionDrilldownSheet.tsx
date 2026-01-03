import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Globe2, Flag, Map, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Top100ListProgress } from '@/hooks/useTop100ProgressForUser';

interface RegionDrilldownSheetProps {
  list: Top100ListProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onViewCourses?: (filter: 'played' | 'unplayed') => void;
  playedCourseIds?: Set<string>;
  allCourses?: Array<{
    id: string;
    name: string;
    country: string;
    rank: number;
    thumbnailUrl?: string;
  }>;
}

function getRegionIcon(slug: string) {
  const iconClass = "w-5 h-5";
  switch (slug) {
    case 'global':
      return <Globe2 className={iconClass} />;
    case 'gb-i':
    case 'usa':
      return <Flag className={iconClass} />;
    case 'europe':
    default:
      return <Map className={iconClass} />;
  }
}

function getShortDisplayName(slug: string): string {
  switch (slug) {
    case 'global':
      return 'World Top 100';
    case 'gb-i':
      return 'GB&I Top 100';
    case 'usa':
      return 'USA Top 100';
    case 'europe':
      return 'Europe Top 100';
    default:
      return 'Top 100';
  }
}

/**
 * Region Drilldown Sheet (D4)
 * 
 * Bottom sheet showing:
 * - Region name + completion summary
 * - Tabs for Played / Remaining lists
 * - Progress to region badge
 */
export function RegionDrilldownSheet({
  list,
  isOpen,
  onClose,
  onViewCourses,
  playedCourseIds = new Set(),
  allCourses = [],
}: RegionDrilldownSheetProps) {
  const [activeTab, setActiveTab] = React.useState<'played' | 'remaining'>('played');

  if (!list) return null;

  const displayName = getShortDisplayName(list.listSlug);
  const progressPercent = list.total > 0 ? Math.round((list.played / list.total) * 100) : 0;
  const remaining = list.total - list.played;

  // Filter courses by played status
  const playedCourses = allCourses.filter(c => playedCourseIds.has(c.id));
  const remainingCourses = allCourses.filter(c => !playedCourseIds.has(c.id));
  const displayCourses = activeTab === 'played' ? playedCourses : remainingCourses;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-sq-sm bg-muted/50 flex items-center justify-center text-muted-foreground">
                  {getRegionIcon(list.listSlug)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {displayName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {list.played} / {list.total} played
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress to completion</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('played')}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'played'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Played ({list.played})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('remaining')}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'remaining'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Remaining ({remaining})
              </button>
            </div>

            {/* Course list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {displayCourses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'played' 
                      ? 'No courses played yet in this region'
                      : 'All courses complete!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayCourses.slice(0, 20).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-3 p-2 rounded-sq-sm hover:bg-muted/50 transition-colors"
                    >
                      {/* Rank badge */}
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                        {course.rank}
                      </div>

                      {/* Thumbnail */}
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt=""
                          className="w-12 h-12 rounded-sq-sm object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-sq-sm bg-muted flex-shrink-0" />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {course.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {course.country}
                        </p>
                      </div>

                      {/* Played indicator */}
                      {playedCourseIds.has(course.id) && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}

                  {displayCourses.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{displayCourses.length - 20} more courses
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="px-6 pb-6 pt-2 border-t border-border flex-shrink-0">
              <Button
                onClick={() => {
                  onViewCourses?.(activeTab === 'played' ? 'played' : 'unplayed');
                  onClose();
                }}
                className="w-full rounded-full"
              >
                View all {activeTab === 'played' ? 'played' : 'remaining'} courses
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}