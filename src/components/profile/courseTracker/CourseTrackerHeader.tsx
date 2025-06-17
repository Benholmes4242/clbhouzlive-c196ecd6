
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CourseTrackerEditDialog from "../CourseTrackerEditDialog";

interface CourseTrackerHeaderProps {
  isOwnProfile: boolean;
  userId?: string;
  trackerVisible: boolean;
  onVisibilityToggle?: (visible: boolean) => void;
  onTrackerUpdate: () => void;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  editDialogCategory: string;
}

const CourseTrackerHeader: React.FC<CourseTrackerHeaderProps> = ({
  isOwnProfile,
  userId,
  trackerVisible,
  onVisibilityToggle,
  onTrackerUpdate,
  editDialogOpen,
  setEditDialogOpen,
  editDialogCategory
}) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-lg font-semibold">Top 100 Courses Tracker</h2>
      {isOwnProfile && userId && (
        <>
          <CourseTrackerEditDialog 
            userId={userId} 
            onTrackerUpdate={onTrackerUpdate}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            defaultCategory={editDialogCategory}
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
  );
};

export default CourseTrackerHeader;
