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
    e.stopPropagation();
    e.preventDefault();
    
    if (isInTopTen(course.id)) {
      toast.error("Already in your Top 10");
      return;
    }
    
    addCourse(course);
    toast.success(`Added ${course.name} to Top 10`);
  };

  const inTopTen = isInTopTen(course.id);

  return (
    <div className="relative group">
      <div 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes} 
        className={`${isDragging ? "cursor-grabbing" : "cursor-grab"} touch-manipulation`}
      >
        {children}
      </div>
      
      {showAddButton && (
        <Button
          size="sm"
          variant={inTopTen ? "secondary" : "default"}
          disabled={inTopTen}
          onClick={handleAddToTopTen}
          className={`absolute top-2 right-2 h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
            inTopTen ? "bg-green-100 text-green-700 border-green-200" : ""
          }`}
        >
          {inTopTen ? (
            "✓ Top 10"
          ) : (
            <>
              <Plus className="w-3 h-3 mr-1" />
              Top 10
            </>
          )}
        </Button>
      )}
    </div>
  );
};