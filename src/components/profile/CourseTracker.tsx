
import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch played courses for the selected category
  const { data: playedCourses } = useQuery({
    queryKey: ['playedCourses', userId, selectedCategory],
    queryFn: async () => {
      if (!userId || !selectedCategory) return [];
      
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          *,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank
          )
        `)
        .eq('user_id', userId)
        .eq('played', true);

      if (error) throw error;
      
      // Filter by category based on ranks
      const filtered = data?.filter(course => {
        const golfCourse = course.golf_courses;
        if (!golfCourse) return false;
        
        switch (selectedCategory) {
          case 'Global':
            return golfCourse.global_rank && golfCourse.global_rank <= 100;
          case 'GB&I':
            return golfCourse.regional_rank && golfCourse.regional_rank <= 100 && 
                   (golfCourse.country === 'Scotland' || golfCourse.country === 'England' || 
                    golfCourse.country === 'Wales' || golfCourse.country === 'Northern Ireland' ||
                    golfCourse.country === 'Ireland');
          case 'Europe':
            return golfCourse.regional_rank && golfCourse.regional_rank <= 100 && 
                   golfCourse.continent === 'Europe';
          case 'USA':
            return golfCourse.regional_rank && golfCourse.regional_rank <= 100 && 
                   golfCourse.country === 'United States';
          default:
            return false;
        }
      }) || [];
      
      return filtered;
    },
    enabled: !!userId && !!selectedCategory,
  });

  // If this is not the user's own profile and tracker is not visible, don't render anything
  if (!isOwnProfile && !trackerVisible) {
    return null;
  }

  const handleCategoryClick = (categoryKey: string) => {
    if (isOwnProfile) {
      // For own profile, open edit dialog
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
            <div 
              key={cat.key} 
              className="bg-muted/70 rounded-lg p-4 cursor-pointer hover:bg-muted/90 transition-colors"
              onClick={() => handleCategoryClick(cat.key)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{cat.label}</span>
                <span className="text-xs font-semibold">{played} / {total}</span>
              </div>
              <Progress value={percentage} className="mt-2" />
            </div>
          );
        })}
      </div>

      {/* Dialog for showing played courses (only for non-own profiles) */}
      <Dialog open={!!selectedCategory} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory && courseCategories.find(cat => cat.key === selectedCategory)?.label} - Played Courses
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {playedCourses && playedCourses.length > 0 ? (
                playedCourses.map((course) => (
                  <div key={course.id} className="border-b border-border pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{course.golf_courses?.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {course.golf_courses?.region}, {course.golf_courses?.country}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{selectedCategory === 'Global' ? course.golf_courses?.global_rank : course.golf_courses?.regional_rank}
                      </div>
                    </div>
                    {course.played_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Played: {new Date(course.played_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No courses played in this category yet.
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseTracker;
