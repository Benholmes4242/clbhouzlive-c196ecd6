
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CourseTrackerEditDialog from "./CourseTrackerEditDialog";

const courseCategories = [
  { key: 'GB&I', label: 'Top 100 GB & Ireland' },
  { key: 'Europe', label: 'Top 100 Europe' },
  { key: 'USA', label: 'Top 100 USA' },
  { key: 'Global', label: 'Top 100 Global' },
];

interface CourseTrackerProps {
  trackerStats: { [cat: string]: number };
  totalStats: { [cat: string]: number };
  userId?: string;
  isOwnProfile?: boolean;
  trackerVisible?: boolean;
  onVisibilityToggle?: (visible: boolean) => void;
  onTrackerUpdate?: () => void;
}

const CourseTracker: React.FC<CourseTrackerProps> = ({
  trackerStats,
  totalStats,
  userId,
  isOwnProfile = false,
  trackerVisible = true,
  onVisibilityToggle,
  onTrackerUpdate
}) => {
  // If this is not the user's own profile and tracker is not visible, don't render anything
  if (!isOwnProfile && !trackerVisible) {
    return null;
  }

  return (
    <div className="mt-10 px-2">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold">Top 100 Courses Tracker</h2>
        {isOwnProfile && userId && (
          <>
            <CourseTrackerEditDialog 
              userId={userId} 
              onTrackerUpdate={onTrackerUpdate || (() => {})} 
            />
            <div className="flex items-center space-x-2 ml-auto">
              <Checkbox
                id="tracker-visibility"
                checked={trackerVisible}
                onCheckedChange={onVisibilityToggle}
              />
              <Label
                htmlFor="tracker-visibility"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Show this section on my public profile
              </Label>
            </div>
          </>
        )}
      </div>
      
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
};

export default CourseTracker;
