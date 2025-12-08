import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { CourseImpactEntry } from '@/lib/mockHandicapData';

interface CourseImpactCardProps {
  toughest: CourseImpactEntry[];
  best: CourseImpactEntry[];
}

const CourseImpactCard: React.FC<CourseImpactCardProps> = ({ toughest, best }) => {
  return (
    <section className="bg-muted border border-border rounded-sq-md p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Course Impact</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Where you've picked up or dropped the most shots
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Toughest courses */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Toughest Courses
            </span>
          </div>
          <ul className="space-y-2">
            {toughest.map((course, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate pr-2">
                  {course.courseName}
                </span>
                <span className="text-sm font-medium text-red-500 whitespace-nowrap">
                  +{course.delta.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Best scoring */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingDown className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Best Scoring
            </span>
          </div>
          <ul className="space-y-2">
            {best.map((course, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate pr-2">
                  {course.courseName}
                </span>
                <span className="text-sm font-medium text-emerald-600 whitespace-nowrap">
                  {course.delta.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default CourseImpactCard;
