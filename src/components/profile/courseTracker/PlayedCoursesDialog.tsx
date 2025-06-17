
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { courseCategories } from "./constants";
import type { PlayedCourse } from "./types";

interface PlayedCoursesDialogProps {
  selectedCategory: string | null;
  playedCourses?: PlayedCourse[];
  onClose: () => void;
}

const PlayedCoursesDialog: React.FC<PlayedCoursesDialogProps> = ({
  selectedCategory,
  playedCourses,
  onClose
}) => {
  return (
    <Dialog open={!!selectedCategory} onOpenChange={onClose}>
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
  );
};

export default PlayedCoursesDialog;
