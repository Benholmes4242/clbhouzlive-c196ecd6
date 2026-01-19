/**
 * CompactRecentActivity - Dense activity feed
 * 35% row height reduction, subtle dividers
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentCourse {
  id: string;
  name: string;
  region: string;
  dateAdded?: string;
}

interface CompactRecentActivityProps {
  courses: RecentCourse[];
  maxItems?: number;
}

export const CompactRecentActivity: React.FC<CompactRecentActivityProps> = ({
  courses,
  maxItems = 5,
}) => {
  const navigate = useNavigate();
  
  if (courses.length === 0) return null;

  const displayCourses = courses.slice(0, maxItems);
  const hasMore = courses.length > maxItems;

  return (
    <section>
      <h2 className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-2">
        Recently Added
      </h2>

      <div className="space-y-0">
        {displayCourses.map((course, index) => (
          <motion.button
            key={course.id}
            className="w-full flex items-center gap-2.5 py-2 text-left transition-colors hover:bg-slate-50/60"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => navigate(`/courses/${course.id}`)}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ 
                background: 'rgba(210, 180, 97, 0.1)',
              }}
            >
              <Trophy className="w-3 h-3" style={{ color: 'var(--quest-accent-gold)' }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                {course.name}
              </p>
            </div>
            
            {course.dateAdded && (
              <span className="text-[10px] text-slate-400 flex-shrink-0">
                {course.dateAdded}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Divider between rows (optional subtle lines) */}
      
      {hasMore && (
        <button
          onClick={() => navigate('/profile?tab=courses')}
          className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </section>
  );
};

export default CompactRecentActivity;
