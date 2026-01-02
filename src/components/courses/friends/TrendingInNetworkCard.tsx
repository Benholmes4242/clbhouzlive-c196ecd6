import React from 'react';
import { Card } from '@/components/ui/card';
import { Squircle } from '@/components/ui/squircle';
import { Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
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
    <Card className="bg-card border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 border border-amber-200/80">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
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
          <div
            key={course.course_id}
            onClick={() => navigate(`/courses/${course.course_id}`)}
            className={`px-4 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer ${
              index !== trendingCourses.length - 1 ? 'border-b border-border/40' : ''
            }`}
          >
            {/* Course thumbnail */}
            <Squircle width={48} height={48} className="shrink-0">
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
              <p className="text-xs text-slate-500 truncate">
                {course.country}{course.sub_country ? `, ${course.sub_country}` : ''}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Last played {formatDistanceToNow(new Date(course.most_recent_play), { addSuffix: true })}
              </p>
            </div>

            {/* Friends count pill - neutral style */}
            <span className="shrink-0 self-center inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              {course.total_friends_played} friend{course.total_friends_played !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TrendingInNetworkCard;
