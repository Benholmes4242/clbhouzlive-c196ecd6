
import React from "react";
import { Progress } from "@/components/ui/progress";

const courseCategories = [
  { key: 'GB&I', label: 'Top 100 GB & Ireland' },
  { key: 'Europe', label: 'Top 100 Europe' },
  { key: 'USA', label: 'Top 100 USA' },
  { key: 'Global', label: 'Top 100 Global' },
];

interface CourseTrackerProps {
  trackerStats: { [cat: string]: number };
  totalStats: { [cat: string]: number };
}

const CourseTracker: React.FC<CourseTrackerProps> = ({
  trackerStats,
  totalStats
}) => (
  <div className="mt-10 px-2">
    <h2 className="text-lg font-semibold mb-3">Top 100 Courses Tracker</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {courseCategories.map(cat => {
        const played = trackerStats[cat.key] || 0;
        const total = totalStats[cat.key] || 100;
        const percentage = Math.round((played / total) * 100);
        return (
          <div key={cat.key} className="bg-muted/70 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{cat.label}</span>
              <span className="text-xs font-semibold">{played} / {total}</span>
            </div>
            <Progress value={percentage} className="mt-2" />
            <div className="mt-2 text-xs text-muted-foreground">{percentage}% completed</div>
          </div>
        );
      })}
    </div>
  </div>
);

export default CourseTracker;
