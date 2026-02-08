import React from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CourseWithFriends } from '@/hooks/useFriendsCourses';

interface TrendingInNetworkCardProps {
  courses: CourseWithFriends[];
}

const TrendingInNetworkCard: React.FC<TrendingInNetworkCardProps> = ({ courses }) => {
  const navigate = useNavigate();

  if (courses.length === 0) {
    return null;
  }

  // Take top 3 trending courses
  const trendingCourses = courses.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-200/80">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Trending in your network</h3>
              <p className="text-[11px] text-muted-foreground">Courses multiple friends played recently</p>
            </div>
          </div>
        </div>

        {/* Course rows */}
        <div>
          {trendingCourses.map((course, index) => (
            <motion.div
              key={course.course_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
              onClick={() => navigate(`/courses/${course.course_id}`)}
              className={`px-4 py-3.5 flex items-center gap-3 hover:bg-muted/40 active:bg-muted/60 active:scale-[0.98] transition-all cursor-pointer ${
                index !== trendingCourses.length - 1 ? 'border-b border-border/40' : ''
              }`}
            >
              {/* Course thumbnail with consistent border-radius */}
              <Squircle width={48} height={48} className="shrink-0 ring-1 ring-border/30">
                <img
                  src={course.thumbnail_url || '/placeholder.svg'}
                  alt={course.course_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </Squircle>

              {/* Course info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{course.course_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
                </p>
                <p className="text-xs text-muted-foreground/75 mt-0.5">
                  Last played {formatDistanceToNow(new Date(course.most_recent_play), { addSuffix: true })}
                </p>
              </div>

              {/* Friends count pill */}
              <span className="shrink-0 self-center inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                {course.total_friends_played} friend{course.total_friends_played !== 1 ? 's' : ''}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default TrendingInNetworkCard;
