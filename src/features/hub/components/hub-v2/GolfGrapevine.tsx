/**
 * GolfGrapevine - Ambient Social Strip (Phase 4)
 * Shows golf-relevant activity: check-ins, achievements, reviews
 * Creates FOMO without doom-scrolling
 */

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Trophy, Star, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { haptic } from '@/utils/haptics';

// Activity types for the Grapevine
type ActivityType = 'playing' | 'achievement' | 'review' | 'milestone';

interface GrapevineActivity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  subtitle?: string;
  courseName?: string;
  timestamp: Date;
  link?: string;
}

interface GolfGrapevineProps {
  activities?: GrapevineActivity[];
  isLoading?: boolean;
}

// Mock data generator for demo purposes
function generateMockActivities(): GrapevineActivity[] {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'playing',
      userId: 'user1',
      userName: 'James',
      title: 'Now at Royal Liverpool',
      subtitle: 'Playing 18',
      courseName: 'Royal Liverpool',
      timestamp: new Date(now.getTime() - 15 * 60000),
    },
    {
      id: '2',
      type: 'achievement',
      userId: 'user2',
      userName: 'Sarah',
      title: 'Links Explorer',
      subtitle: '10 links courses played!',
      timestamp: new Date(now.getTime() - 2 * 3600000),
    },
    {
      id: '3',
      type: 'review',
      userId: 'user3',
      userName: 'Tom',
      title: 'Reviewed Gleneagles',
      subtitle: '★★★★★ "Stunning views"',
      courseName: 'Gleneagles',
      timestamp: new Date(now.getTime() - 5 * 3600000),
    },
    {
      id: '4',
      type: 'milestone',
      userId: 'user4',
      userName: 'Emma',
      title: '1 year on Clbhouz!',
      subtitle: 'Golf anniversary 🎉',
      timestamp: new Date(now.getTime() - 12 * 3600000),
    },
  ];
}

// Activity card component
function ActivityCard({ activity }: { activity: GrapevineActivity }) {
  const navigate = useNavigate();
  
  const iconMap: Record<ActivityType, React.ReactNode> = {
    playing: <MapPin className="w-3.5 h-3.5 text-green-500" />,
    achievement: <Trophy className="w-3.5 h-3.5 text-amber-500" />,
    review: <Star className="w-3.5 h-3.5 text-blue-500" />,
    milestone: <Calendar className="w-3.5 h-3.5 text-purple-500" />,
  };
  
  const bgColorMap: Record<ActivityType, string> = {
    playing: 'bg-green-50 border-green-200/50',
    achievement: 'bg-amber-50 border-amber-200/50',
    review: 'bg-blue-50 border-blue-200/50',
    milestone: 'bg-purple-50 border-purple-200/50',
  };
  
  const handleClick = () => {
    haptic('light');
    if (activity.link) {
      navigate(activity.link);
    } else if (activity.userId) {
      navigate(`/golfer/${activity.userId}`);
    }
  };
  
  // Format relative time
  const timeAgo = useMemo(() => {
    const diffMs = Date.now() - activity.timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  }, [activity.timestamp]);

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className={`flex-shrink-0 w-[160px] p-3 rounded-xl border ${bgColorMap[activity.type]} hover:shadow-md transition-shadow`}
    >
      {/* Header with avatar and time */}
      <div className="flex items-center gap-2 mb-2">
        <SquircleAvatar
          size={24}
          src={activity.userAvatar}
          alt={activity.userName}
          fallback={activity.userName.charAt(0)}
          hideRing
        />
        <span className="text-meta font-medium text-foreground truncate flex-1 text-left">
          {activity.userName}
        </span>
        <span className="text-meta text-tertiary">{timeAgo}</span>
      </div>
      
      {/* Content */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{iconMap[activity.type]}</div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-body-sm font-medium text-foreground truncate">
            {activity.title}
          </p>
          {activity.subtitle && (
            <p className="text-meta text-secondary truncate mt-0.5">
              {activity.subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// Skeleton loader for activities
function ActivitySkeleton() {
  return (
    <div className="flex-shrink-0 w-[160px] p-3 rounded-xl bg-muted/30 border border-muted animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-muted" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}

export function GolfGrapevine({ activities, isLoading = false }: GolfGrapevineProps) {
  const [displayActivities, setDisplayActivities] = useState<GrapevineActivity[]>([]);
  
  // Use provided activities or generate mock data
  useEffect(() => {
    if (activities) {
      setDisplayActivities(activities);
    } else {
      // Use mock data for demo
      setDisplayActivities(generateMockActivities());
    }
  }, [activities]);
  
  if (isLoading) {
    return (
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-meta font-semibold text-tertiary uppercase tracking-wide">
            Golf Grapevine
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[1, 2, 3].map((i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  if (displayActivities.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-meta font-semibold text-tertiary uppercase tracking-wide">
          Golf Grapevine
        </h3>
        <button className="flex items-center gap-1 text-meta text-primary-accent hover:underline">
          See all
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      
      {/* Horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        <AnimatePresence mode="popLayout">
          {displayActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <ActivityCard activity={activity} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
