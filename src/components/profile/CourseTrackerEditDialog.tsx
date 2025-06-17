
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit } from "lucide-react";
import { useCourseTrackerEdit } from "./courseTracker/useCourseTrackerEdit";
import CourseSearch from "./courseTracker/CourseSearch";
import CategoryCourseList from "./courseTracker/CategoryCourseList";

interface CourseTrackerEditDialogProps {
  userId: string;
  onTrackerUpdate: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultCategory?: string;
}

const CourseTrackerEditDialog: React.FC<CourseTrackerEditDialogProps> = ({ 
  userId, 
  onTrackerUpdate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultCategory = 'gbi'
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(defaultCategory);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const {
    courses,
    loading,
    handleCourseToggle,
    isCoursePlayed
  } = useCourseTrackerEdit({
    userId,
    open,
    onTrackerUpdate
  });

  const courseCategories = [
    { key: 'gbi', label: 'GB & Ireland' },
    { key: 'europe', label: 'Europe' },
    { key: 'usa', label: 'USA' },
    { key: 'global', label: 'Global' }
  ];

  React.useEffect(() => {
    if (open) {
      setActiveTab(defaultCategory);
    }
  }, [open, defaultCategory]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Courses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Top 100 Courses Played</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center">Loading courses...</div>
        ) : (
          <div className="space-y-4">
            <CourseSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {courseCategories.map(category => (
                  <TabsTrigger key={category.key} value={category.key} className="text-xs">
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {courseCategories.map(category => (
                <CategoryCourseList
                  key={category.key}
                  categoryKey={category.key}
                  courses={courses}
                  searchQuery={searchQuery}
                  isCoursePlayed={isCoursePlayed}
                  onCourseToggle={handleCourseToggle}
                />
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseTrackerEditDialog;
