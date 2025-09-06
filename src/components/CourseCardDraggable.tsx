import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { Course, useTopTen } from "@/context/TopTenContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const CourseCardDraggable: React.FC<{ 
  course: Course; 
  children: React.ReactNode;
  showAddButton?: boolean;
}> = ({ course, children, showAddButton = true }) => {
  const { addCourse, isInTopTen } = useTopTen();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `course-${course.id}`,
    data: { course },
  });

  const style = { 
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddToTopTen = (e: React.MouseEvent) => {
    console.log("Button clicked!", e.target);
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    if (isInTopTen(course.id)) {
      console.log("Course already in top 10");
      toast.error("Already in your Top 10");
      return;
    }
    
    console.log("Adding course to top 10:", course.name);
    addCourse(course);
    toast.success(`Added ${course.name} to Top 10`);
  };

  const inTopTen = isInTopTen(course.id);

  return (
    <div className="relative group">
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`${isDragging ? "cursor-grabbing" : "cursor-grab"} touch-manipulation relative`}
      >
        {/* Drag area that excludes the button */}
        <div 
          {...listeners} 
          {...attributes}
          className="absolute inset-0 z-10"
          style={{ 
            bottom: showAddButton ? '32px' : '0', // Leave space for button
            right: showAddButton ? '80px' : '0'   // Leave space for button
          }}
        />
        {children}
      </div>
      
      {showAddButton && (
        <>
          {inTopTen ? (
            <div className="absolute bottom-0 right-0 bg-green-600 text-white w-12 h-12 flex items-center justify-center text-[9px] font-medium shadow-sm z-50"
                 style={{
                   clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
                 }}>
              <span className="translate-x-1 translate-y-1">10</span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddToTopTen}
              className="absolute bottom-2 right-2 h-6 px-2 text-xs transition-opacity z-50 pointer-events-auto bg-muted/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-muted/40 opacity-0 group-hover:opacity-100"
            >
              <Plus className="w-3 h-3 mr-1" />
              add this course to my top 10
            </Button>
          )}
        </>
      )}
    </div>
  );
};