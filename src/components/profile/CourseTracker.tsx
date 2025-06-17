
import React, { useState } from "react";
import { usePlayedCourses } from "./courseTracker/usePlayedCourses";
import CourseTrackerHeader from "./courseTracker/CourseTrackerHeader";
import CourseCategoryGrid from "./courseTracker/CourseCategoryGrid";
import PlayedCoursesDialog from "./courseTracker/PlayedCoursesDialog";
import type { CourseTrackerProps } from "./courseTracker/types";

const CourseTracker: React.FC<CourseTrackerProps> = ({
  trackerStats,
  totalStats,
  userId,
  isOwnProfile = false,
  trackerVisible = true,
  onVisibilityToggle,
  onTrackerUpdate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogCategory, setEditDialogCategory] = useState<string>('gbi');

  // Fetch played courses for the selected category - this will show courses to other users
  const { data: playedCourses } = usePlayedCourses(userId, selectedCategory);

  // If this is not the user's own profile and tracker is not visible, don't render anything
  if (!isOwnProfile && !trackerVisible) {
    return null;
  }

  const handleCategoryClick = (categoryKey: string) => {
    if (isOwnProfile) {
      // For own profile, open edit dialog with selected category
      const dialogCategoryMap: { [key: string]: string } = {
        'GB&I': 'gbi',
        'Europe': 'europe', 
        'USA': 'usa',
        'Global': 'global'
      };
      setEditDialogCategory(dialogCategoryMap[categoryKey] || 'gbi');
      setEditDialogOpen(true);
    } else {
      // For other profiles, show played courses
      setSelectedCategory(categoryKey);
    }
  };

  const closeDialog = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="mt-10 px-2">
      <CourseTrackerHeader
        isOwnProfile={isOwnProfile}
        userId={userId}
        trackerVisible={trackerVisible}
        onVisibilityToggle={onVisibilityToggle}
        onTrackerUpdate={onTrackerUpdate || (() => {})}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        editDialogCategory={editDialogCategory}
      />
      
      <CourseCategoryGrid
        trackerStats={trackerStats}
        totalStats={totalStats}
        onCategoryClick={handleCategoryClick}
      />

      {/* Dialog for showing played courses (only for non-own profiles) */}
      <PlayedCoursesDialog
        selectedCategory={selectedCategory}
        playedCourses={playedCourses}
        onClose={closeDialog}
      />
    </div>
  );
};

export default CourseTracker;
